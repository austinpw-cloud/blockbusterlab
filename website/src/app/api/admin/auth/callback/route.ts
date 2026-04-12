/**
 * GET /api/admin/auth/callback
 *
 * Supabase 매직 링크의 콜백 엔드포인트.
 * 쿼리 파라미터의 code를 세션으로 교환하고 /admin으로 리다이렉트.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") || "/admin";

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
