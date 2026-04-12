/**
 * GET /api/admin/orders
 *
 * 관리자 주문 목록 조회. 관리자 인증 필수.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function GET() {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const admin = createAdminClient();

    const { data: orders, error } = await admin
      .from("orders")
      .select(
        `
        id,
        order_number,
        service_type,
        package_tier,
        game_title,
        game_genre,
        store_url_android,
        target_market,
        core_features,
        additional_notes,
        status,
        price_krw,
        payment_status,
        due_date,
        created_at,
        customers(id, name, email, studio_name, phone)
      `
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 각 주문의 첨부 파일 개수
    const orderIds = orders?.map((o) => o.id) ?? [];
    const { data: fileCounts } = await admin
      .from("order_files")
      .select("order_id, category")
      .in("order_id", orderIds);

    const fileCountByOrder: Record<string, Record<string, number>> = {};
    for (const row of fileCounts ?? []) {
      if (!fileCountByOrder[row.order_id]) {
        fileCountByOrder[row.order_id] = {};
      }
      fileCountByOrder[row.order_id][row.category] =
        (fileCountByOrder[row.order_id][row.category] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      count: orders?.length ?? 0,
      orders:
        orders?.map((o) => ({
          ...o,
          files: fileCountByOrder[o.id] ?? {},
        })) ?? [],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
