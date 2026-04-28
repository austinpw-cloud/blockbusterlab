/**
 * 개발 전용: 테스트 주문 생성 + Stage 8 분석 실행.
 *
 * 사용:
 *   curl "http://localhost:3000/api/dev/run-stage8?app_id=com.lunosoft.trash&genre=simulation&market=korea"
 *
 * 동작:
 *  1. customers + orders + 자동 스크래핑 트리거 없이 최소 주문 row 직접 생성
 *  2. generateAsoForOrder(orderId) 호출 → Library 조회 + Opus 분석
 *  3. 결과 + library 사용 여부(fallback_level) + 비용 반환
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAsoForOrder } from "@/lib/ai/aso-analyzer";

export const runtime = "nodejs";
export const maxDuration = 800;

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const appId = sp.get("app_id");
  const genre = sp.get("genre") ?? "casual";
  const market = sp.get("market") ?? "korea";

  if (!appId) {
    return NextResponse.json({ error: "app_id required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 테스트용 더미 customer 가져오기 또는 생성
  let { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("email", "dev-test@blockbusterlab.com")
    .maybeSingle();

  if (!customer) {
    const { data: newCustomer, error } = await admin
      .from("customers")
      .insert({
        name: "Dev Test",
        email: "dev-test@blockbusterlab.com",
        studio_name: "Dev Studio",
      })
      .select("id")
      .single();
    if (error || !newCustomer) {
      return NextResponse.json({ error: `customer 생성 실패: ${error?.message}` }, { status: 500 });
    }
    customer = newCustomer;
  }

  // 주문 생성 (제목은 스크래퍼가 채워주지 않으므로 미리 채움)
  const orderNumber = `BBL-DEV-${Date.now()}`;
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customer.id,
      service_type: "aso",
      package_tier: "standard",
      game_title: "테스트 게임 (자동 스크래핑 후 갱신)",
      game_genre: genre,
      store_url_android: `https://play.google.com/store/apps/details?id=${appId}`,
      target_market: market,
      status: "pending",
    })
    .select("id, order_number")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: `order 생성 실패: ${orderErr?.message}` }, { status: 500 });
  }

  // Stage 8 분석 실행
  try {
    const result = await generateAsoForOrder(order.id);
    return NextResponse.json({
      ok: true,
      order: { id: order.id, order_number: order.order_number },
      usage: result.usage,
      result_keys: Object.keys(result.result),
      result_preview: {
        executive_summary: (result.result as Record<string, unknown>).executive_summary,
        positioning_strategy: (result.result as Record<string, unknown>).positioning_strategy,
        title_candidates: (result.result as Record<string, unknown>).title_candidates,
        priority_actions: (result.result as Record<string, unknown>).priority_actions,
      },
      validation: result.validation,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        order: { id: order.id, order_number: order.order_number },
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack?.split("\n").slice(0, 8) : undefined,
      },
      { status: 500 }
    );
  }
}
