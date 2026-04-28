/**
 * Reference Library 패턴·인사이트 합성 실행 모듈 (L3).
 *
 * 축 조합에 매칭되는 게임들의 L1+L2 결과를 Opus 로 합성해
 * library_patterns 테이블에 upsert.
 *
 * 축 조합 키 형식: "genre=<g>;market=<m>;monetization=<mo>;studio_size=<s>"
 * 조건 무시는 '*'. 예: "genre=puzzle;market=kr;monetization=*;studio_size=*"
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { complete, parseJsonResponse } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import {
  PATTERN_SYNTHESIS_SYSTEM_PROMPT,
  buildPatternSynthesisPrompt,
  type GameForSynthesis,
} from "./synthesize-patterns-prompt";

function estimateOpusCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 15 + (outputTokens / 1_000_000) * 75;
}

export type AxisFilter = {
  genre: string;
  market?: string | null;
  monetization_model?: string | null;
  studio_size?: string | null;
};

/**
 * AxisFilter 를 정규화된 axis_key 문자열로.
 * null/undefined = '*' (조건 무시).
 */
export function buildAxisKey(filter: AxisFilter): string {
  const g = filter.genre;
  const m = filter.market ?? "*";
  const mo = filter.monetization_model ?? "*";
  const s = filter.studio_size ?? "*";
  return `genre=${g};market=${m};monetization=${mo};studio_size=${s}`;
}

/**
 * sample_size → confidence 매핑.
 * high (n>=8) | medium (n>=4) | low (n>=2). n<2 는 합성 생략.
 */
function computeConfidence(n: number): "high" | "medium" | "low" | null {
  if (n >= 8) return "high";
  if (n >= 4) return "medium";
  if (n >= 2) return "low";
  return null;
}

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
  aso_analysis: Record<string, unknown> | null;
  video_url: string | null;
};

type SlotRow = {
  game_id: string;
  slot_number: number;
  analysis: Record<string, unknown> | null;
};

/**
 * 축 필터에 매칭되는 reference_games 조회.
 * - genre: 엄격 매칭
 * - market: country 컬럼과 매칭 (스토어 로컬 리스팅 기준)
 * - monetization_model, studio_size: 엄격 매칭
 */
async function fetchMatchingGames(
  admin: ReturnType<typeof createAdminClient>,
  filter: AxisFilter
): Promise<GameRow[]> {
  let q = admin
    .from("reference_games")
    .select(
      `id, title, genre, country,
       target_markets, monetization_model, studio_size, selection_basis,
       icon_analysis, text_analysis, aso_analysis, video_url`
    )
    .eq("genre", filter.genre)
    // L2 끝난 게임만 합성 재료로 사용 — L3 품질의 바닥
    .not("aso_analyzed_at", "is", null);

  if (filter.market) q = q.eq("country", filter.market);
  if (filter.monetization_model)
    q = q.eq("monetization_model", filter.monetization_model);
  if (filter.studio_size) q = q.eq("studio_size", filter.studio_size);

  const { data, error } = await q;
  if (error) throw new Error(`매칭 게임 조회 실패: ${error.message}`);
  return (data ?? []) as GameRow[];
}

async function fetchSlotsForGames(
  admin: ReturnType<typeof createAdminClient>,
  gameIds: string[]
): Promise<Map<string, SlotRow[]>> {
  const map = new Map<string, SlotRow[]>();
  if (gameIds.length === 0) return map;

  const { data, error } = await admin
    .from("reference_screenshots")
    .select("game_id, slot_number, analysis")
    .in("game_id", gameIds);

  if (error) throw new Error(`슬롯 조회 실패: ${error.message}`);

  const rows = (data ?? []) as SlotRow[];
  for (const s of rows) {
    const arr = map.get(s.game_id) ?? [];
    arr.push(s);
    map.set(s.game_id, arr);
  }
  return map;
}

export type SynthesisResult = {
  axis_key: string;
  ok: boolean;
  sample_size: number;
  confidence?: "high" | "medium" | "low";
  cost_usd: number;
  error?: string;
};

/**
 * 단일 축 조합 합성.
 */
export async function synthesizeOnePattern(
  filter: AxisFilter
): Promise<SynthesisResult> {
  const axis_key = buildAxisKey(filter);
  const admin = createAdminClient();

  let games: GameRow[];
  try {
    games = await fetchMatchingGames(admin, filter);
  } catch (e) {
    return {
      axis_key,
      ok: false,
      sample_size: 0,
      cost_usd: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const sample_size = games.length;
  const confidence = computeConfidence(sample_size);

  if (!confidence) {
    return {
      axis_key,
      ok: false,
      sample_size,
      cost_usd: 0,
      error: `표본 부족 (n=${sample_size}, 최소 2 필요)`,
    };
  }

  const slotsByGame = await fetchSlotsForGames(
    admin,
    games.map((g) => g.id)
  );

  const compressed: GameForSynthesis[] = games.map((g) => ({
    title: g.title,
    genre: g.genre,
    country: g.country,
    target_markets: g.target_markets,
    monetization_model: g.monetization_model,
    studio_size: g.studio_size,
    selection_basis: g.selection_basis,
    icon_analysis: g.icon_analysis,
    text_analysis: g.text_analysis,
    aso_analysis: g.aso_analysis,
    has_video: !!g.video_url,
    screenshot_slots: slotsByGame.get(g.id) ?? [],
  }));

  // n>=4 에서만 decision_rules 등 "규칙" 필드 생성 허용.
  // n=2~3 은 관찰 요약만 저장 (Codex 피드백: 소수 샘플의 규칙 일반화는 예외의 일반화 위험).
  const allow_rules = sample_size >= 3;

  const userMessage = buildPatternSynthesisPrompt({
    axis_scope: {
      genre: filter.genre,
      market: filter.market ?? null,
      monetization_model: filter.monetization_model ?? null,
      studio_size: filter.studio_size ?? null,
    },
    games: compressed,
    allow_rules,
  });

  try {
    const completion = await complete({
      model: MODELS.OPUS,
      system: PATTERN_SYNTHESIS_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 12000,
      temperature: 0.3,
    });

    const cost = estimateOpusCost(
      completion.input_tokens,
      completion.output_tokens
    );

    if (completion.stop_reason === "max_tokens") {
      return {
        axis_key,
        ok: false,
        sample_size,
        confidence,
        cost_usd: cost,
        error: `응답 토큰 한도 초과 (max_tokens). output_tokens=${completion.output_tokens}`,
      };
    }

    let patterns: Record<string, unknown>;
    try {
      patterns = parseJsonResponse<Record<string, unknown>>(completion.text);
    } catch (e) {
      return {
        axis_key,
        ok: false,
        sample_size,
        confidence,
        cost_usd: cost,
        error: `JSON 파싱 실패 (cost=$${cost.toFixed(4)} 이미 청구됨): ${e instanceof Error ? e.message : String(e)}`,
      };
    }

    // 안전망: allow_rules=false 면 Opus 가 프롬프트를 무시하고 규칙을 채웠더라도 강제로 비움
    if (!allow_rules) {
      patterns.decision_rules = [];
      patterns.edge_cases_and_exceptions = [];
      patterns.anti_patterns_observed = [];
      patterns.cross_axis_interactions = [];
    }

    // upsert library_patterns
    const { error: upErr } = await admin.from("library_patterns").upsert(
      {
        axis_key,
        genre: filter.genre,
        market: filter.market ?? null,
        monetization_model: filter.monetization_model ?? null,
        studio_size: filter.studio_size ?? null,
        patterns,
        sample_game_ids: games.map((g) => g.id),
        sample_size,
        confidence,
        synthesized_at: new Date().toISOString(),
        synthesis_cost_usd: cost,
        model_used: MODELS.OPUS,
        pending_commission_insights: 0,
      },
      { onConflict: "axis_key" }
    );

    if (upErr) {
      return {
        axis_key,
        ok: false,
        sample_size,
        confidence,
        cost_usd: cost,
        error: `DB upsert: ${upErr.message}`,
      };
    }

    return { axis_key, ok: true, sample_size, confidence, cost_usd: cost };
  } catch (e) {
    return {
      axis_key,
      ok: false,
      sample_size,
      confidence,
      cost_usd: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Tier A 일괄 합성 — 장르 × 시장 (market 축까지만 지정, 수익·규모는 *)
 *
 * @param genres 합성할 장르 목록 (없으면 reference_games 에 존재하는 전체 장르)
 * @param markets 합성할 시장 목록 (없으면 기본 kr/us/jp/cn)
 * @param onProgress 진행 콜백
 */
export async function synthesizeTierA(
  genres: string[] | null = null,
  markets: string[] = ["kr", "us", "jp", "cn"],
  onProgress?: (r: SynthesisResult, index: number, total: number) => void
): Promise<{
  results: SynthesisResult[];
  total_cost_usd: number;
  succeeded: number;
  skipped: number;
  failed: number;
}> {
  const admin = createAdminClient();

  // 장르 목록 결정
  let genreList = genres;
  if (!genreList) {
    const { data, error } = await admin
      .from("reference_games")
      .select("genre")
      .not("aso_analyzed_at", "is", null);
    if (error) throw new Error(`장르 조회 실패: ${error.message}`);
    const seen = new Set<string>();
    for (const r of (data ?? []) as Array<{ genre: string }>) seen.add(r.genre);
    genreList = Array.from(seen);
  }

  const filters: AxisFilter[] = [];
  for (const g of genreList) {
    for (const m of markets) {
      filters.push({ genre: g, market: m });
    }
  }

  const results: SynthesisResult[] = [];
  let succeeded = 0;
  let skipped = 0;
  let failed = 0;
  let total_cost = 0;

  // 순차 실행 (Opus · DB · API 부하 관리). 병렬은 추후 필요 시.
  for (let i = 0; i < filters.length; i++) {
    const r = await synthesizeOnePattern(filters[i]);
    results.push(r);
    total_cost += r.cost_usd;
    if (r.ok) succeeded++;
    else if (r.error?.startsWith("표본 부족")) skipped++;
    else failed++;
    onProgress?.(r, i + 1, filters.length);
  }

  return {
    results,
    total_cost_usd: total_cost,
    succeeded,
    skipped,
    failed,
  };
}
