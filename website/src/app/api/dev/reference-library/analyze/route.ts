/**
 * 개발 전용: 미분석 스크린샷 Vision 분석 트리거.
 *
 * 사용:
 *   curl "http://localhost:3000/api/dev/reference-library/analyze?limit=10"
 *   curl "http://localhost:3000/api/dev/reference-library/analyze?genre=puzzle&country=kr"
 *   curl "http://localhost:3000/api/dev/reference-library/analyze"  (전부)
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeUnanalyzedScreenshots } from "@/lib/reference-library/analyze";

export const runtime = "nodejs";
export const maxDuration = 800;

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : null;
  const genre = req.nextUrl.searchParams.get("genre");
  const country = req.nextUrl.searchParams.get("country");

  try {
    const progress = await analyzeUnanalyzedScreenshots(
      limit,
      genre,
      country,
      (p) =>
        console.log(
          `[ref-analyze] ${p.processed}/${p.total} — ok: ${p.analyzed}, fail: ${p.failed}, cost: $${p.total_cost_usd.toFixed(4)}`
        )
    );
    return NextResponse.json({ ok: true, progress });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
