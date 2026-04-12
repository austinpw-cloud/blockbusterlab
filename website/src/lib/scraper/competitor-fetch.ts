/**
 * 장르별 경쟁 게임 실시간 데이터 수집.
 *
 * 프롬프트에 "실제 현재 스토어 데이터"를 주입하기 위함.
 * 벤치마크 요약 텍스트가 아니라, 실제 Top 게임의 현재 제목/소개/스크린샷을
 * Opus가 인용할 수 있도록 구체 데이터를 확보.
 */

import "server-only";
import gplay from "google-play-scraper";
import { toHighResUrl, toHighResUrls } from "./highres";
import {
  fetchReviewSamples,
  extractMonetizationHint,
  type ReviewSample,
} from "./reviews";

export type CompetitorData = {
  app_id: string;
  title: string;
  developer: string;
  genre: string;
  rating: number;
  installs: string;
  short_description?: string;
  description_first_800: string;
  icon_url: string;
  screenshot_urls: string[]; // 최대 5장만 샘플
  store_url: string;
  country: string; // 수집 기준 스토어 (예: 'kr', 'us', 'jp')
  reviews?: ReviewSample[];
  monetization?: {
    price?: number;
    currency?: string;
    has_iap?: boolean;
    iap_range?: string;
    ad_supported?: boolean;
  };
};

/**
 * 장르 ID → Google Play 카테고리 매핑.
 * GAME_* 카테고리는 Google Play가 정의한 고정 상수.
 */
const GENRE_TO_GPLAY_CATEGORY: Record<string, string> = {
  puzzle: "GAME_PUZZLE",
  rpg: "GAME_ROLE_PLAYING",
  action: "GAME_ACTION",
  strategy: "GAME_STRATEGY",
  simulation: "GAME_SIMULATION",
  casual: "GAME_CASUAL",
  arcade: "GAME_ARCADE",
  sports: "GAME_SPORTS",
  racing: "GAME_RACING",
  card: "GAME_CARD",
  other: "GAME", // 전체 게임
};

/**
 * 장르에서 Top N 게임 ID 조회 (Google Play 차트 기반).
 */
async function fetchTopAppIdsByGenre(
  genreId: string,
  count: number,
  country: string
): Promise<string[]> {
  const category = GENRE_TO_GPLAY_CATEGORY[genreId] ?? "GAME";

  try {
    const list = await gplay.list({
      category: category as Parameters<typeof gplay.list>[0]["category"],
      collection: "TOP_FREE" as Parameters<typeof gplay.list>[0]["collection"],
      country,
      num: count,
      fullDetail: false,
    });

    return list.map((app) => app.appId);
  } catch (e) {
    console.warn(
      "[competitor] 장르별 Top 조회 실패, 빈 목록 반환:",
      e instanceof Error ? e.message : e
    );
    return [];
  }
}

/**
 * 주어진 app_id와 유사한 게임 N개 조회.
 * 실제 타겟 게임의 직접 경쟁작 발견에 유용.
 */
async function fetchSimilarAppIds(
  appId: string,
  count: number,
  country: string,
  lang?: string
): Promise<string[]> {
  try {
    const similar = await gplay.similar({
      appId,
      country,
      lang: lang ?? getLangForCountry(country),
    });
    return similar.slice(0, count).map((app) => app.appId);
  } catch (e) {
    console.warn(
      "[competitor] similar 조회 실패:",
      e instanceof Error ? e.message : e
    );
    return [];
  }
}

async function fetchAppDetail(
  appId: string,
  country: string,
  lang: string,
  options: { includeReviews?: boolean } = {}
): Promise<CompetitorData | null> {
  try {
    const app = await gplay.app({ appId, country, lang });

    const reviews = options.includeReviews
      ? await fetchReviewSamples({ appId, country, lang, total: 20 })
      : undefined;

    const monetization = extractMonetizationHint(
      app as Parameters<typeof extractMonetizationHint>[0]
    );

    return {
      app_id: appId,
      title: app.title,
      developer: app.developer,
      genre: app.genre,
      rating: app.score ?? 0,
      installs: app.installs ?? "-",
      short_description: app.summary,
      description_first_800: (app.description ?? "").slice(0, 800),
      icon_url: toHighResUrl(app.icon, 1024),
      screenshot_urls: toHighResUrls((app.screenshots ?? []).slice(0, 5)),
      store_url: app.url,
      country,
      reviews,
      monetization,
    };
  } catch (e) {
    console.warn(
      `[competitor] ${appId} 상세 조회 실패:`,
      e instanceof Error ? e.message : e
    );
    return null;
  }
}

/**
 * 경쟁 게임 데이터 수집 메인 함수.
 *
 * - genre의 Top 5에서 3~4개 + similar 1~2개 조합
 * - 본인 게임(selfAppId)은 자동 제외
 * - 최대 5개 반환
 */
/**
 * 국가 코드 → Google Play 스크레이핑 기본 언어 매핑.
 * 스토어별 표시 언어가 달라 카피 분석에 영향.
 */
const COUNTRY_TO_LANG: Record<string, string> = {
  kr: "ko",
  jp: "ja",
  us: "en",
  gb: "en",
  au: "en",
  cn: "zh-CN",
  tw: "zh-TW",
  hk: "zh-HK",
  de: "de",
  fr: "fr",
  es: "es",
  it: "it",
  pt: "pt",
  br: "pt-BR",
  ru: "ru",
  id: "id",
  th: "th",
  vn: "vi",
};

export function getLangForCountry(country: string): string {
  return COUNTRY_TO_LANG[country] ?? "en";
}

export async function fetchCompetitors(opts: {
  genre: string;
  selfAppId?: string | null;
  country?: string;
  limit?: number;
  includeReviews?: boolean;
}): Promise<CompetitorData[]> {
  const country = opts.country ?? "kr";
  const lang = getLangForCountry(country);
  const limit = opts.limit ?? 5;
  const includeReviews = opts.includeReviews ?? true;

  // 1. 장르 Top
  const topIds = await fetchTopAppIdsByGenre(opts.genre, 8, country);

  // 2. 본인 게임 제외
  const filteredTopIds = opts.selfAppId
    ? topIds.filter((id) => id !== opts.selfAppId)
    : topIds;

  // 3. 본인 게임이 있으면 similar도 수집
  let similarIds: string[] = [];
  if (opts.selfAppId) {
    similarIds = await fetchSimilarAppIds(opts.selfAppId, 3, country, lang);
    similarIds = similarIds.filter((id) => id !== opts.selfAppId);
  }

  // 4. 중복 제거 + 우선순위 (유사작 > 차트 상위)
  const seen = new Set<string>();
  const orderedIds: string[] = [];

  for (const id of similarIds) {
    if (!seen.has(id)) {
      seen.add(id);
      orderedIds.push(id);
    }
    if (orderedIds.length >= Math.ceil(limit * 0.4)) break;
  }

  for (const id of filteredTopIds) {
    if (!seen.has(id)) {
      seen.add(id);
      orderedIds.push(id);
    }
    if (orderedIds.length >= limit) break;
  }

  // 5. 상세 정보 병렬 조회
  const details = await Promise.all(
    orderedIds
      .slice(0, limit)
      .map((id) => fetchAppDetail(id, country, lang, { includeReviews }))
  );

  return details.filter((d): d is CompetitorData => d !== null);
}

/**
 * 여러 국가 Top 경쟁작을 국가별로 수집.
 * 의뢰의 target_market 이 복수일 때 사용.
 */
export async function fetchCompetitorsMulti(opts: {
  genre: string;
  selfAppId?: string | null;
  countries: string[];
  limitPerCountry?: number;
  includeReviews?: boolean;
}): Promise<Record<string, CompetitorData[]>> {
  const limit = opts.limitPerCountry ?? 5;
  const results: Record<string, CompetitorData[]> = {};

  for (const country of opts.countries) {
    results[country] = await fetchCompetitors({
      genre: opts.genre,
      selfAppId: opts.selfAppId,
      country,
      limit,
      includeReviews: opts.includeReviews,
    });
  }

  return results;
}
