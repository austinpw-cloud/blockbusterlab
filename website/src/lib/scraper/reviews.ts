/**
 * Google Play 리뷰 샘플링 유틸.
 *
 * 목적: "유저가 왜 좋아/실망하는가" 증거를 경쟁작 분석·ASO 전략에 투입.
 * 전략: 상위 평점(4-5) 과 하위 평점(1-2) 을 섞어 칭찬·불만 테마를 모두 확보.
 */

import "server-only";
import gplay from "google-play-scraper";

export type ReviewSample = {
  rating: number; // 1-5
  text: string;
  date?: string;
  lang?: string;
};

type SortOption = 1 | 2 | 3; // NEWEST=2, RATING=3, HELPFULNESS=1

/**
 * 단일 appId에 대해 상위·하위 평점 리뷰를 섞어서 리턴.
 *
 * google-play-scraper 의 reviews 엔드포인트는 sort=3(RATING) 을 써도
 * 최신·평점 혼합 정렬이라 필터링이 완벽하진 않다. 대신 넉넉히 받아 JS에서 분류.
 */
export async function fetchReviewSamples(opts: {
  appId: string;
  country?: string;
  lang?: string;
  /** 총 수집 상한 (상/하 합산). 기본 30 */
  total?: number;
}): Promise<ReviewSample[]> {
  const country = opts.country ?? "kr";
  const lang = opts.lang ?? "ko";
  const total = opts.total ?? 30;
  const fetchSize = Math.max(total * 3, 60); // 필터 후 남기 위해 여유 수집

  try {
    const result = await gplay.reviews({
      appId: opts.appId,
      country,
      lang,
      sort: 2 as SortOption, // NEWEST — 최근 리뷰 기준 혼합
      num: fetchSize,
    });

    const all = (result?.data ?? []) as Array<{
      score?: number;
      text?: string | null;
      date?: string | Date | null;
    }>;

    // 텍스트 있는 것만
    const cleaned: ReviewSample[] = all
      .filter((r) => r.text && r.text.trim().length > 5)
      .map((r) => ({
        rating: r.score ?? 0,
        text: (r.text ?? "").replace(/\s+/g, " ").trim(),
        date: r.date ? new Date(r.date).toISOString() : undefined,
        lang,
      }));

    // 상위(4-5) / 하위(1-2) 균형 샘플링 + 한쪽 부족 시 반대쪽으로 보충 + 중위 fallback
    const high = cleaned.filter((r) => r.rating >= 4);
    const low = cleaned.filter((r) => r.rating <= 2);
    const mid = cleaned.filter((r) => r.rating === 3);

    const halfTotal = Math.ceil(total / 2);
    const highTake = high.slice(0, halfTotal);
    const lowTake = low.slice(0, halfTotal);

    const picked: ReviewSample[] = [...highTake, ...lowTake];

    // 한쪽 극단이 부족하면 반대쪽 극단에서 추가로 보충 (총량 우선)
    if (picked.length < total) {
      const need = total - picked.length;
      if (highTake.length < halfTotal && low.length > lowTake.length) {
        picked.push(...low.slice(lowTake.length, lowTake.length + need));
      } else if (lowTake.length < halfTotal && high.length > highTake.length) {
        picked.push(...high.slice(highTake.length, highTake.length + need));
      }
    }

    // 여전히 부족하면 중위로 채움
    if (picked.length < total) {
      picked.push(...mid.slice(0, total - picked.length));
    }

    return picked.slice(0, total);
  } catch (e) {
    console.warn(
      `[reviews] ${opts.appId} 리뷰 수집 실패:`,
      e instanceof Error ? e.message : e
    );
    return [];
  }
}

/**
 * gplay.app 결과에서 수익모델 힌트 추출.
 */
export function extractMonetizationHint(app: {
  price?: number;
  currency?: string;
  free?: boolean;
  offersIAP?: boolean;
  IAPRange?: string;
  adSupported?: boolean;
}): {
  price?: number;
  currency?: string;
  has_iap?: boolean;
  iap_range?: string;
  ad_supported?: boolean;
} {
  return {
    price: app.price ?? 0,
    currency: app.currency,
    has_iap: app.offersIAP ?? false,
    iap_range: app.IAPRange,
    ad_supported: app.adSupported ?? false,
  };
}
