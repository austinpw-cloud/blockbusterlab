/**
 * 개발 전용: library_patterns 조회 디버그.
 *
 * 사용:
 *   curl "http://localhost:3000/api/dev/reference-library/patterns?axis=genre%3Dpuzzle%3Bmarket%3Dkr%3Bmonetization%3D*%3Bstudio_size%3D*"
 *   curl "http://localhost:3000/api/dev/reference-library/patterns?genre=puzzle"
 *   curl "http://localhost:3000/api/dev/reference-library/patterns?genre=puzzle&market=kr"
 *
 * axis 파라미터가 있으면 단일 axis_key 로 조회.
 * 없으면 genre/market/monetization/studio 필터로 조회.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const admin = createAdminClient();

  try {
    if (sp.get("axis")) {
      const { data, error } = await admin
        .from("library_patterns")
        .select("*")
        .eq("axis_key", sp.get("axis"))
        .maybeSingle();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ found: false }, { status: 404 });
      }
      return NextResponse.json({ found: true, row: data });
    }

    let q = admin
      .from("library_patterns")
      .select(
        "axis_key, genre, market, monetization_model, studio_size, sample_size, confidence, synthesized_at, pending_commission_insights, synthesis_cost_usd"
      );

    const genre = sp.get("genre");
    const market = sp.get("market");
    const monetization = sp.get("monetization");
    const studio = sp.get("studio_size");

    if (genre) q = q.eq("genre", genre);
    if (market) q = q.eq("market", market);
    if (monetization) q = q.eq("monetization_model", monetization);
    if (studio) q = q.eq("studio_size", studio);

    const { data, error } = await q.order("synthesized_at", {
      ascending: false,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: data?.length ?? 0, rows: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
