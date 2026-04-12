/**
 * Supabase 환경변수 검증 및 중앙 관리
 *
 * 실수로 .env가 없는 상태에서 배포되면 여기서 먼저 에러가 터지도록.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[supabase] Missing required env: ${name}. Check .env.local or Vercel environment variables.`
    );
  }
  return value;
}

/** 브라우저에서도 사용 가능 (Publishable key) */
export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL
);

export const SUPABASE_PUBLISHABLE_KEY = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

/**
 * 서버 전용 (Secret key)
 *
 * 브라우저 번들에 포함되면 안 됨.
 * admin.ts 모듈에서만 import할 것.
 */
export function getSupabaseSecretKey(): string {
  return required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);
}
