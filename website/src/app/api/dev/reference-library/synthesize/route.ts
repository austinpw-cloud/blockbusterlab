/**
 * 개발 전용: Reference Library L3 패턴 합성 단독 실행.
 *
 * 사용:
 *   # Tier A (전체 장르 × kr/us/jp/cn)
 *   curl -X POST http://localhost:3000/api/dev/reference-library/synthesize \
 *     -H "Content-Type: application/json" -d '{"tier":"A"}'
 *
 *   # 특정 장르 × 시장 한 건
 *   curl -X POST http://localhost:3000/api/dev/reference-library/synthesize \
 *     -H "Content-Type: application/json" \
 *     -d '{"genre":"puzzle","market":"kr"}'
 *
 *   # 4축 전부 지정 (Tier C)
 *   curl -X POST http://localhost:3000/api/dev/reference-library/synthesize \
 *     -H "Content-Type: application/json" \
 *     -d '{"genre":"puzzle","market":"kr","monetization_model":"f2p_iap","studio_size":"indie"}'
 *
 *   # Tier A 중 특정 장르만
 *   curl -X POST http://localhost:3000/api/dev/reference-library/synthesize \
 *     -H "Content-Type: application/json" -d '{"tier":"A","genres":["puzzle","rpg"]}'
 */

import { NextRequest, NextResponse } from "next/server";
import {
  synthesizeOnePattern,
  synthesizeTierA,
  type AxisFilter,
} from "@/lib/reference-library/synthesize-patterns";

export const runtime = "nodejs";
export const maxDuration = 300;

type SynthesizeBody = {
  tier?: "A";
  genres?: string[];
  markets?: string[];
  genre?: string;
  market?: string | null;
  monetization_model?: string | null;
  studio_size?: string | null;
};

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  let body: SynthesizeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (body.tier === "A") {
      const summary = await synthesizeTierA(
        body.genres ?? null,
        body.markets ?? ["kr", "us", "jp", "cn"],
        (r, i, total) =>
          console.log(
            `[synthesize Tier A] ${i}/${total} axis=${r.axis_key} ${
              r.ok ? "ok" : r.error?.startsWith("표본 부족") ? "skip" : "fail"
            } n=${r.sample_size} $${r.cost_usd.toFixed(4)}`
          )
      );
      return NextResponse.json({ ok: true, summary });
    }

    // 단건 합성
    if (!body.genre) {
      return NextResponse.json(
        { error: "genre 필수 (또는 tier: 'A')" },
        { status: 400 }
      );
    }
    const filter: AxisFilter = {
      genre: body.genre,
      market: body.market ?? null,
      monetization_model: body.monetization_model ?? null,
      studio_size: body.studio_size ?? null,
    };
    const result = await synthesizeOnePattern(filter);
    return NextResponse.json({ ok: result.ok, result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
