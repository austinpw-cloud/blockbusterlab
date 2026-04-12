/**
 * ASO 분석 & 결과물 생성 — v2 (품질 업그레이드).
 *
 * 파이프라인:
 *   1. 주문 조회
 *   2. 스토어 URL 재스크랩 (최신 데이터)
 *   3. 장르 Top + similar 경쟁작 실시간 수집 (최대 5개)
 *   4. 업로드된 이미지 Vision용 URL 수집
 *   5. Opus 4.6 호출 (텍스트 + 이미지)
 *   6. 결과 파싱 → deliverables 저장
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { complete, parseJsonResponse, type ImageRef } from "./client";
import { MODELS } from "./models";
import {
  ASO_SYSTEM_PROMPT,
  buildAsoGenerationPrompt,
  type AsoGenerationInput,
} from "./prompts/aso-generation";
import { getBenchmarkByGenre } from "./benchmarks/genre-data";
import {
  scrapeGooglePlay,
  extractAppIdFromUrl,
} from "@/lib/scraper/google-play";
import { fetchCompetitors } from "@/lib/scraper/competitor-fetch";
import { fetchOrderVisualContext } from "./vision-context";

/**
 * AI 생성 결과 (v2 스키마와 일치).
 */
export type AsoResult = {
  game_analysis: {
    unique_value_proposition: string;
    specific_strengths: string[];
    target_persona: { who: string; when: string; why: string };
    first_impression_goal: string;
  };
  competitive_insight: {
    market_landscape: string;
    competitors_analyzed: Array<{
      name: string;
      positioning: string;
      owned_keywords: string[];
      visual_language: string;
      gap_they_leave: string;

      // 신규 축 (2026-04-13 확장) — "왜 Top인가"의 근거 체계
      why_they_top?: string; // 설치수·평점 + 정성 판단 종합
      core_hook?: string; // 메인 유인 요소 (성취/과시/수집/힐링 등)
      emotional_appeal?: string; // 유저가 느끼는 감정 / 건드리는 욕구
      community_signals?: {
        rating_overall: string; // 높/중/낮 + 수치
        praise_themes: string[]; // 리뷰에서 자주 나오는 칭찬 주제
        complaint_themes: string[]; // 자주 나오는 불만
      };
      monetization_model?: string; // IAP · 광고 · 프리미엄 · 구독 등, ASO 메시징 영향
      retention_promise?: string; // 계속 플레이하게 만드는 신호 (레벨·시즌·컬렉션)
      icon_design_strategy?: string; // 아이콘 첫인상 전략
      screenshot_sequence_flow?: string; // 7장 슬롯 스토리텔링 요약
      description_hook?: string; // 첫 80/250자 hook 기법
      direct_confrontation_risk?: string; // 이 경쟁작에 정면 승부하면 지는 이유
    }>;
    white_space: string[];
  };
  positioning_strategy: {
    thesis: string;
    rationale: string;
    contrarian_insights: string[];
  };
  title_candidates: Array<{
    title: string;
    strategy: string;
    competitor_reference: string;
    expected_effect: string;
    risks: string;
    recommended?: boolean;
  }>;
  subtitle_candidates: Array<{
    subtitle: string;
    strategy: string;
    competitor_reference: string;
    recommended?: boolean;
  }>;
  description: {
    // Legacy 일반 필드 (유지) — 스토어 중립 서술
    first_252_chars: string;
    hook_strategy: string;
    full_description: string;
    structure_rationale: string;
    embedded_keywords: string[];
  };

  // 스토어별 최적화 필드 (2026-04-13 신규, optional — 타겟 스토어에 해당하는 것만 채움)
  store_specific?: {
    google_play?: {
      short_description_80: string; // 정확히 80자 이내
      full_description_first_250: string; // 첫 250자 노출 버전
      full_description: string; // 4000자 이내 전체
      hook_strategy: string;
    };
    apple_app_store?: {
      subtitle_30: string; // 30자 이내
      promotional_text_170: string; // 170자 이내
      description: string; // 4000자 이내
      keywords_field_100: string; // 100자 이내 콤마 구분 비공개 메타
      hook_strategy: string;
    };
  };
  keywords: Array<{
    keyword: string;
    intent_type: "discovery" | "intent" | "brand";
    priority: "must-have" | "should-have" | "nice-to-have";
    competition_level: "low" | "medium" | "high";
    rationale: string;
    placement: string;
  }>;
  screenshot_guide: {
    overall_strategy: string;
    slots: Array<{
      slot: number;
      purpose: string;
      caption_main: string;
      caption_sub?: string;
      caption_rationale: string;
      visual_direction: {
        composition: string;
        dominant_colors: string[];
        typography_hint: string;
        mood: string;
      };
      source_material_suggestion: string;
      differentiation_from_competitor: string;
    }>;
  };
  visual_assessment: {
    uploaded_images_observed: boolean;
    screenshots_assessment: string;
    icon_assessment: string;
    color_direction: string;
    composition_direction: string;
  };
  aso_score: {
    overall: number;
    breakdown: {
      title: number;
      subtitle: number;
      description: number;
      keywords: number;
      visual: number;
    };
    scoring_notes: string;
  };
  priority_actions: Array<{
    priority: number;
    category: string;
    action: string;
    current_state: string;
    proposed_state: string;
    why_this_matters: string;
    expected_outcome: string;
    effort_hours: number;
    risk_level: "low" | "medium" | "high";
  }>;
  executive_summary: {
    tldr: string;
    three_key_insights: string[];
    quick_wins: string[];
    longer_term_moves: string[];
  };
};

export type GenerateResult = {
  deliverable_id: string;
  result: AsoResult;
  usage: {
    input_tokens: number;
    output_tokens: number;
    model: string;
    approx_cost_usd: number;
    competitor_count: number;
    image_count: number;
  };
};

/** Opus 4.6: $15/1M input, $75/1M output (2026-04) */
function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 15 + (outputTokens / 1_000_000) * 75;
}

export async function generateAsoForOrder(
  orderId: string
): Promise<GenerateResult> {
  const admin = createAdminClient();

  // ───────────────────────────────────────────────────────────────
  // 1. 주문 조회
  // ───────────────────────────────────────────────────────────────
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, game_title, game_genre, store_url_android, core_features, target_market, additional_notes"
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`주문을 찾을 수 없습니다: ${orderError?.message}`);
  }

  // ───────────────────────────────────────────────────────────────
  // 2. 타겟 시장 파싱 — 첫 번째 항목을 기준 country 로 사용
  // ───────────────────────────────────────────────────────────────
  const targetMarkets =
    order.target_market
      ?.split(",")
      .filter(Boolean)
      .map((m: string) => m.trim()) ?? [];

  // 'korea' / 'kr' / 'japan' / 'jp' ... 표기 통일
  const MARKET_TO_COUNTRY: Record<string, string> = {
    korea: "kr",
    kr: "kr",
    japan: "jp",
    jp: "jp",
    us: "us",
    usa: "us",
    "united states": "us",
    china: "cn",
    cn: "cn",
    taiwan: "tw",
    tw: "tw",
    global: "us",
    global_en: "us",
  };
  const primaryCountry =
    MARKET_TO_COUNTRY[targetMarkets[0]?.toLowerCase()] ?? "kr";

  // ───────────────────────────────────────────────────────────────
  // 3. 스토어 URL 최신 스크랩 (기준 국가)
  // ───────────────────────────────────────────────────────────────
  let scraped: Awaited<ReturnType<typeof scrapeGooglePlay>> | null = null;
  let selfAppId: string | null = null;
  if (order.store_url_android) {
    selfAppId = extractAppIdFromUrl(order.store_url_android);
    try {
      scraped = await scrapeGooglePlay(order.store_url_android, {
        country: primaryCountry,
        lang: primaryCountry === "kr" ? "ko" : primaryCountry === "jp" ? "ja" : "en",
        includeReviews: true,
      });
    } catch (e) {
      console.warn(
        "[aso-analyzer] 본 게임 재스크랩 실패:",
        e instanceof Error ? e.message : e
      );
    }
  }

  // ───────────────────────────────────────────────────────────────
  // 4. 경쟁작 실시간 수집 (기준 국가 Top)
  // ───────────────────────────────────────────────────────────────
  const genre = order.game_genre ?? "other";
  const competitors = await fetchCompetitors({
    genre,
    selfAppId,
    country: primaryCountry,
    limit: 5,
    includeReviews: true,
  });

  console.log(`[aso-analyzer] 경쟁작 ${competitors.length}개 수집 완료`);

  // ───────────────────────────────────────────────────────────────
  // 4. 업로드 이미지 Vision용 URL 수집 (최대 8장)
  // ───────────────────────────────────────────────────────────────
  const visualContext = await fetchOrderVisualContext(orderId, 8);
  const images: ImageRef[] = visualContext.map((v, i) => ({
    url: v.signed_url,
    label:
      v.category === "logo"
        ? "업로드된 게임 아이콘/로고"
        : `업로드된 스크린샷 ${i + 1}`,
  }));

  console.log(`[aso-analyzer] Vision 이미지 ${images.length}장 첨부`);

  // ───────────────────────────────────────────────────────────────
  // 6. 프롬프트 구성
  // ───────────────────────────────────────────────────────────────
  const benchmark = getBenchmarkByGenre(genre);

  const input: AsoGenerationInput = {
    game_title: order.game_title,
    game_genre: genre,
    target_markets: targetMarkets,
    core_features: order.core_features ?? "",
    additional_notes: order.additional_notes,
    store_url: order.store_url_android,
    scraped_title: scraped?.title,
    scraped_description: scraped?.description,
    scraped_developer: scraped?.developer,
    scraped_genre: scraped?.genre,
    scraped_rating: scraped?.rating,
    scraped_installs: scraped?.installs,
    scraped_reviews: scraped?.reviews,
    scraped_monetization: scraped?.monetization,
    benchmark,
    competitors,
  };

  const userMessage = buildAsoGenerationPrompt(input);

  // ───────────────────────────────────────────────────────────────
  // 6. Opus 4.6 호출 (Vision 포함)
  // ───────────────────────────────────────────────────────────────
  const completion = await complete({
    model: MODELS.OPUS,
    system: ASO_SYSTEM_PROMPT,
    userMessage,
    images,
    maxTokens: 32000, // Opus 4.6 상한 근접 — 품질 우선이라 충분히 허용
    temperature: 0.6, // 품질 일관성을 위해 약간 낮춤
  });

  // ───────────────────────────────────────────────────────────────
  // 7. JSON 파싱
  // ───────────────────────────────────────────────────────────────
  let result: AsoResult;
  try {
    result = parseJsonResponse<AsoResult>(completion.text);
  } catch (e) {
    console.error(
      "[aso-analyzer] JSON 파싱 실패, 응답 앞 500자:",
      completion.text.slice(0, 500)
    );
    throw new Error(
      `AI 응답 파싱 실패: ${e instanceof Error ? e.message : "unknown"}`
    );
  }

  // ───────────────────────────────────────────────────────────────
  // 8. deliverables 저장
  // ───────────────────────────────────────────────────────────────
  const { data: deliverable, error: deliverableError } = await admin
    .from("deliverables")
    .insert({
      order_id: orderId,
      type: "aso_analysis_report",
      content: result as unknown as Record<string, unknown>,
      status: "draft",
    })
    .select("id")
    .single();

  if (deliverableError || !deliverable) {
    throw new Error(`결과 저장 실패: ${deliverableError?.message}`);
  }

  return {
    deliverable_id: deliverable.id,
    result,
    usage: {
      input_tokens: completion.input_tokens,
      output_tokens: completion.output_tokens,
      model: MODELS.OPUS,
      approx_cost_usd: estimateCostUsd(
        completion.input_tokens,
        completion.output_tokens
      ),
      competitor_count: competitors.length,
      image_count: images.length,
    },
  };
}
