/**
 * 개발 전용: orders 검색 + 업로드 자료 미리보기.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const title = sp.get("title");
  const orderId = sp.get("order_id");

  const admin = createAdminClient();

  if (orderId) {
    const { data: order } = await admin
      .from("orders")
      .select(
        "id, order_number, game_title, game_genre, store_url_android, target_market, status, core_features, additional_notes"
      )
      .eq("id", orderId)
      .maybeSingle();

    const { data: files } = await admin
      .from("order_files")
      .select("id, file_type, storage_path, file_name")
      .eq("order_id", orderId)
      .order("file_type");

    const { data: analyses } = await admin
      .from("aso_analyses")
      .select("id, version, generated_at, model_used")
      .eq("order_id", orderId)
      .order("generated_at", { ascending: false });

    return NextResponse.json({
      order,
      files: files ?? [],
      analyses: analyses ?? [],
    });
  }

  let q = admin
    .from("orders")
    .select(
      "id, order_number, game_title, game_genre, store_url_android, target_market, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (title) q = q.ilike("game_title", `%${title}%`);

  const { data, error } = await q.limit(20);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data?.length ?? 0, orders: data ?? [] });
}
