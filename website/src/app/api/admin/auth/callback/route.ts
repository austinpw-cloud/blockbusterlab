/**
 * GET /api/admin/auth/callback
 *
 * Supabase 매직 링크의 콜백 엔드포인트.
 * 쿼리 파라미터의 code를 세션으로 교환하고 /admin으로 리다이렉트.
 *
 * 보안: `next` 쿼리는 **admin 영역 내부 경로만** 허용. 외부 URL·protocol-relative URL·
 * 비-admin 경로는 전부 기본값 `/admin` 으로 강제 (오픈 리다이렉트 차단).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * `next` 쿼리 값이 안전한 admin 내부 경로인지 검증.
 * - 반드시 `/` 로 시작
 * - protocol-relative (`//...`) 차단
 * - backslash 기반 우회 (`/\\...`) 차단
 * - admin 영역 (`/admin`·`/admin/...`·`/admin?...`) 으로만 제한
 */
function isSafeAdminPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/\\")) return false;
  if (path === "/admin") return true;
  if (path.startsWith("/admin/")) return true;
  if (path.startsWith("/admin?")) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next");
  const nextPath = nextRaw && isSafeAdminPath(nextRaw) ? nextRaw : "/admin";

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=no_code", req.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(error.message)}`, req.url)
    );
  }

  return NextResponse.redirect(new URL(nextPath, req.url));
}
