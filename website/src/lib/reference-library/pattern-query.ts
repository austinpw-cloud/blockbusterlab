/**
 * Pattern Query — 의뢰 주문 처리 시 Library 조회 모듈.
 *
 * 설계 철학 (사용자 확정, 2026-04-14):
 *   - **Library 는 항상 존재**. 초기 구축된 reference_games 전체가 Library.
 *   - Library 는 **종합적 ASO 기준 축** — 1:1 매칭 아님. 합성된 기준.
 *   - Library 게임 수 ↑ = 종합 기준 품질 ↑.
 *   - 의뢰 게임이 Library 의 어떤 게임과 1:1 매칭될 필요 없음 (종합 축이 기준).
 *   - 유사 게임은 있으면 "가이드 보강" 으로 반영.
 *   - **Library 만으로 부족하다 판단될 때 추가 수집·분석 → Library 누적** 은
 *     별도 모듈(`screenshot/library-coverage.ts`) 이 담당. 본 모듈은 **조회만**.
 *
 * 반환 구조:
 *   1. primary_pattern: library_patterns 에서 축 조합 fallback 조회
 *      fallback_level 이 얼마나 구체적으로 매칭됐는지 알려줌 (무매칭이 아닌 매칭 세밀도)
 *   2. similar_games: 같은 genre·target_market 의 L2 분석 완료 reference_games 최대 3개
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 주축 매칭 세밀도.
 *   - "specific_4axis": 4축 모두 매칭 (genre+market+monetization+studio_size)
 *   - "genre_market_monetization": 3축 매칭
 *   - "genre_market": 장르+시장 매칭 (Tier A 표준)
 *   - "genre_only": 장르만 매칭 (시장 교차 fallback)
 *   - "none": library_patterns 에 이 장르가 아예 없음 (DB 극단 상태 — 정상 동작 아님)
 */
export type FallbackLevel =
  | "specific_4axis"
  | "genre_market_monetization"
  | "genre_market"
  | "genre_only"
  | "none";

export type LibraryPrimaryPattern = {
  axis_key_used: string;
  axis_scope: {
    genre: string;
    market: string | null;
    monetization_model: string | null;
    studio_size: string | null;
  };
  sample_size: number;
  confidence: "high" | "medium" | "low";
  fallback_level: FallbackLevel;
  /** library_patterns.patterns JSONB — L3 합성 결과 전체 */
  patterns: Record<string, unknown>;
};

export type LibrarySimilarGame = {
  title: string;
  developer: string | null;
  country: string;
  target_markets: string[] | null;
  /** aso_analysis 핵심 필드만 추출 — 프롬프트 토큰 절약 */
  aso_core: {
    positioning?: unknown;
    aso_success_approach?: unknown;
    core_hook?: unknown;
    emotional_appeal?: unknown;
    reusable_aso_techniques?: unknown;
    indie_applicability?: unknown;
    monetization_alignment?: unknown;
  };
};

export type PatternQueryResult = {
  /** 주축. Library 에 해당 장르 패턴이 전혀 없는 극단 상황에서만 null (정상 운영에서는 항상 값) */
  primary_pattern: LibraryPrimaryPattern | null;
  /** 주축 매칭 세밀도. "none" 은 DB 극단 상태 (해당 장르에 library_patterns 0건) */
  fallback_level: FallbackLevel;
  /** 유사 게임 — 있으면 가이드 보강에 반영 (1:1 매칭 아님, 참고용) */
  similar_games: LibrarySimilarGame[];
  /** 폴백 체인 시도 로그 (디버깅) */
  fallback_chain: Array<{ axis_key: string; matched: boolean }>;
};

export type PatternQueryInput = {
  genre: string;
  market?: string | null;
  monetization_model?: string | null;
  studio_size?: string | null;
  /** 유사 게임 최대 N개. 기본 3. */
  similar_limit?: number;
};

/**
 * axis_key 직렬화 (synthesize-patterns.buildAxisKey 와 동일 규약).
 */
function buildAxisKey(input: {
  genre: string;
  market: string | null;
  monetization_model: string | null;
  studio_size: string | null;
}): string {
  const g = input.genre;
  const m = input.market ?? "*";
  const mo = input.monetization_model ?? "*";
  const s = input.studio_size ?? "*";
  return `genre=${g};market=${m};monetization=${mo};studio_size=${s}`;
}

/**
 * 폴백 체인 구성: 구체 → 일반.
 * NULL 슬롯은 '*' 로 치환되어 axis_key 에 반영됨.
 */
function buildFallbackChain(input: PatternQueryInput): Array<{
  genre: string;
  market: string | null;
  monetization_model: string | null;
  studio_size: string | null;
}> {
  const chain: Array<{
    genre: string;
    market: string | null;
    monetization_model: string | null;
    studio_size: string | null;
  }> = [];

  // (1) 4축 모두 지정
  if (input.market && input.monetization_model && input.studio_size) {
    chain.push({
      genre: input.genre,
      market: input.market,
      monetization_model: input.monetization_model,
      studio_size: input.studio_size,
    });
  }

  // (2) genre + market + monetization (규모 무시)
  if (input.market && input.monetization_model) {
    chain.push({
      genre: input.genre,
      market: input.market,
      monetization_model: input.monetization_model,
      studio_size: null,
    });
  }

  // (3) genre + market (수익·규모 무시) — Tier A 표준
  if (input.market) {
    chain.push({
      genre: input.genre,
      market: input.market,
      monetization_model: null,
      studio_size: null,
    });
  }

  // (4) genre 만 (전부 무시) — 최종 fallback
  chain.push({
    genre: input.genre,
    market: null,
    monetization_model: null,
    studio_size: null,
  });

  // dedupe (동일 axis_key 가 여러 단계로 나오면 한 번만)
  const seen = new Set<string>();
  return chain.filter((c) => {
    const key = buildAxisKey(c);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 매칭된 scope 로부터 fallback_level 판정.
 */
function classifyFallbackLevel(scope: {
  market: string | null;
  monetization_model: string | null;
  studio_size: string | null;
}): FallbackLevel {
  const has_market = scope.market != null;
  const has_mon = scope.monetization_model != null;
  const has_size = scope.studio_size != null;

  if (has_market && has_mon && has_size) return "specific_4axis";
  if (has_market && has_mon) return "genre_market_monetization";
  if (has_market) return "genre_market";
  return "genre_only";
}

/**
 * 주축 조회 — 폴백 체인 순차 시도.
 */
async function queryPrimaryPattern(
  admin: ReturnType<typeof createAdminClient>,
  input: PatternQueryInput
): Promise<{
  pattern: LibraryPrimaryPattern | null;
  chain_log: Array<{ axis_key: string; matched: boolean }>;
}> {
  const chain = buildFallbackChain(input);
  const chain_log: Array<{ axis_key: string; matched: boolean }> = [];

  for (const scope of chain) {
    const axis_key = buildAxisKey(scope);
    const { data, error } = await admin
      .from("library_patterns")
      .select(
        "axis_key, genre, market, monetization_model, studio_size, patterns, sample_size, confidence"
      )
      .eq("axis_key", axis_key)
      .maybeSingle();

    if (error) {
      chain_log.push({ axis_key, matched: false });
      continue;
    }
    if (!data) {
      chain_log.push({ axis_key, matched: false });
      continue;
    }

    chain_log.push({ axis_key, matched: true });
    return {
      pattern: {
        axis_key_used: data.axis_key,
        axis_scope: {
          genre: data.genre,
          market: data.market,
          monetization_model: data.monetization_model,
          studio_size: data.studio_size,
        },
        sample_size: data.sample_size,
        confidence: data.confidence,
        fallback_level: classifyFallbackLevel({
          market: data.market,
          monetization_model: data.monetization_model,
          studio_size: data.studio_size,
        }),
        patterns: data.patterns,
      },
      chain_log,
    };
  }

  return { pattern: null, chain_log };
}

type ReferenceGameRow = {
  title: string;
  developer: string | null;
  country: string;
  target_markets: string[] | null;
  aso_analysis: Record<string, unknown> | null;
};

/**
 * aso_analysis 에서 핵심 필드만 추출.
 */
function extractAsoCore(
  aso: Record<string, unknown> | null
): LibrarySimilarGame["aso_core"] {
  if (!aso) return {};
  const keys: Array<keyof LibrarySimilarGame["aso_core"]> = [
    "positioning",
    "aso_success_approach",
    "core_hook",
    "emotional_appeal",
    "reusable_aso_techniques",
    "indie_applicability",
    "monetization_alignment",
  ];
  const out: LibrarySimilarGame["aso_core"] = {};
  for (const k of keys) {
    if (k in aso) out[k] = aso[k as string];
  }
  return out;
}

/**
 * 보조 조회 — 같은 genre 의 L2 분석 완료된 reference_games.
 * 가능하면 target_markets 가 겹치는 것 우선.
 */
async function querySimilarGames(
  admin: ReturnType<typeof createAdminClient>,
  input: PatternQueryInput
): Promise<LibrarySimilarGame[]> {
  const limit = input.similar_limit ?? 3;

  // L2 완료된 게임 중 같은 장르 전부 조회 (상한 넉넉히)
  const { data, error } = await admin
    .from("reference_games")
    .select("title, developer, country, target_markets, aso_analysis")
    .eq("genre", input.genre)
    .not("aso_analyzed_at", "is", null)
    .limit(20);

  if (error || !data) return [];

  const rows = data as ReferenceGameRow[];

  // 시장 우선순위: market 일치(country 또는 target_markets 포함) → 나머지
  const scored = rows.map((r) => {
    let score = 0;
    if (input.market) {
      if (r.country === input.market) score += 2;
      if (r.target_markets?.includes(input.market)) score += 1;
    }
    return { row: r, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ row }) => ({
    title: row.title,
    developer: row.developer,
    country: row.country,
    target_markets: row.target_markets,
    aso_core: extractAsoCore(row.aso_analysis),
  }));
}

/**
 * 공개 API — 의뢰 주문에 대한 Library 조회.
 *
 * Library 는 항상 존재한다는 전제. 극단 상태 (해당 장르 library_patterns 0건) 는
 * `fallback_level === "none"` 으로 표시되지만, 정상 운영에서는 최소 "genre_only" 까지는 매칭.
 */
export async function queryLibrary(
  input: PatternQueryInput
): Promise<PatternQueryResult> {
  const admin = createAdminClient();

  const [primaryRes, similar] = await Promise.all([
    queryPrimaryPattern(admin, input),
    querySimilarGames(admin, input),
  ]);

  return {
    primary_pattern: primaryRes.pattern,
    fallback_level: primaryRes.pattern?.fallback_level ?? "none",
    similar_games: similar,
    fallback_chain: primaryRes.chain_log,
  };
}
