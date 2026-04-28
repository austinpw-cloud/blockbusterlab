/**
 * 개발 전용: 분석 상태 리셋 엔드포인트 (재분석 트리거).
 *
 * 배경: `analyzeUnanalyzedXxx` 가 이미 분석된 것을 스킵하므로, 프롬프트 변경 후
 * 같은 게임을 재분석하려면 DB 의 analyzed_at 필드를 NULL 로 리셋해야 함.
 * 수동 SQL 대신 엔드포인트로 제공.
 *
 * ⚠ 파괴적 작업이라 POST 방식 + 최소 하나의 필터 필수.
 *
 * 사용:
 *   curl -X POST "http://localhost:3000/api/dev/reference-library/reset" \
 *     -H "Content-Type: application/json" \
 *     -d '{"level":"all","app_id":"com.lunosoft.ttheroes.android"}'
 *
 *   curl -X POST "http://localhost:3000/api/dev/reference-library/reset" \
 *     -H "Content-Type: application/json" \
 *     -d '{"level":1,"game_id":"uuid-here"}'
 *
 *   curl -X POST "http://localhost:3000/api/dev/reference-library/reset" \
 *     -H "Content-Type: application/json" \
 *     -d '{"level":2,"genre":"puzzle"}'
 *
 *   # L3 패턴 행 삭제 (특정 axis_key)
 *   curl -X POST "http://localhost:3000/api/dev/reference-library/reset" \
 *     -H "Content-Type: application/json" \
 *     -d '{"level":3,"axis_key":"genre=puzzle;market=kr;monetization=*;studio_size=*"}'
 *
 *   # L3 패턴 전체 삭제 (해당 장르)
 *   curl -X POST "http://localhost:3000/api/dev/reference-library/reset" \
 *     -H "Content-Type: application/json" \
 *     -d '{"level":3,"genre":"puzzle"}'
 *
 * Level 의미:
 *   - 1: L1 리셋 (icon_analysis·text_analysis·screenshot slots)
 *   - 2: L2 리셋 (aso_analysis)
 *   - 3: L3 리셋 (library_patterns 행 삭제)
 *   - "all": 1 + 2 + 3
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ResetRequest = {
  level: 1 | 2 | 3 | "all";
  /** 특정 게임 UUID */
  game_id?: string;
  /** 특정 app_id (예: com.lunosoft.ttheroes.android 또는 1234567890). game_id 보다 편의 */
  app_id?: string;
  /** 장르 필터 (L1/L2/L3 모두 적용) */
  genre?: string;
  /** 국가 필터 (L1/L2 만) */
  country?: string;
  /** L3 전용: 특정 axis_key 행만 삭제 */
  axis_key?: string;
};

type ResetSummary = {
  l1_games_reset: number;
  l1_screenshots_reset: number;
  l2_games_reset: number;
  l3_patterns_deleted: number;
};

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  let body: ResetRequest;
  try {
    body = (await req.json()) as ResetRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { level, game_id, app_id, genre, country, axis_key } = body;

  if (!level) {
    return NextResponse.json({ error: "level required" }, { status: 400 });
  }
  if (level !== 1 && level !== 2 && level !== 3 && level !== "all") {
    return NextResponse.json(
      { error: "level must be 1 | 2 | 3 | 'all'" },
      { status: 400 }
    );
  }

  // 안전장치: 최소 하나의 필터 필수 (전체 리셋 방지)
  if (!game_id && !app_id && !genre && !axis_key) {
    return NextResponse.json(
      {
        error:
          "최소 하나의 필터 필수 (game_id / app_id / genre / axis_key). 전체 리셋 방지.",
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const summary: ResetSummary = {
    l1_games_reset: 0,
    l1_screenshots_reset: 0,
    l2_games_reset: 0,
    l3_patterns_deleted: 0,
  };

  try {
    // ───────── 대상 게임 UUID 선별 ─────────
    // game_id 직접 지정이 아니면 app_id/genre/country 로 조회해 id 리스트 구성.
    let targetGameIds: string[] = [];
    if (game_id) {
      targetGameIds = [game_id];
    } else if (app_id || genre) {
      let q = admin.from("reference_games").select("id");
      if (app_id) q = q.eq("app_id", app_id);
      if (genre) q = q.eq("genre", genre);
      if (country) q = q.eq("country", country);
      const { data, error } = await q;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      targetGameIds = (data ?? []).map((r) => r.id as string);
    }

    const wantsL1 = level === 1 || level === "all";
    const wantsL2 = level === 2 || level === "all";
    const wantsL3 = level === 3 || level === "all";

    // ───────── L1 리셋 ─────────
    if (wantsL1 && targetGameIds.length > 0) {
      // reference_games 의 L1 필드 + 분석 타임스탬프 리셋
      const { data: l1updated, error: l1err } = await admin
        .from("reference_games")
        .update({
          icon_analysis: null,
          icon_analyzed_at: null,
          icon_analysis_cost_usd: null,
          text_analysis: null,
          text_analyzed_at: null,
          text_analysis_cost_usd: null,
        })
        .in("id", targetGameIds)
        .select("id");
      if (l1err) {
        return NextResponse.json(
          { error: `L1 games reset 실패: ${l1err.message}` },
          { status: 500 }
        );
      }
      summary.l1_games_reset = l1updated?.length ?? 0;

      // reference_screenshots 의 analysis·analyzed_at 리셋
      const { data: l1shots, error: l1shotErr } = await admin
        .from("reference_screenshots")
        .update({ analysis: null, analyzed_at: null })
        .in("game_id", targetGameIds)
        .select("id");
      if (l1shotErr) {
        return NextResponse.json(
          { error: `L1 screenshots reset 실패: ${l1shotErr.message}` },
          { status: 500 }
        );
      }
      summary.l1_screenshots_reset = l1shots?.length ?? 0;
    }

    // ───────── L2 리셋 ─────────
    if (wantsL2 && targetGameIds.length > 0) {
      const { data: l2updated, error: l2err } = await admin
        .from("reference_games")
        .update({
          aso_analysis: null,
          aso_analyzed_at: null,
          aso_analysis_cost_usd: null,
        })
        .in("id", targetGameIds)
        .select("id");
      if (l2err) {
        return NextResponse.json(
          { error: `L2 reset 실패: ${l2err.message}` },
          { status: 500 }
        );
      }
      summary.l2_games_reset = l2updated?.length ?? 0;
    }

    // ───────── L3 리셋 (library_patterns 행 삭제) ─────────
    if (wantsL3) {
      let dq = admin.from("library_patterns").delete().select("id");
      if (axis_key) {
        dq = dq.eq("axis_key", axis_key);
      } else if (genre) {
        dq = dq.eq("genre", genre);
      } else {
        // L3 는 axis_key 또는 genre 필터만 유효. game_id/app_id 기반으로 L3 삭제는 의미 약함
        // (패턴은 여러 게임 합성이라 단일 게임만 제외해도 재합성해야 함)
        return NextResponse.json(
          {
            error:
              "L3 리셋은 axis_key 또는 genre 필터만 유효. game_id/app_id 로는 L3 를 부분 리셋할 수 없음 (재합성 필요)",
          },
          { status: 400 }
        );
      }
      const { data: l3deleted, error: l3err } = await dq;
      if (l3err) {
        return NextResponse.json(
          { error: `L3 reset 실패: ${l3err.message}` },
          { status: 500 }
        );
      }
      summary.l3_patterns_deleted = l3deleted?.length ?? 0;
    }

    return NextResponse.json({
      ok: true,
      filter: { level, game_id, app_id, genre, country, axis_key },
      target_game_count: targetGameIds.length,
      summary,
      note:
        "리셋 후 /api/dev/reference-library/analyze 로 재분석하면 스킵되지 않고 다시 돌아감",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
