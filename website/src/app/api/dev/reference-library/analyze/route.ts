/**
 * 개발 전용: Reference Library 분석 파이프라인 트리거.
 *
 * 레이어:
 *   L1 = 아이콘 + 텍스트 + 스크린샷 슬롯 분석 (병렬)
 *   L2 = 게임 단위 ASO 수법 합성 (Opus)
 *   L3 = 축 조합별 패턴 합성 (Opus)
 *
 * 사용:
 *   curl "http://localhost:3000/api/dev/reference-library/analyze?levels=1"
 *   curl "http://localhost:3000/api/dev/reference-library/analyze?levels=1,2,3&limit=5"
 *   curl "http://localhost:3000/api/dev/reference-library/analyze?levels=2&genre=puzzle"
 *   curl "http://localhost:3000/api/dev/reference-library/analyze?levels=3&genre=puzzle"
 *
 * 레이어 기본값: 미지정 시 [1] (아이콘+텍스트+슬롯). 재실행 안전 (이미 분석된 것은 skip).
 */

import { NextRequest, NextResponse } from "next/server";
import { runPipeline, type PipelineOptions } from "@/lib/reference-library/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 800;

function parseLevels(s: string | null): Array<1 | 2 | 3> {
  if (!s) return [1];
  const parts = s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const out: Array<1 | 2 | 3> = [];
  for (const p of parts) {
    if (p === "1" || p === "2" || p === "3") {
      out.push(Number(p) as 1 | 2 | 3);
    }
  }
  return out.length > 0 ? out : [1];
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const levels = parseLevels(sp.get("levels"));
  const limitParam = sp.get("limit");
  const genre = sp.get("genre");
  const country = sp.get("country");
  const l3MarketsParam = sp.get("l3_markets");

  const opts: PipelineOptions = {
    levels,
    genre: genre || null,
    country: country || null,
    limit: limitParam ? parseInt(limitParam, 10) : null,
    l3_markets: l3MarketsParam
      ? l3MarketsParam.split(",").map((x) => x.trim()).filter(Boolean)
      : undefined,
  };

  try {
    const result = await runPipeline(opts);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
