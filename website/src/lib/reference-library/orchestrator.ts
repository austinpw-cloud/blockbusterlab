/**
 * Reference Library 파이프라인 오케스트레이터.
 *
 * L1 (아이콘 · 텍스트 · 스크린샷 슬롯) → L2 (게임 종합) → L3 (패턴 합성).
 *
 * 각 레이어를 독립적으로 또는 순차로 실행. skipIfAnalyzed 로 재실행 안전성 확보.
 */

import "server-only";
import {
  analyzeUnanalyzedIcons,
  type IconAnalyzeProgress,
} from "./analyze-icon";
import {
  analyzeUnanalyzedTexts,
  type TextAnalyzeProgress,
} from "./analyze-text";
import {
  analyzeUnanalyzedScreenshots,
  type AnalyzeProgress as SlotAnalyzeProgress,
} from "./analyze";
import {
  synthesizeUnanalyzedGames,
  type GameSynthesisProgress,
} from "./analyze-game";
import {
  synthesizeTierA,
  synthesizeOnePattern,
  type AxisFilter,
  type SynthesisResult,
} from "./synthesize-patterns";

export type PipelineOptions = {
  levels: Array<1 | 2 | 3>; // 실행할 레이어
  genre?: string | null;
  country?: string | null;
  limit?: number | null;
  // L3 전용
  l3_markets?: string[]; // Tier A 시장 목록 (기본 kr/us/jp/cn)
  l3_filter?: AxisFilter | null; // 지정 시 단건 합성
};

export type PipelineResult = {
  l1?: {
    icon: IconAnalyzeProgress;
    text: TextAnalyzeProgress;
    slot: SlotAnalyzeProgress;
  };
  l2?: GameSynthesisProgress;
  l3?: {
    results: SynthesisResult[];
    total_cost_usd: number;
    succeeded: number;
    skipped: number;
    failed: number;
  };
  total_cost_usd: number;
};

/**
 * L1 = 아이콘 + 텍스트 + 스크린샷 슬롯 분석 일괄.
 * 순차가 아닌 병렬 — 3 종류는 DB 충돌 없고 Anthropic API rate 에 각자 맞춰져 있음.
 */
async function runL1(opts: {
  genre?: string | null;
  country?: string | null;
  limit?: number | null;
}): Promise<NonNullable<PipelineResult["l1"]>> {
  const [icon, text, slot] = await Promise.all([
    analyzeUnanalyzedIcons(
      opts.limit ?? null,
      opts.genre ?? null,
      opts.country ?? null,
      (p) =>
        console.log(
          `[L1-icon] ${p.processed}/${p.total} ok=${p.analyzed} fail=${p.failed} $${p.total_cost_usd.toFixed(4)}`
        )
    ),
    analyzeUnanalyzedTexts(
      opts.limit ?? null,
      opts.genre ?? null,
      opts.country ?? null,
      (p) =>
        console.log(
          `[L1-text] ${p.processed}/${p.total} ok=${p.analyzed} fail=${p.failed} $${p.total_cost_usd.toFixed(4)}`
        )
    ),
    analyzeUnanalyzedScreenshots(
      opts.limit ?? null,
      opts.genre ?? null,
      opts.country ?? null,
      (p) =>
        console.log(
          `[L1-slot] ${p.processed}/${p.total} ok=${p.analyzed} fail=${p.failed} $${p.total_cost_usd.toFixed(4)}`
        )
    ),
  ]);

  return { icon, text, slot };
}

/**
 * L2 = 게임 단위 ASO 수법 합성.
 */
async function runL2(opts: {
  genre?: string | null;
  country?: string | null;
  limit?: number | null;
}): Promise<GameSynthesisProgress> {
  return synthesizeUnanalyzedGames(
    opts.limit ?? null,
    opts.genre ?? null,
    opts.country ?? null,
    (p) =>
      console.log(
        `[L2] ${p.processed}/${p.total} ok=${p.analyzed} fail=${p.failed} $${p.total_cost_usd.toFixed(4)}`
      )
  );
}

/**
 * L3 = 패턴 합성. 단건(l3_filter 지정) 또는 Tier A 일괄.
 */
async function runL3(opts: {
  l3_markets?: string[];
  l3_filter?: AxisFilter | null;
  genre?: string | null;
}): Promise<NonNullable<PipelineResult["l3"]>> {
  if (opts.l3_filter) {
    const r = await synthesizeOnePattern(opts.l3_filter);
    return {
      results: [r],
      total_cost_usd: r.cost_usd,
      succeeded: r.ok ? 1 : 0,
      skipped: r.error?.startsWith("표본 부족") ? 1 : 0,
      failed: r.ok || r.error?.startsWith("표본 부족") ? 0 : 1,
    };
  }

  const genres = opts.genre ? [opts.genre] : null;
  return synthesizeTierA(
    genres,
    opts.l3_markets ?? ["kr", "us", "jp", "cn"],
    (r, i, total) =>
      console.log(
        `[L3] ${i}/${total} axis=${r.axis_key} ${
          r.ok ? "ok" : r.error?.startsWith("표본 부족") ? "skip" : "fail"
        } n=${r.sample_size} $${r.cost_usd.toFixed(4)}`
      )
  );
}

/**
 * 전체 파이프라인 실행.
 *
 * levels 순서가 보장됨: 1 → 2 → 3.
 * L2 는 L1 완료 게임을 재료로 하고, L3 는 L2 완료 게임을 재료로 하므로
 * 같은 세션에서 연속 실행 시 올바른 순서로 돌아야 함.
 */
export async function runPipeline(
  opts: PipelineOptions
): Promise<PipelineResult> {
  const result: PipelineResult = { total_cost_usd: 0 };
  const sorted = [...opts.levels].sort();

  for (const level of sorted) {
    if (level === 1) {
      result.l1 = await runL1({
        genre: opts.genre,
        country: opts.country,
        limit: opts.limit,
      });
      result.total_cost_usd +=
        result.l1.icon.total_cost_usd +
        result.l1.text.total_cost_usd +
        result.l1.slot.total_cost_usd;
    } else if (level === 2) {
      result.l2 = await runL2({
        genre: opts.genre,
        country: opts.country,
        limit: opts.limit,
      });
      result.total_cost_usd += result.l2.total_cost_usd;
    } else if (level === 3) {
      result.l3 = await runL3({
        l3_markets: opts.l3_markets,
        l3_filter: opts.l3_filter,
        genre: opts.genre,
      });
      result.total_cost_usd += result.l3.total_cost_usd;
    }
  }

  return result;
}
