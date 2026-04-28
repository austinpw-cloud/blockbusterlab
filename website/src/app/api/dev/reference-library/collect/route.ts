/**
 * 개발 전용: 장르별 Reference Library 수집 트리거.
 *
 * 사용:
 *   curl "http://localhost:3000/api/dev/reference-library/collect?genre=puzzle&topN=3"
 *   (샘플 검증용은 topN=3)
 *
 *   curl "http://localhost:3000/api/dev/reference-library/collect?genre=puzzle"
 *   (장르별 Top 10 전체)
 */

import { NextRequest, NextResponse } from "next/server";
import { collectReferenceGamesForGenre } from "@/lib/reference-library/collect";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  const genre = req.nextUrl.searchParams.get("genre");
  const topN = parseInt(req.nextUrl.searchParams.get("topN") ?? "10", 10);

  if (!genre) {
    return NextResponse.json(
      { error: "genre 쿼리 파라미터 필수" },
      { status: 400 }
    );
  }

  try {
    const progress = await collectReferenceGamesForGenre(genre, topN, "kr");
    return NextResponse.json({ ok: true, progress });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
