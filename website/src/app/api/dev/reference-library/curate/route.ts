/**
 * 개발 전용: Reference Library 50개 큐레이션 수집 트리거.
 *
 * 사용:
 *   # dry-run — 후보 선별까지만, 실제 수집 안 함
 *   curl "http://localhost:3000/api/dev/reference-library/curate?dry_run=true"
 *
 *   # 실제 실행
 *   curl "http://localhost:3000/api/dev/reference-library/curate?execute=true"
 *
 * 안전 가드: execute=true 명시 안 하면 dry_run 으로 강제.
 */

import { NextRequest, NextResponse } from "next/server";
import { curateLibrary } from "@/lib/reference-library/curate";

export const runtime = "nodejs";
export const maxDuration = 800;

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const execute = sp.get("execute") === "true";
  const includeAll = sp.get("include_all") === "true";

  try {
    const result = await curateLibrary({
      dry_run: !execute,
      include_all_candidates: includeAll,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
