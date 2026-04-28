/**
 * Apple App Store 메타데이터 수집.
 *
 * 공식 iTunes Lookup API 직접 호출 (추가 npm 의존성 없음, 취약점 없음).
 * 엔드포인트: https://itunes.apple.com/lookup?id=<trackId>&country=<cc>
 *
 * 수집 정보: 제목·설명·개발사·장르·아이콘·아이폰/아이패드 스크린샷 URL·가격·출시일·updated
 * 수집 안 함 (v2.6 원칙): 리뷰·평점 (필드 자체는 응답에 있으나 운영 메타로만 취급)
 */

import "server-only";

export type AppleAppStoreAppInfo = {
  /** 숫자 trackId (App Store 고유 ID) */
  track_id: number;
  /** bundle id (예: com.lunosoft.ttheroes) */
  bundle_id: string;
  /** 현지화된 제목 */
  title: string;
  /** 앱 설명 (전체) */
  description: string;
  /** 개발사명 */
  developer: string;
  /** Apple 개발사 ID */
  developer_id?: number;
  /** 개발사 웹사이트 */
  developer_website?: string;
  /** 1차 장르명 */
  genre: string;
  /** 전체 장르 목록 */
  genres?: string[];
  /** ⚠ 운영 메타. ASO 분석 입력 금지 (v2.6). */
  rating?: number;
  /** ⚠ 운영 메타. ASO 분석 입력 금지. */
  ratings_count?: number;
  /** 가격 (USD 또는 country 통화) */
  price?: number;
  currency?: string;
  /** 아이콘 URL (512x512) */
  icon_url: string;
  /** iPhone 스크린샷 URL 배열 */
  iphone_screenshot_urls: string[];
  /** iPad 스크린샷 URL 배열 (optional) */
  ipad_screenshot_urls: string[];
  /** 연령 등급 */
  content_rating?: string;
  /** 출시일 (ISO) */
  released?: string;
  /** 최신 업데이트일 (ISO) */
  updated?: string;
  /** 최신 버전 */
  version?: string;
  /** App Store 정식 URL */
  url: string;
  /** 지원 디바이스 (iphone/ipad/mac 등) */
  supported_devices?: string[];
  /** 현지화된 언어 목록 */
  languages?: string[];
};

/**
 * Apple App Store URL 에서 trackId 추출.
 *
 * 지원 형태:
 *   https://apps.apple.com/kr/app/some-slug/id1234567890
 *   https://apps.apple.com/us/app/id1234567890
 *   https://apps.apple.com/app/id1234567890?mt=8
 */
export function extractTrackIdFromUrl(url: string): {
  trackId: string;
  country: string;
} | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("apps.apple.com")) return null;

    // path 마지막 `idXXXXXXXXX` 매칭
    const match = u.pathname.match(/\/id(\d+)(?:\/|$|\?)/);
    if (!match) return null;
    const trackId = match[1];

    // 경로 첫 세그먼트가 2자리 국가코드면 추출, 아니면 기본 "us"
    const segments = u.pathname.split("/").filter(Boolean);
    const first = segments[0];
    const country = first && /^[a-z]{2}$/i.test(first) ? first.toLowerCase() : "us";

    return { trackId, country };
  } catch {
    return null;
  }
}

type ItunesLookupResult = {
  trackId: number;
  bundleId: string;
  trackName: string;
  description: string;
  artistName: string;
  artistId?: number;
  sellerUrl?: string;
  primaryGenreName: string;
  genres?: string[];
  averageUserRating?: number;
  userRatingCount?: number;
  price?: number;
  currency?: string;
  artworkUrl512?: string;
  artworkUrl100?: string;
  screenshotUrls?: string[];
  ipadScreenshotUrls?: string[];
  contentAdvisoryRating?: string;
  releaseDate?: string;
  currentVersionReleaseDate?: string;
  version?: string;
  trackViewUrl: string;
  supportedDevices?: string[];
  languageCodesISO2A?: string[];
};

type ItunesLookupResponse = {
  resultCount: number;
  results: ItunesLookupResult[];
};

/**
 * Apple App Store 앱 정보 수집.
 * 실패 시 예외 throw.
 */
export async function scrapeAppleAppStore(
  url: string,
  options?: { country?: string; lang?: string }
): Promise<AppleAppStoreAppInfo> {
  const parsed = extractTrackIdFromUrl(url);
  if (!parsed) {
    throw new Error("올바른 Apple App Store URL이 아닙니다.");
  }

  const country = options?.country ?? parsed.country ?? "us";
  const lang = options?.lang; // iTunes Lookup 은 `lang` 파라미터 미지원 — country 로 로캘 결정

  const endpoint = new URL("https://itunes.apple.com/lookup");
  endpoint.searchParams.set("id", parsed.trackId);
  endpoint.searchParams.set("country", country);
  endpoint.searchParams.set("entity", "software");

  const res = await fetch(endpoint.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "blockbusterlab-aso-bot/1.0 (+https://blockbusterlab.com)",
    },
    // iTunes Lookup 은 일반적으로 수초 내 응답
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(
      `iTunes Lookup 실패: HTTP ${res.status} (trackId=${parsed.trackId}, country=${country})`
    );
  }

  const json = (await res.json()) as ItunesLookupResponse;
  if (!json.results || json.results.length === 0) {
    throw new Error(
      `iTunes Lookup 결과 없음 (trackId=${parsed.trackId}, country=${country}). ` +
        `해당 국가 스토어에 앱이 없거나 trackId 가 잘못됐을 수 있습니다.`
    );
  }

  const r = json.results[0];

  // lang 파라미터는 iTunes Lookup 에서 무시됨 — 로그만 남김
  if (lang) {
    console.log(`[apple-app-store] lang='${lang}' 은 country 로 대체 (iTunes Lookup 미지원)`);
  }

  return {
    track_id: r.trackId,
    bundle_id: r.bundleId,
    title: r.trackName,
    description: r.description,
    developer: r.artistName,
    developer_id: r.artistId,
    developer_website: r.sellerUrl,
    genre: r.primaryGenreName,
    genres: r.genres,
    rating: r.averageUserRating,
    ratings_count: r.userRatingCount,
    price: r.price,
    currency: r.currency,
    icon_url: r.artworkUrl512 ?? r.artworkUrl100 ?? "",
    iphone_screenshot_urls: r.screenshotUrls ?? [],
    ipad_screenshot_urls: r.ipadScreenshotUrls ?? [],
    content_rating: r.contentAdvisoryRating,
    released: r.releaseDate,
    updated: r.currentVersionReleaseDate,
    version: r.version,
    url: r.trackViewUrl,
    supported_devices: r.supportedDevices,
    languages: r.languageCodesISO2A,
  };
}
