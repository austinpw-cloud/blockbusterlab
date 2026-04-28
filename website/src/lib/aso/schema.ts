/**
 * 주문 접수 서버 검증 스키마 (Zod).
 *
 * 클라이언트에서 FormData로 전달받은 데이터를 검증하고
 * 타입 안전하게 DB에 저장할 수 있도록 해줌.
 */

import { z } from "zod";
import { GAME_GENRES, TARGET_MARKETS, ASO_PACKAGES } from "./constants";

const genreIds = GAME_GENRES.map((g) => g.id) as [string, ...string[]];
const marketIds = TARGET_MARKETS.map((m) => m.id) as [string, ...string[]];
const packageIds = ASO_PACKAGES.map((p) => p.id) as [string, ...string[]];

/**
 * Google Play 스토어 URL 형식 검증.
 * - 허용: `https://play.google.com/store/apps/details?id=...` (또는 `&` 로 이어지는 추가 파라미터)
 * - 거부: 다른 도메인·HTTP·쿼리 누락
 */
const GOOGLE_PLAY_URL_RE = /^https:\/\/play\.google\.com\/store\/apps\/details\?(.*&)?id=[A-Za-z0-9._]+/;

/**
 * Apple App Store URL 형식 검증.
 * - 허용: `https://apps.apple.com/{cc}/app/{slug}/id12345` · `https://apps.apple.com/app/id12345` 등
 * - 거부: 다른 도메인·trackId 없음
 */
const APPLE_APP_STORE_URL_RE = /^https:\/\/apps\.apple\.com\/(?:[a-z]{2}\/)?app\/(?:[^/]+\/)?id\d+/i;

export const orderInputSchema = z
  .object({
    // 고객 정보
    customer_name: z.string().min(1, "이름을 입력해 주세요").max(100),
    customer_email: z.string().email("올바른 이메일을 입력해 주세요"),
    customer_phone: z.string().optional().or(z.literal("")),
    studio_name: z.string().min(1, "스튜디오명을 입력해 주세요").max(200),

    // 게임 정보
    game_title: z.string().min(1, "게임 제목을 입력해 주세요").max(200),
    game_genre: z.enum(genreIds, { message: "장르를 선택해 주세요" }),
    store_url_android: z
      .string()
      .url("올바른 URL을 입력해 주세요")
      .refine(
        (v) => GOOGLE_PLAY_URL_RE.test(v),
        "Google Play URL (https://play.google.com/store/apps/details?id=...) 형식이어야 합니다"
      )
      .optional()
      .or(z.literal("")),
    store_url_apple: z
      .string()
      .url("올바른 URL을 입력해 주세요")
      .refine(
        (v) => APPLE_APP_STORE_URL_RE.test(v),
        "Apple App Store URL (https://apps.apple.com/.../app/.../id...) 형식이어야 합니다"
      )
      .optional()
      .or(z.literal("")),
    target_markets: z
      .array(z.enum(marketIds))
      .min(1, "최소 1개 타겟 시장을 선택해 주세요"),

    // 핵심 특징 — 스토어 URL이 있으면 생략 가능 (자동 수집된 소개문에서 추론)
    feature_1: z.string().max(500).optional().or(z.literal("")),
    feature_2: z.string().max(500).optional().or(z.literal("")),
    feature_3: z.string().max(500).optional().or(z.literal("")),

    // 추가 메모
    emphasis_notes: z.string().max(2000).optional().or(z.literal("")),
    avoid_notes: z.string().max(2000).optional().or(z.literal("")),

    // 패키지
    package_id: z.enum(packageIds, { message: "패키지를 선택해 주세요" }),
  });

export type OrderInput = z.infer<typeof orderInputSchema>;

/**
 * 파일 업로드 검증
 */
export const ALLOWED_FILE_TYPES = {
  screenshot: ["image/jpeg", "image/png", "image/webp"],
  logo: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  other: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "application/pdf",
  ],
};

export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MIN_SCREENSHOT_COUNT = 5;
export const MAX_SCREENSHOT_COUNT = 15;
export const MAX_LOGO_COUNT = 5;
export const MAX_OTHER_COUNT = 10;

/**
 * 카테고리별 MIME·개수 서버 검증.
 * 실패 시 사용자 친화 메시지 반환. 성공 시 null.
 */
export function validateFilesForCategory(
  files: File[],
  category: "screenshot" | "logo" | "other",
  max: number
): string | null {
  if (files.length > max) {
    return `${category} 파일은 최대 ${max}개까지 업로드 가능합니다 (현재 ${files.length}개)`;
  }
  const allowed = ALLOWED_FILE_TYPES[category];
  for (const f of files) {
    if (!allowed.includes(f.type)) {
      return `허용되지 않는 파일 형식: ${f.name} (${f.type || "unknown"}). 허용: ${allowed.join(", ")}`;
    }
  }
  return null;
}
