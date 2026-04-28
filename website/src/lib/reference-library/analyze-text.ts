/**
 * Reference Library 텍스트(제목·서브·설명) ASO 분석 실행 모듈 (L1).
 *
 * reference_games 중 text_analyzed_at 이 null 인 것을 Sonnet 으로 텍스트 전용 분석.
 * Vision 없음.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { complete, parseJsonResponse } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import {
  TEXT_ANALYSIS_SYSTEM_PROMPT,
  buildTextAnalysisPrompt,
} from "./analyze-text-prompt";

/** Sonnet 4.6: $3/M input, $15/M output */
function estimateSonnetCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
}

export type TextAnalyzeProgress = {
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
  short_description: string | null;
  full_description: string | null;
  target_markets: string[] | null;
};

async function analyzeOneText(
  admin: ReturnType<typeof createAdminClient>,
  game: GameRow
): Promise<{ ok: boolean; cost_usd: number; error?: string }> {
  // 최소 조건: title 은 항상 존재. short/full 중 하나라도 있어야 의미 있음.
  if (!game.short_description && !game.full_description) {
    return {
      ok: false,
      cost_usd: 0,
      error: "short_description 과 full_description 모두 없음 — 분석 불가",
    };
  }

  try {
    const completion = await complete({
      model: MODELS.SONNET,
      system: TEXT_ANALYSIS_SYSTEM_PROMPT,
      userMessage: buildTextAnalysisPrompt({
        game_title: game.title,
        genre: game.genre,
        country: game.country,
        title_text: game.title,
        short_description: game.short_description,
        full_description: game.full_description,
        target_markets: game.target_markets ?? undefined,
      }),
      maxTokens: 3000,
      temperature: 0.3,
    });

    const cost = estimateSonnetCost(
      completion.input_tokens,
      completion.output_tokens
    );

    const analysis = parseJsonResponse<Record<string, unknown>>(completion.text);

    const { error: upErr } = await admin
      .from("reference_games")
      .update({
        text_analysis: analysis,
        text_analysis_cost_usd: cost,
        text_analyzed_at: new Date().toISOString(),
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
 * 미분석 텍스트 N개 분석 (배치).
 *
 * @param limit 최대 몇 개 처리 (null = 전체)
 * @param genre 특정 장르만
 * @param country 특정 국가만
 * @param onProgress 진행 콜백
 */
export async function analyzeUnanalyzedTexts(
  limit: number | null = null,
  genre: string | null = null,
  country: string | null = null,
  onProgress?: (p: TextAnalyzeProgress) => void
): Promise<TextAnalyzeProgress> {
  const admin = createAdminClient();

  let query = admin
    .from("reference_games")
    .select(
      "id, title, genre, country, short_description, full_description, target_markets"
    )
    .is("text_analyzed_at", null);

  if (genre) query = query.eq("genre", genre);
  if (country) query = query.eq("country", country);
  if (limit) query = query.limit(limit);

  const { data: items, error } = await query;
  if (error) throw new Error(`목록 조회 실패: ${error.message}`);

  const rows = (items ?? []) as GameRow[];

  const progress: TextAnalyzeProgress = {
    total: rows.length,
    processed: 0,
    analyzed: 0,
    failed: 0,
    total_cost_usd: 0,
    errors: [],
  };
  onProgress?.(progress);

  // 텍스트 전용이라 Vision 보다 여유. 동시성 5
  const CONCURRENCY = 5;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((row) => analyzeOneText(admin, row))
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
