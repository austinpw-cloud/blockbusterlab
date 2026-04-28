/**
 * Google Play 스토어 페이지 스크래핑.
 *
 * 공개 정보만 수집. 공식 API 아니지만 개발사 본인 앱 조회에는 문제 없음.
 *
 * 사용 예:
 *   const info = await scrapeGooglePlay(
 *     "https://play.google.com/store/apps/details?id=com.lunosoft.ttheroes.android"
 *   );
 */

import "server-only";
import gplay from "google-play-scraper";
import { toHighResUrl, toHighResUrls } from "./highres";
import {
  fetchReviewSamples,
  extractMonetizationHint,
  type ReviewSample,
} from "./reviews";

export type GooglePlayAppInfo = {
  app_id: string;           // "com.lunosoft.ttheroes.android"
  title: string;            // "32용사키우기"
  summary?: string;         // 짧은 설명 (일부 앱만 있음)
  description: string;      // 전체 소개문
  description_html?: string;
  developer: string;
  developer_id?: string;
  developer_email?: string;
  developer_website?: string;
  genre: string;            // 예: "RPG"
  genre_id?: string;        // 예: "GAME_ROLE_PLAYING"
  /** ⚠ 운영 메타. ASO 분석 프롬프트 입력으로 사용 금지 (v2.6 리뷰·평점 원칙). 관리자 UI 표시·로그 용도만. */
  rating?: number;
  /** ⚠ 운영 메타. ASO 분석 입력 금지. */
  ratings_count?: number;
  installs?: string;        // "100,000+"
  min_installs?: number;
  price?: number;
  currency?: string;
  icon_url: string;
  header_image_url?: string;
  screenshot_urls: string[];
  video_url?: string;
  content_rating?: string;
  released?: string;
  updated?: number;
  url: string;

  /** ⚠ 리뷰 샘플. `includeReviews: true` 로 명시 요청 시에만 포함. ASO 분석 입력 금지. */
  reviews?: ReviewSample[];
  /** 수익모델 힌트. ASO 메시징 해석에 사용 가능. */
  monetization?: {
    price?: number;
    currency?: string;
    has_iap?: boolean;
    iap_range?: string;
    ad_supported?: boolean;
  };
};

/**
 * Google Play URL에서 app_id(패키지명) 추출.
 *
 * 지원 형태:
 * - https://play.google.com/store/apps/details?id=com.example.app
 * - https://play.google.com/store/apps/details?id=com.example.app&hl=ko
 * - http://play.google.com/... 등
 */
export function extractAppIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("play.google.com")) return null;
    const id = u.searchParams.get("id");
    return id || null;
  } catch {
    return null;
  }
}

/**
 * Google Play 앱 정보를 수집합니다.
 * 실패 시 예외 throw.
 */
export async function scrapeGooglePlay(
  url: string,
  options?: { lang?: string; country?: string; includeReviews?: boolean }
): Promise<GooglePlayAppInfo> {
  const appId = extractAppIdFromUrl(url);
  if (!appId) {
    throw new Error("올바른 Google Play URL이 아닙니다.");
  }

  const lang = options?.lang ?? "ko";
  const country = options?.country ?? "kr";
  const includeReviews = options?.includeReviews ?? false;

  const app = await gplay.app({ appId, lang, country });

  const reviews = includeReviews
    ? await fetchReviewSamples({ appId, country, lang, total: 30 })
    : undefined;

  const monetization = extractMonetizationHint(
    app as Parameters<typeof extractMonetizationHint>[0]
  );

  return {
    app_id: appId,
    title: app.title,
    summary: app.summary,
    description: app.description,
    description_html: app.descriptionHTML,
    developer: app.developer,
    developer_id: app.developerId,
    developer_email: app.developerEmail,
    developer_website: app.developerWebsite,
    genre: app.genre,
    genre_id: app.genreId,
    rating: app.score,
    ratings_count: app.ratings,
    installs: app.installs,
    min_installs: app.minInstalls,
    price: app.price,
    currency: app.currency,
    icon_url: toHighResUrl(app.icon, 1024),
    header_image_url: app.headerImage
      ? toHighResUrl(app.headerImage)
      : undefined,
    screenshot_urls: toHighResUrls(app.screenshots || []),
    video_url: app.video,
    content_rating: app.contentRating,
    released: app.released,
    updated: app.updated,
    url: app.url,
    reviews,
    monetization,
  };
}
