/**
 * 개발 전용: 단일 게임 L2 합성을 실행하고 실제 에러 메시지를 그대로 반환.
 *
 * 사용:
 *   curl "http://localhost:3000/api/dev/reference-library/debug-l2?app_id=com.dreamgames.royalmatch"
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { complete, parseJsonResponse } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import {
  GAME_ASO_SYNTHESIS_SYSTEM_PROMPT,
  buildGameAsoSynthesisPrompt,
} from "@/lib/reference-library/analyze-game-prompt";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  const appId = req.nextUrl.searchParams.get("app_id");
  if (!appId) {
    return NextResponse.json({ error: "app_id required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: game, error: gErr } = await admin
    .from("reference_games")
    .select(
      "id, title, genre, country, target_markets, monetization_model, studio_size, selection_basis, icon_analysis, text_analysis, monetization, video_url"
    )
    .eq("app_id", appId)
    .maybeSingle();

  if (gErr || !game) {
    return NextResponse.json({ error: gErr?.message ?? "game not found" }, { status: 404 });
  }

  const { data: slots } = await admin
    .from("reference_screenshots")
    .select("game_id, slot_number, analysis")
    .eq("game_id", game.id)
    .order("slot_number");

  try {
    const userMessage = buildGameAsoSynthesisPrompt({
      title: game.title,
      genre: game.genre,
      country: game.country,
      target_markets: game.target_markets,
      monetization_model: game.monetization_model,
      studio_size: game.studio_size,
      selection_basis: game.selection_basis,
      icon_analysis: game.icon_analysis,
      text_analysis: game.text_analysis,
      screenshot_slots: (slots ?? []).map((s) => ({
        slot_number: s.slot_number,
        analysis: s.analysis,
      })),
      monetization_raw: game.monetization,
      has_video: !!game.video_url,
    });

    const completion = await complete({
      model: MODELS.OPUS,
      system: GAME_ASO_SYNTHESIS_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 4000,
      temperature: 0.3,
    });

    let parsed: unknown;
    let parseError: string | null = null;
    try {
      parsed = parseJsonResponse(completion.text);
    } catch (e) {
      parseError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({
      ok: true,
      game: { title: game.title, app_id: appId },
      prompt_length: userMessage.length,
      input_tokens: completion.input_tokens,
      output_tokens: completion.output_tokens,
      stop_reason: completion.stop_reason,
      raw_text_first_500: completion.text.slice(0, 500),
      raw_text_last_500: completion.text.slice(-500),
      parse_error: parseError,
      parsed_keys: parsed && typeof parsed === "object" ? Object.keys(parsed) : null,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
      { status: 500 }
    );
  }
}
