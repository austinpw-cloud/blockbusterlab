/**
 * Reference Library 아이콘 Vision 분석 실행 모듈 (L1).
 *
 * reference_games 중 아직 icon_analyzed_at 이 null 이고 icon_storage_path 가 있는 것을 Sonnet 으로 분석.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { complete, parseJsonResponse } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import {
  ICON_ANALYSIS_SYSTEM_PROMPT,
  buildIconAnalysisPrompt,
} from "./analyze-icon-prompt";

/** Sonnet 4.6: $3/M input, $15/M output */
function estimateSonnetCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
}

const BUCKET = "reference-library";

export type IconAnalyzeProgress = {
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
  icon_storage_path: string;
  target_markets: string[] | null;
  monetization_model: string | null;
  studio_size: string | null;
};

async function analyzeOneIcon(
  admin: ReturnType<typeof createAdminClient>,
  game: GameRow
): Promise<{ ok: boolean; cost_usd: number; error?: string }> {
  const { data: signed, error: urlErr } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(game.icon_storage_path, 3600);

  if (urlErr || !signed?.signedUrl) {
    return { ok: false, cost_usd: 0, error: "signed URL 발급 실패" };
  }

  try {
    const completion = await complete({
      model: MODELS.SONNET,
      system: ICON_ANALYSIS_SYSTEM_PROMPT,
      userMessage: buildIconAnalysisPrompt({
        game_title: game.title,
        genre: game.genre,
        target_markets: game.target_markets ?? undefined,
        monetization_model: game.monetization_model ?? undefined,
        studio_size: game.studio_size ?? undefined,
      }),
      images: [{ url: signed.signedUrl, label: "아이콘" }],
      maxTokens: 2000,
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
        icon_analysis: analysis,
        icon_analysis_cost_usd: cost,
        icon_analyzed_at: new Date().toISOString(),
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
 * 미분석 아이콘 N개 분석 (배치).
 *
 * @param limit 최대 몇 개 처리 (null = 전체)
 * @param genre 특정 장르만 (없으면 전체)
 * @param country 특정 국가만 (없으면 전체)
 * @param onProgress 진행 콜백
 */
export async function analyzeUnanalyzedIcons(
  limit: number | null = null,
  genre: string | null = null,
  country: string | null = null,
  onProgress?: (p: IconAnalyzeProgress) => void
): Promise<IconAnalyzeProgress> {
  const admin = createAdminClient();

  let query = admin
    .from("reference_games")
    .select(
      "id, title, genre, icon_storage_path, target_markets, monetization_model, studio_size"
    )
    .is("icon_analyzed_at", null)
    .not("icon_storage_path", "is", null);

  if (genre) query = query.eq("genre", genre);
  if (country) query = query.eq("country", country);
  if (limit) query = query.limit(limit);

  const { data: items, error } = await query;
  if (error) throw new Error(`목록 조회 실패: ${error.message}`);

  const rows = (items ?? []) as GameRow[];

  const progress: IconAnalyzeProgress = {
    total: rows.length,
    processed: 0,
    analyzed: 0,
    failed: 0,
    total_cost_usd: 0,
    errors: [],
  };
  onProgress?.(progress);

  // 동시성 제한 (API rate limit)
  const CONCURRENCY = 3;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((row) => analyzeOneIcon(admin, row))
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
