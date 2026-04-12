/**
 * Reference Library 스크린샷 Vision 분석 실행 모듈.
 *
 * reference_screenshots 중 아직 analyzed_at이 null인 것들을 Sonnet으로 분석.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { complete, parseJsonResponse } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import {
  SCREENSHOT_ANALYSIS_SYSTEM_PROMPT,
  buildScreenshotAnalysisPrompt,
} from "./analyze-prompt";

/** Sonnet 4.6: $3/M input, $15/M output */
function estimateSonnetCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
}

const BUCKET = "reference-library";

export type AnalyzeProgress = {
  total: number;
  processed: number;
  analyzed: number;
  failed: number;
  total_cost_usd: number;
  errors: string[];
};

/**
 * 스크린샷 하나 분석 (게임 메타 포함해서 프롬프트 구성).
 */
async function analyzeOneScreenshot(
  admin: ReturnType<typeof createAdminClient>,
  screenshot: {
    id: string;
    slot_number: number;
    storage_path: string;
  },
  game: {
    title: string;
    genre: string;
  }
): Promise<{ ok: boolean; cost_usd: number; error?: string }> {
  // 1. signed URL 발급
  const { data: signed, error: urlErr } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(screenshot.storage_path, 3600);

  if (urlErr || !signed?.signedUrl) {
    return { ok: false, cost_usd: 0, error: `signed URL 발급 실패` };
  }

  // 2. Sonnet 호출 (Vision)
  try {
    const completion = await complete({
      model: MODELS.SONNET,
      system: SCREENSHOT_ANALYSIS_SYSTEM_PROMPT,
      userMessage: buildScreenshotAnalysisPrompt({
        game_title: game.title,
        genre: game.genre,
        slot_number: screenshot.slot_number,
      }),
      images: [{ url: signed.signedUrl, label: "스크린샷" }],
      maxTokens: 4000,
      temperature: 0.3, // 구조화 추출이라 결정적
    });

    const cost = estimateSonnetCost(
      completion.input_tokens,
      completion.output_tokens
    );

    // 3. JSON 파싱
    const analysis = parseJsonResponse<Record<string, unknown>>(completion.text);

    // 4. DB 업데이트
    const { error: upErr } = await admin
      .from("reference_screenshots")
      .update({
        analysis,
        analysis_cost_usd: cost,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", screenshot.id);

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
 * 미분석 스크린샷 N개 분석 (샘플 테스트/배치용).
 *
 * @param limit 최대 몇 개 처리할지 (null이면 전체)
 * @param genre 특정 장르만 처리 (없으면 전체)
 * @param country 특정 국가만 처리 (없으면 전체) — country 차원 도입 이후 필수
 * @param onProgress 진행 콜백
 */
export async function analyzeUnanalyzedScreenshots(
  limit: number | null = null,
  genre: string | null = null,
  country: string | null = null,
  onProgress?: (p: AnalyzeProgress) => void
): Promise<AnalyzeProgress> {
  const admin = createAdminClient();

  // 미분석 목록 조회
  let query = admin
    .from("reference_screenshots")
    .select(
      `
      id, slot_number, storage_path,
      reference_games!inner ( title, genre, country )
    `
    )
    .is("analyzed_at", null);

  if (genre) {
    query = query.eq("reference_games.genre", genre);
  }
  if (country) {
    query = query.eq("reference_games.country", country);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data: items, error } = await query;
  if (error) throw new Error(`목록 조회 실패: ${error.message}`);

  type RowType = {
    id: string;
    slot_number: number;
    storage_path: string;
    reference_games:
      | { title: string; genre: string; country: string }
      | { title: string; genre: string; country: string }[];
  };
  const rows = (items ?? []) as unknown as RowType[];

  const progress: AnalyzeProgress = {
    total: rows.length,
    processed: 0,
    analyzed: 0,
    failed: 0,
    total_cost_usd: 0,
    errors: [],
  };
  onProgress?.(progress);

  // 동시성 제한 (API rate limit 고려)
  const CONCURRENCY = 3;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((row) => {
        const gameField = row.reference_games;
        const game = Array.isArray(gameField) ? gameField[0] : gameField;
        return analyzeOneScreenshot(
          admin,
          {
            id: row.id,
            slot_number: row.slot_number,
            storage_path: row.storage_path,
          },
          { title: game.title, genre: game.genre }
        );
      })
    );

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      progress.processed++;
      progress.total_cost_usd += r.cost_usd;
      if (r.ok) {
        progress.analyzed++;
      } else {
        progress.failed++;
        progress.errors.push(
          `${batch[j].storage_path}: ${r.error}`
        );
      }
    }
    onProgress?.(progress);
  }

  return progress;
}
