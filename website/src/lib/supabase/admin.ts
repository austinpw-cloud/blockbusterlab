/**
 * 관리자 권한으로 DB에 접근하는 Supabase 클라이언트 (서버 전용).
 *
 * ⚠️ 주의:
 * - Secret key 사용 → RLS 우회 (모든 데이터 접근 가능)
 * - 절대 브라우저에서 import하지 말 것
 * - Route Handler / Server Action / Background Job에서만 사용
 *
 * 용도:
 * - 주문 접수 API (고객 인증 전 작성)
 * - AI 분석 결과 저장 (백그라운드 작업)
 * - 관리자 백오피스 (관리자 권한 확인 후 사용)
 *
 * 사용 예:
 *   import { createAdminClient } from "@/lib/supabase/admin";
 *   const admin = createAdminClient();
 *   await admin.from("orders").insert({ ... });
 */

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, getSupabaseSecretKey } from "./env";

export function createAdminClient() {
  const secretKey = getSupabaseSecretKey();

  return createClient(SUPABASE_URL, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
