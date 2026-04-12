/**
 * 개발 전용 — 스크린샷 생성 테스트 엔드포인트.
 * 프로덕션 차단.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateScreenshotsForOrder } from "@/lib/screenshot/generate";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId 필요" }, { status: 400 });
  }

  try {
    const result = await generateScreenshotsForOrder(orderId);
    if (result.mode === "aso_screenshots") {
      return NextResponse.json({
        ok: true,
        mode: "aso_screenshots",
        deliverable_id: result.deliverable_id,
        verdict: result.judgment.verdict,
        screenshots: result.screenshots,
        usage: result.usage,
      });
    }
    return NextResponse.json({
      ok: true,
      mode: "upload_guide",
      deliverable_id: result.deliverable_id,
      verdict: result.judgment.verdict,
      keep_count: result.judgment.keep.length,
      missing_count: result.judgment.missing_materials.length,
      guide_preview: result.guide_markdown.slice(0, 500),
      usage: result.usage,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
