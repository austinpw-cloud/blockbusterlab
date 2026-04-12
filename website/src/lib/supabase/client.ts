/**
 * 브라우저(Client Component)에서 사용하는 Supabase 클라이언트.
 *
 * - Publishable key 사용 (공개 안전)
 * - RLS 정책에 의해 권한 제어
 * - 로그인한 사용자의 세션에 맞게 요청이 이루어짐
 *
 * 사용 예:
 *   "use client";
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 *   const { data } = await supabase.from("orders").select();
 */

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./env";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
