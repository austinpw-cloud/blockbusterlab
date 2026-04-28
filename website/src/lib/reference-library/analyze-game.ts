/**
 * Reference Library 게임 단위 ASO 수법 합성 실행 모듈 (L2).
 *
 * L1(아이콘·텍스트·스크린샷 슬롯별) 결과 + 게임 메타 + 수익모델 힌트 를
 * Opus 4.6 으로 합성해 reference_games.aso_analysis 에 저장.
 *
 * 관심 한정: "이 게임이 ASO 를 어떻게 했길래 잘 작동했나".
 * v2.6 이후 리뷰·평점 테마는 분석 대상 아님 (게임성·운영 신호라 ASO 해석에 방해).
 * 모델 Opus 선택 이유: L2 해석 품질이 L3 패턴·의뢰 가이드의 바닥을 결정.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { complete, parseJsonResponse } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import {
  GAME_ASO_SYNTHESIS_SYSTEM_PROMPT,
  buildGameAsoSynthesisPrompt,
} from "./analyze-game-prompt";

/** Opus 4.6: $15/M input, $75/M output (공개 기준) */
function estimateOpusCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 15 + (outputTokens / 1_000_000) * 75;
}

export type GameSynthesisProgress = {
  total: number;
  processed: number;
  analyzed: number;
  failed: number;
  total_cost_usd: number;
  errors: string[];
};

type GameRow = {
  id: string;
  title: string;
  genre: string;
  country: string;
  target_markets: string[] | null;
  monetization_model: string | null;
  studio_size: string | null;
  selection_basis: string | null;
  icon_analysis: Record<string, unknown> | null;
  text_analysis: Record<string, unknown> | null;
  monetization: Record<string, unknown> | null;
  video_url: string | null;
};

type SlotRow = {
  game_id: string;
  slot_number: number;
  analysis: Record<string, unknown> | null;
};

async function analyzeOneGame(
  admin: ReturnType<typeof createAdminClient>,
  game: GameRow,
  slots: SlotRow[]
): Promise<{ ok: boolean; cost_usd: number; error?: string }> {
  // L1 결과 최소 요구사항 확인. 전부 비어있으면 L2 합성이 공허해짐.
  const hasIcon = game.icon_analysis !== null;
  const hasText = game.text_analysis !== null;
  const hasSlots = slots.length > 0 && slots.some((s) => s.analysis !== null);

  if (!hasIcon && !hasText && !hasSlots) {
    return {
      ok: false,
      cost_usd: 0,
      error: "L1 분석 결과 없음 (아이콘·텍스트·슬롯 모두 null). 먼저 L1 실행 필요",
    };
  }

  try {
    const userMessage = buildGameAsoSynthesisPrompt({
      title: game.title,
      genre: game.genre,
      country: game.country,
      target_markets: game.target_markets,
      monetization_model: game.monetization_model,
      studio_size: game.studio_size,
      selection_basis: game.selection_basis,
      icon_analysis: game.icon_analysis,
      text_analysis: game.text_analysis,
      screenshot_slots: slots.map((s) => ({
        slot_number: s.slot_number,
        analysis: s.analysis,
      })),
      monetization_raw: game.monetization,
      has_video: !!game.video_url,
    });

    const completion = await complete({
      model: MODELS.OPUS,
      system: GAME_ASO_SYNTHESIS_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 8000,
      temperature: 0.3,
    });

    const cost = estimateOpusCost(
      completion.input_tokens,
      completion.output_tokens
    );

    if (completion.stop_reason === "max_tokens") {
      return {
        ok: false,
        cost_usd: cost,
        error: `응답 토큰 한도 초과 (max_tokens). output_tokens=${completion.output_tokens}`,
      };
    }

    let analysis: Record<string, unknown>;
    try {
      analysis = parseJsonResponse<Record<string, unknown>>(completion.text);
    } catch (e) {
      return {
        ok: false,
        cost_usd: cost,
        error: `JSON 파싱 실패 (cost=$${cost.toFixed(4)} 이미 청구됨): ${e instanceof Error ? e.message : String(e)}`,
      };
    }

    const { error: upErr } = await admin
      .from("reference_games")
      .update({
        aso_analysis: analysis,
        aso_analysis_cost_usd: cost,
        aso_analyzed_at: new Date().toISOString(),
      })
      .eq("id", game.id);

    if (upErr) {
      return { ok: false, cost_usd: cost, error: `DB update: ${upErr.message}` };
    }

    return { ok: true, cost_usd: cost };
  } catch (e) {
    return {
      ok: false,
      cost_usd: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * aso_analyzed_at 이 null 인 게임들을 L2 합성.
 *
 * @param limit 최대 몇 개 처리 (null = 전체)
 * @param genre 특정 장르만
 * @param country 특정 국가만
 * @param onProgress 진행 콜백
 */
export async function synthesizeUnanalyzedGames(
  limit: number | null = null,
  genre: string | null = null,
  country: string | null = null,
  onProgress?: (p: GameSynthesisProgress) => void
): Promise<GameSynthesisProgress> {
  const admin = createAdminClient();

  let query = admin
    .from("reference_games")
    .select(
      `id, title, genre, country,
       target_markets, monetization_model, studio_size, selection_basis,
       icon_analysis, text_analysis, monetization, video_url`
    )
    .is("aso_analyzed_at", null);

  if (genre) query = query.eq("genre", genre);
  if (country) query = query.eq("country", country);
  if (limit) query = query.limit(limit);

  const { data: items, error } = await query;
  if (error) throw new Error(`게임 목록 조회 실패: ${error.message}`);

  const games = (items ?? []) as GameRow[];

  const progress: GameSynthesisProgress = {
    total: games.length,
    processed: 0,
    analyzed: 0,
    failed: 0,
    total_cost_usd: 0,
    errors: [],
  };
  onProgress?.(progress);

  // 게임별 슬롯 분석을 미리 일괄 조회 (N+1 회피)
  const gameIds = games.map((g) => g.id);
  let slotsByGame: Map<string, SlotRow[]> = new Map();
  if (gameIds.length > 0) {
    const { data: slotsData, error: slotsErr } = await admin
      .from("reference_screenshots")
      .select("game_id, slot_number, analysis")
      .in("game_id", gameIds);

    if (slotsErr) {
      throw new Error(`슬롯 조회 실패: ${slotsErr.message}`);
    }

    const rows = (slotsData ?? []) as SlotRow[];
    slotsByGame = new Map();
    for (const s of rows) {
      const arr = slotsByGame.get(s.game_id) ?? [];
      arr.push(s);
      slotsByGame.set(s.game_id, arr);
    }
  }

  // Opus 는 단가 높고 처리 시간 길어 동시성 보수적.
  const CONCURRENCY = 2;
  for (let i = 0; i < games.length; i += CONCURRENCY) {
    const batch = games.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((g) =>
        analyzeOneGame(admin, g, slotsByGame.get(g.id) ?? [])
      )
    );

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      progress.processed++;
      progress.total_cost_usd += r.cost_usd;
      if (r.ok) {
        progress.analyzed++;
      } else {
        progress.failed++;
        progress.errors.push(`${batch[j].title}: ${r.error}`);
      }
    }
    onProgress?.(progress);
  }

  return progress;
}
