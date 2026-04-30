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
import { logger } from "@/lib/logger";
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
import { scrapeAppleAppStore } from "@/lib/scraper/apple-app-store";
import { fetchCompetitors } from "@/lib/scraper/competitor-fetch";
import { fetchOrderVisualContext } from "./vision-context";
import { queryLibrary } from "@/lib/reference-library/pattern-query";
import { validateAsoOutput, type ValidationResult } from "./validate-aso-output";

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

      // ASO 수법 축 (v2.6 원칙: 리뷰·평점 제거, 스토어 에셋 관점만)
      aso_success_approach?: string; // 이 경쟁작이 ASO 를 어떻게 했길래 잘 작동했는지
      core_hook?: string; // ASO 자산이 전달하는 메인 유인 요소
      emotional_appeal?: string; // 스토어 자산이 유발하는 감정 + 유발 요소
      monetization_alignment?: string; // 수익모델이 ASO 메시징에 반영되는 방식
      retention_promise?: string; // ASO 자산에서 암시된 장기 플레이 유인
      icon_design_strategy?: string; // 아이콘 첫인상 전략
      screenshot_sequence_flow?: string; // 7장 슬롯 스토리텔링 요약
      description_hook?: string; // 첫 80/250자 hook 기법
      direct_confrontation_risk?: string; // ASO 메시징 정면 승부 시 지는 이유
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
  /** Opus 출력 하드 룰 검증 결과. 관리자 UI 에 노출하고 운영자가 수동 편집 판단. */
  validation: ValidationResult;
  usage: {
    input_tokens: number;
    output_tokens: number;
    model: string;
    approx_cost_usd: number;
    competitor_count: number;
    image_count: number;
  };
};

/** 모델별 단가 ($/1M tokens, 2026-04 기준) */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
};

function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const p = MODEL_PRICING[model] ?? MODEL_PRICING["claude-opus-4-6"];
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}

export async function generateAsoForOrder(
  orderId: string,
  options: { model?: "opus" | "sonnet" } = {}
): Promise<GenerateResult> {
  const modelId =
    options.model === "sonnet" ? MODELS.SONNET : MODELS.OPUS;
  const admin = createAdminClient();
  const log = logger.child({ stage: "aso", orderId, model: modelId });
  log.info("stage8.start");

  // ───────────────────────────────────────────────────────────────
  // 1. 주문 조회
  // ───────────────────────────────────────────────────────────────
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, game_title, game_genre, store_url_android, store_url_apple, core_features, target_market, additional_notes"
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
  // 3. 양 스토어 URL 최신 스크랩 (기준 국가, 병렬)
  // ───────────────────────────────────────────────────────────────
  let selfAppId: string | null = null;
  if (order.store_url_android) {
    selfAppId = extractAppIdFromUrl(order.store_url_android);
  }

  const [scraped, scrapedApple] = await Promise.all([
    order.store_url_android
      ? scrapeGooglePlay(order.store_url_android, {
          country: primaryCountry,
          lang: primaryCountry === "kr" ? "ko" : primaryCountry === "jp" ? "ja" : "en",
        }).catch((e) => {
          console.warn(
            "[aso-analyzer] Google Play 재스크랩 실패:",
            e instanceof Error ? e.message : e
          );
          return null;
        })
      : Promise.resolve(null),
    order.store_url_apple
      ? scrapeAppleAppStore(order.store_url_apple, {
          country: primaryCountry,
        }).catch((e) => {
          console.warn(
            "[aso-analyzer] Apple App Store 재스크랩 실패:",
            e instanceof Error ? e.message : e
          );
          return null;
        })
      : Promise.resolve(null),
  ]);

  // ───────────────────────────────────────────────────────────────
  // 4. Library 조회 (주축 + 유사 게임) + 경쟁작 실시간 수집 병렬
  // ───────────────────────────────────────────────────────────────
  const genre = order.game_genre ?? "other";

  // Library 조회를 먼저 실행해 경쟁작 수 결정 (있으면 5→3 축소로 중복 완화)
  const libraryResult = await queryLibrary({
    genre,
    market: primaryCountry,
  });

  console.log(
    `[aso-analyzer] Library fallback_level=${libraryResult.fallback_level}` +
      (libraryResult.primary_pattern
        ? ` / axis=${libraryResult.primary_pattern.axis_key_used} / confidence=${libraryResult.primary_pattern.confidence} / n=${libraryResult.primary_pattern.sample_size}`
        : " / primary=none") +
      ` / similar_games=${libraryResult.similar_games.length}`
  );

  if (libraryResult.fallback_level === "none") {
    // 해당 장르의 library_patterns 가 전무한 극단 상태. Library 구축 전 또는 L3 미실행.
    // 정상 운영에서는 발생하지 않아야 함.
    console.warn(
      `[aso-analyzer] ⚠ Library fallback_level=none — 장르 "${genre}" 에 library_patterns 0건. ` +
        `L1~L3 파이프라인 실행으로 library_patterns 채우기 필요.`
    );
  }

  const competitorLimit = libraryResult.primary_pattern ? 3 : 5;
  const competitors = await fetchCompetitors({
    genre,
    selfAppId,
    country: primaryCountry,
    limit: competitorLimit,
  });

  console.log(
    `[aso-analyzer] 경쟁작 ${competitors.length}개 수집 완료 (limit=${competitorLimit})`
  );

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
    scraped_installs: scraped?.installs,
    scraped_monetization: scraped?.monetization,
    // Apple 스크랩 데이터 — Apple 결과물 필드 품질에 중요
    apple_scraped: scrapedApple
      ? {
          title: scrapedApple.title,
          description: scrapedApple.description,
          developer: scrapedApple.developer,
          genre: scrapedApple.genre,
          version: scrapedApple.version,
          iphone_screenshot_count: scrapedApple.iphone_screenshot_urls.length,
        }
      : undefined,
    benchmark,
    competitors,
    library: libraryResult,
  };

  const userMessage = buildAsoGenerationPrompt(input);

  // ───────────────────────────────────────────────────────────────
  // 6. LLM 호출 (Vision 포함). 기본 Opus, 옵션으로 Sonnet 가능
  // ───────────────────────────────────────────────────────────────
  const completion = await complete({
    model: modelId,
    system: ASO_SYSTEM_PROMPT,
    userMessage,
    images,
    maxTokens: 32000,
    temperature: 0.6,
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
  // 7.5. Opus 출력 하드 룰 검증 (Q1)
  // 스토어 필드 길이·키워드·스크린샷 슬롯 등 검증. 실패해도 저장·반환은 진행 —
  // 관리자 UI 가 violations 를 표시해 운영자가 수동 편집 판단.
  // ───────────────────────────────────────────────────────────────
  const validation = validateAsoOutput(result);
  if (validation.error_count > 0) {
    console.warn(
      `[aso-analyzer] ⚠ 하드 룰 error ${validation.error_count}건, warning ${validation.warning_count}건, info ${validation.info_count}건`
    );
    for (const v of validation.violations.filter((x) => x.severity === "error")) {
      console.warn(`  [error] ${v.field}: ${v.message}`);
    }
  } else if (validation.warning_count > 0) {
    console.log(
      `[aso-analyzer] 하드 룰 warning ${validation.warning_count}건, info ${validation.info_count}건`
    );
  } else {
    console.log(`[aso-analyzer] 하드 룰 검증 clean`);
  }

  // ───────────────────────────────────────────────────────────────
  // 8. deliverables 저장 (validation 메타 포함)
  // ───────────────────────────────────────────────────────────────
  const { data: deliverable, error: deliverableError } = await admin
    .from("deliverables")
    .insert({
      order_id: orderId,
      type: "aso_analysis_report",
      content: {
        ...result,
        _meta: {
          validation, // UI 에서 필드별 violations 렌더
          library_state: {
            fallback_level: libraryResult.fallback_level,
            primary_axis_key: libraryResult.primary_pattern?.axis_key_used ?? null,
            similar_games_count: libraryResult.similar_games.length,
          },
        },
      } as unknown as Record<string, unknown>,
      status: "draft",
    })
    .select("id")
    .single();

  if (deliverableError || !deliverable) {
    log.error({ err: deliverableError?.message }, "stage8.persist_failed");
    throw new Error(`결과 저장 실패: ${deliverableError?.message}`);
  }

  const usage = {
    input_tokens: completion.input_tokens,
    output_tokens: completion.output_tokens,
    model: modelId,
    approx_cost_usd: estimateCostUsd(
      modelId,
      completion.input_tokens,
      completion.output_tokens
    ),
    competitor_count: competitors.length,
    image_count: images.length,
  };
  log.info(
    {
      deliverableId: deliverable.id,
      ...usage,
      validation_errors: validation.error_count,
      validation_warnings: validation.warning_count,
    },
    "stage8.done"
  );
  return {
    deliverable_id: deliverable.id,
    result,
    validation,
    usage,
  };
}
