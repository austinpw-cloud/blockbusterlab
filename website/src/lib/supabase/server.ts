/**
 * 서버(Server Component, Route Handler, Server Action)에서 사용하는
 * 쿠키 기반 Supabase 클라이언트.
 *
 * - Publishable key 사용 (RLS는 로그인한 사용자의 세션으로 적용됨)
 * - 쿠키를 통해 SSR 환경에서도 사용자 세션 유지
 *
 * 사용 예:
 *   import { createClient } from "@/lib/supabase/server";
 *   const supabase = await createClient();
 *   const { data } = await supabase.from("orders").select();
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서 호출된 경우 set 불가능 - middleware에서 처리됨
        }
      },
    },
  });
}
