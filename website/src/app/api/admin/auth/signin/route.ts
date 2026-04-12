/**
 * POST /api/admin/auth/signin
 *
 * 관리자 이메일 입력 → 매직 링크 발송.
 *
 * 보안:
 *  - admin_users 테이블에 등록된 이메일만 허용
 *  - 관리자 아닌 이메일은 항상 동일한 응답 (이메일 존재 여부 노출 방지)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const runtime = "nodejs";

const signinSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해 주세요"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = signinSchema.parse(body);

    // admin_users에 있는 이메일인지 확인
    const admin = createAdminClient();
    const { data: adminRow } = await admin
      .from("admin_users")
      .select("id, is_active")
      .eq("email", email)
      .maybeSingle();

    // 관리자가 아니어도 성공 응답은 동일하게 (이메일 존재 탐지 방지)
    // 실제로는 아무 작업 안 함
    if (!adminRow || !adminRow.is_active) {
      console.warn(`[admin/signin] non-admin login attempt: ${email}`);
      return NextResponse.json({
        ok: true,
        message: "등록된 이메일이면 로그인 링크를 발송했습니다.",
      });
    }

    // 관리자면 매직 링크 발송
    const supabase = await createClient();
    const origin = req.nextUrl.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/api/admin/auth/callback`,
        // 관리자만 허용된 이메일이니 신규 가입도 허용 (auth.users 자동 생성)
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("[admin/signin] supabase error:", error.message);
      return NextResponse.json(
        { error: "로그인 링크 발송 실패. 잠시 후 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "등록된 이메일이면 로그인 링크를 발송했습니다.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "입력값 오류" },
        { status: 400 }
      );
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
