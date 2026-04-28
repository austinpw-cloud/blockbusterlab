/**
 * 개발 전용: Reference Library 실행 상태 가시성 엔드포인트 (Q3).
 *
 * 배경 (ChatGPT Q3 피드백): "Library-first 를 실제 운영 루프로 닫는 부분.
 * 지금 필요한 건 새 구조 설계가 아니라 실행 결과가 어디까지 찼는지, 어떤 축이
 * 비어 있는지, 실패한 항목이 무엇인지 확인 가능한 운영 시야."
 *
 * 이 엔드포인트는 L1~L3 진행 상황을 **한 번 호출로** 보여줌:
 *   - reference_games 총 개수 + 장르·국가 breakdown
 *   - L1 (아이콘·텍스트·스크린샷 슬롯) 분석 완료 수
 *   - L2 (game-level aso_analysis) 완료 수
 *   - L3 (library_patterns) 합성 수 + confidence 분포
 *   - **커버리지 갭**: reference_games 가 있지만 library_patterns 는 없는 axis 조합
 *
 * 사용:
 *   curl "http://localhost:3000/api/dev/reference-library/status" | jq
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type GameRow = {
  genre: string;
  country: string;
  target_markets: string[] | null;
  icon_analyzed_at: string | null;
  text_analyzed_at: string | null;
  aso_analyzed_at: string | null;
};

type ScreenshotRow = {
  id: string;
  analysis: Record<string, unknown> | null;
};

type PatternRow = {
  axis_key: string;
  genre: string;
  market: string | null;
  monetization_model: string | null;
  studio_size: string | null;
  sample_size: number;
  confidence: "high" | "medium" | "low";
  synthesized_at: string;
  pending_commission_insights: number;
};

function incKey(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  const admin = createAdminClient();

  try {
    // ───────── 1. reference_games 전수 조회 ─────────
    const { data: gamesRaw, error: gamesErr } = await admin
      .from("reference_games")
      .select(
        "genre, country, target_markets, icon_analyzed_at, text_analyzed_at, aso_analyzed_at"
      );
    if (gamesErr) {
      return NextResponse.json({ error: gamesErr.message }, { status: 500 });
    }
    const games = (gamesRaw ?? []) as GameRow[];

    // ───────── 2. reference_screenshots 전수 조회 ─────────
    const { data: shotsRaw, error: shotsErr } = await admin
      .from("reference_screenshots")
      .select("id, analysis");
    if (shotsErr) {
      return NextResponse.json({ error: shotsErr.message }, { status: 500 });
    }
    const shots = (shotsRaw ?? []) as ScreenshotRow[];

    // ───────── 3. library_patterns 전수 조회 ─────────
    const { data: patternsRaw, error: patternsErr } = await admin
      .from("library_patterns")
      .select(
        "axis_key, genre, market, monetization_model, studio_size, sample_size, confidence, synthesized_at, pending_commission_insights"
      );
    if (patternsErr) {
      return NextResponse.json({ error: patternsErr.message }, { status: 500 });
    }
    const patterns = (patternsRaw ?? []) as PatternRow[];

    // ───────── 4. 집계 ─────────
    const by_genre: Record<string, number> = {};
    const by_country: Record<string, number> = {};
    const by_genre_market: Record<string, number> = {};
    let icon_done = 0;
    let text_done = 0;
    let aso_done = 0;
    const l2_by_genre: Record<string, number> = {};

    for (const g of games) {
      incKey(by_genre, g.genre);
      incKey(by_country, g.country);
      const markets = g.target_markets?.length ? g.target_markets : [g.country];
      for (const m of markets) {
        incKey(by_genre_market, `${g.genre}|${m}`);
      }
      if (g.icon_analyzed_at) icon_done++;
      if (g.text_analyzed_at) text_done++;
      if (g.aso_analyzed_at) {
        aso_done++;
        incKey(l2_by_genre, g.genre);
      }
    }

    const screenshots_analyzed = shots.filter((s) => s.analysis !== null).length;

    const l3_by_confidence: Record<string, number> = { high: 0, medium: 0, low: 0 };
    for (const p of patterns) {
      l3_by_confidence[p.confidence] = (l3_by_confidence[p.confidence] ?? 0) + 1;
    }

    // ───────── 5. 커버리지 갭 탐색 ─────────
    // games 가 있는 (genre, market) 조합 vs patterns 가 커버하는 조합 비교.
    // patterns 의 fallback 은 고려 — market=null 이면 genre 만 매칭되는 광역 패턴.
    const covered_genres = new Set<string>();
    const covered_genre_market = new Set<string>();
    for (const p of patterns) {
      if (p.market) {
        covered_genre_market.add(`${p.genre}|${p.market}`);
      } else {
        covered_genres.add(p.genre);
      }
    }

    const coverage_gaps: Array<{
      genre: string;
      market: string;
      games_count: number;
      note: string;
    }> = [];
    for (const [key, count] of Object.entries(by_genre_market)) {
      const [genre, market] = key.split("|");
      if (covered_genre_market.has(key)) continue;
      if (covered_genres.has(genre)) {
        // 광역(genre-only) 패턴은 있지만 구체(genre+market) 패턴은 없음
        coverage_gaps.push({
          genre,
          market,
          games_count: count,
          note: "genre-only 패턴으로 폴백 가능",
        });
      } else {
        // 해당 장르 자체에 library_patterns 가 없음 — fallback_level=none 위험
        coverage_gaps.push({
          genre,
          market,
          games_count: count,
          note: "해당 장르에 library_patterns 없음 (L3 실행 필요)",
        });
      }
    }

    // ───────── 6. 경고 플래그 ─────────
    const warnings: string[] = [];
    if (games.length === 0) {
      warnings.push("reference_games 가 0건 — 큐레이션 실행 필요");
    }
    if (games.length > 0 && aso_done === 0) {
      warnings.push("L2 분석 완료 게임이 0건 — analyze?levels=2 실행 필요");
    }
    if (games.length > 0 && patterns.length === 0) {
      warnings.push(
        "library_patterns 가 0건 — L3 synthesize 실행 필요. 현재 Stage 8 에서 fallback_level=none 발생"
      );
    }
    if (coverage_gaps.length > 0) {
      warnings.push(
        `커버리지 갭 ${coverage_gaps.length} 조합 — 일부 의뢰가 광역 폴백 또는 폴백 부재 상태`
      );
    }

    return NextResponse.json({
      ok: true,
      summary: {
        games_total: games.length,
        screenshots_total: shots.length,
        patterns_total: patterns.length,
        warnings,
      },
      collected: {
        by_genre,
        by_country,
        by_genre_market,
      },
      l1_analysis: {
        icon_done,
        icon_pending: games.length - icon_done,
        text_done,
        text_pending: games.length - text_done,
        screenshots_total: shots.length,
        screenshots_analyzed,
        screenshots_pending: shots.length - screenshots_analyzed,
      },
      l2_analysis: {
        analyzed: aso_done,
        pending: games.length - aso_done,
        by_genre: l2_by_genre,
      },
      l3_patterns: {
        total: patterns.length,
        by_confidence: l3_by_confidence,
        rows: patterns.map((p) => ({
          axis_key: p.axis_key,
          sample_size: p.sample_size,
          confidence: p.confidence,
          synthesized_at: p.synthesized_at,
          pending_commission_insights: p.pending_commission_insights,
        })),
      },
      coverage_gaps,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
