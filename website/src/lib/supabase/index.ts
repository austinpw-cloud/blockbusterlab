/**
 * Supabase 모듈 진입점.
 *
 * 각 환경(클라이언트/서버/관리자)에 맞는 클라이언트를 직접 import하세요:
 *
 *   import { createClient } from "@/lib/supabase/client";   // 브라우저
 *   import { createClient } from "@/lib/supabase/server";   // 서버 (쿠키 기반)
 *   import { createAdminClient } from "@/lib/supabase/admin"; // 관리자 (서버 전용)
 */

export { SUPABASE_URL } from "./env";
