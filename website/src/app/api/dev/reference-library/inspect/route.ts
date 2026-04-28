/**
 * 개발 전용: 단일 게임의 L1/L2 분석 결과 풀 덤프 (표본 검토용).
 *
 * 사용:
 *   curl "http://localhost:3000/api/dev/reference-library/inspect?genre=puzzle"
 *   → 해당 장르 첫 번째 게임의 풀 데이터
 *
 *   curl "http://localhost:3000/api/dev/reference-library/inspect?app_id=com.example"
 *   → 특정 게임 지정
 *
 *   curl "http://localhost:3000/api/dev/reference-library/inspect?genre=puzzle&list=1"
 *   → 해당 장르 게임 목록만 (선택용)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const genre = sp.get("genre");
  const appId = sp.get("app_id");
  const listOnly = sp.get("list") === "1";

  const admin = createAdminClient();

  if (listOnly && genre) {
    const { data: games } = await admin
      .from("reference_games")
      .select(
        "id, app_id, title, country, genre, target_markets, monetization_model, studio_size, selection_basis, icon_analyzed_at, text_analyzed_at, aso_analyzed_at"
      )
      .eq("genre", genre)
      .order("title");
    return NextResponse.json({ games });
  }

  let query = admin
    .from("reference_games")
    .select("*")
    .limit(1);

  if (appId) {
    query = query.eq("app_id", appId);
  } else if (genre) {
    query = query.eq("genre", genre).order("title");
  } else {
    return NextResponse.json(
      { error: "genre or app_id query param required" },
      { status: 400 }
    );
  }

  const { data: gameRows } = await query;
  const game = gameRows?.[0];
  if (!game) {
    return NextResponse.json({ error: "no game found" }, { status: 404 });
  }

  const { data: screenshots } = await admin
    .from("reference_screenshots")
    .select("id, slot_number, storage_path, analysis, analyzed_at")
    .eq("game_id", game.id)
    .order("slot_number");

  return NextResponse.json({
    game: {
      id: game.id,
      app_id: game.app_id,
      title: game.title,
      developer: game.developer,
      country: game.country,
      genre: game.genre,
      target_markets: game.target_markets,
      monetization_model: game.monetization_model,
      studio_size: game.studio_size,
      selection_basis: game.selection_basis,
    },
    icon_analysis: game.icon_analysis,
    text_analysis: game.text_analysis,
    aso_analysis: game.aso_analysis,
    screenshots_summary: {
      total: screenshots?.length ?? 0,
      analyzed: screenshots?.filter((s) => s.analyzed_at).length ?? 0,
    },
    screenshot_samples: screenshots?.slice(0, 3).map((s) => ({
      slot_number: s.slot_number,
      storage_path: s.storage_path,
      analysis: s.analysis,
    })),
  });
}
