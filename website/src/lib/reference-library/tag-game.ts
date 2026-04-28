/**
 * 게임 자동 태깅 로직 — selection_basis / target_markets / monetization_model / studio_size.
 *
 * 태깅은 100% 정확할 수 없음 (특히 studio_size). whitelist + 휴리스틱 + 수동 보정 전제.
 */

import "server-only";
import {
  AAA_STUDIOS_NORMALIZED,
  MID_STUDIOS_NORMALIZED,
  GPLAY_CATEGORY_TO_GENRE,
} from "./curated-lists";

export type MonetizationModel =
  | "f2p_ad"
  | "f2p_iap"
  | "subscription"
  | "premium"
  | "hybrid";

export type StudioSize = "solo" | "indie" | "mid" | "aaa";

/**
 * 선별 근거. v2.5 (2026-04-13) 이후 `editor_choice` · `award` 는 제거 — 수상·에디터스 초이스는
 * 게임 품질 프록시라 ASO 분석 가치와 무관 (v2.5 철학).
 */
export type SelectionBasis =
  | "revenue_top"
  | "indie_exemplar"
  | "commission_driven"
  | "case_study"
  | "keyword_search";

/**
 * 수익모델 분류 (collect.ts 의 extractMonetizationHint 결과 JSONB 기반).
 *
 * 규칙 (heuristic):
 *   - price > 0             → premium
 *   - has_subscription      → subscription (IAP 도 있으면 hybrid 가능성 있지만 subscription 우선)
 *   - iap_count >= 3 + has_remove_ads → hybrid
 *   - iap_count >= 1        → f2p_iap
 *   - 위 조건 모두 아님      → f2p_ad (광고 기반 추정)
 */
export function inferMonetizationModel(
  monetization: Record<string, unknown> | null
): MonetizationModel {
  if (!monetization) return "f2p_ad";

  const price = typeof monetization.price === "number" ? monetization.price : 0;
  if (price > 0) return "premium";

  const hasSubscription = Boolean(monetization.has_subscription);
  if (hasSubscription) return "subscription";

  const iapCount =
    typeof monetization.iap_count === "number" ? monetization.iap_count : 0;
  const hasRemoveAds = Boolean(monetization.has_remove_ads);

  if (iapCount >= 3 && hasRemoveAds) return "hybrid";
  if (iapCount >= 1) return "f2p_iap";

  return "f2p_ad";
}

/**
 * 스튜디오 규모 분류 (developer 이름 기반 whitelist 매칭).
 *
 * 규칙:
 *   - whitelist match → aaa / mid
 *   - 매치 없음 → indie (기본값, 수동 보정 전제)
 *   - solo 는 자동 판정 불가 — 수동 보정
 */
export function inferStudioSize(developer: string | null | undefined): StudioSize {
  if (!developer) return "indie";
  const lower = developer.toLowerCase().trim();

  for (const aaa of AAA_STUDIOS_NORMALIZED) {
    if (lower.includes(aaa)) return "aaa";
  }
  for (const mid of MID_STUDIOS_NORMALIZED) {
    if (lower.includes(mid)) return "mid";
  }
  return "indie";
}

/**
 * Google Play 카테고리 문자열 (예: "GAME_PUZZLE") 를 내부 장르 문자열로.
 * gplay 응답의 genreId 또는 categoryId 가 대상.
 */
export function normalizeGenreFromGplay(
  gplayGenreId: string | null | undefined
): string | null {
  if (!gplayGenreId) return null;
  return GPLAY_CATEGORY_TO_GENRE[gplayGenreId] ?? null;
}

/**
 * 여러 국가에서 같은 app_id 가 등장했을 때 target_markets 배열 병합.
 */
export function mergeMarkets(existing: string[] | null | undefined, add: string): string[] {
  const set = new Set(existing ?? []);
  set.add(add);
  return Array.from(set);
}
