/**
 * Health Check API — Supabase 연결 상태 확인용
 *
 * GET /api/health
 *
 * 응답 예:
 *   { "ok": true, "tables": ["admin_users", "customers", ...] }
 *
 * 실패 시:
 *   { "ok": false, "error": "..." }
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();

    // 테이블 목록 조회로 연결 확인
    // aso_benchmarks는 public 조회 가능하고 비어있으니 count만 확인
    const { count, error } = await admin
      .from("aso_benchmarks")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Supabase 연결 성공",
      aso_benchmarks_count: count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
