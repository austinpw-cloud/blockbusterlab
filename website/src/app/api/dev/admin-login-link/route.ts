/**
 * 개발 전용: 이메일 발송 없이 관리자 세션을 직접 설정.
 *
 * 배경: Supabase Free 플랜 이메일 rate limit 으로 로컬 로그인이 막힐 때 우회용.
 *
 * 동작:
 *  1. admin.auth.admin.generateLink() 로 매직 링크 token_hash 생성 (이메일 발송 없음)
 *  2. 서버 클라이언트의 verifyOtp() 로 세션 쿠키 설정
 *  3. /admin 으로 리다이렉트
 *
 * 보안:
 *  - NODE_ENV !== "development" 에서는 404
 *  - admin_users 테이블에 등록된 이메일만 허용
 *
 * 사용: 브라우저에서 직접 열기
 *   http://localhost:3000/api/dev/admin-login-link?email=bbl@blockbusterlab.com
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json(
      { error: "email query parameter required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("id, is_active")
    .eq("email", email)
    .maybeSingle();

  if (!adminRow || !adminRow.is_active) {
    return NextResponse.json(
      { error: "email not registered as admin" },
      { status: 403 }
    );
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData.properties.hashed_token) {
    return NextResponse.json(
      { error: linkError?.message ?? "failed to generate link" },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });

  if (verifyError) {
    return NextResponse.json({ error: verifyError.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL("/admin", req.url));
}
