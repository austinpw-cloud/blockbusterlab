/**
 * 오버레이 디자인 AI 호출 — 게임 스크린샷 원본 위에 얹을 오버레이 레이어만 생성.
 *
 * 입력:
 *   - analysis (ASO 분석 결과의 screenshot_guide 가 슬롯 청사진)
 *   - slots: Judge 단계에서 결정된 "이 슬롯에 쓸 소스 이미지" 매핑
 *   - reference_screenshot_summaries: Library 분석 요약 (장르 품질 기준)
 *
 * 출력:
 *   - reference_analysis + slots[{slot, source_file_id, needs_overlay, overlay?, design_notes}]
 */

import "server-only";
import { complete, parseJsonResponse, type ImageRef } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import {
  OVERLAY_DESIGN_SYSTEM_PROMPT,
  buildOverlayDesignPrompt,
  type OverlayDesignInput,
} from "./overlay-design-prompt";

/** Opus 4.6: $15/1M input, $75/1M output */
function estimateOpusCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 15 + (outputTokens / 1_000_000) * 75;
}

export type OverlaySlotResult = {
  slot: number;
  source_file_id: string;
  purpose: string;
  needs_overlay: boolean;
  overlay?: {
    position_hint?: string;
    html: string;
    css: string;
  };
  design_notes: string;
};

export type OverlayDesignResult = {
  reference_analysis: {
    selected_references: Array<{
      competitor_name: string;
      why_matched: string;
      quality_elements_extracted: string[];
    }>;
    quality_bar_summary: string;
  };
  slots: OverlaySlotResult[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
};

export async function designOverlays(
  input: OverlayDesignInput & {
    /** Library에서 Vision 입력으로 함께 줄 레퍼런스 이미지 (선택) */
    referenceImages?: Array<{ url: string; label: string }>;
  }
): Promise<OverlayDesignResult> {
  // Vision 입력: 레퍼런스 이미지 → 게임 이미지 순서 (게임 이미지 라벨에 슬롯 인덱스 포함)
  const refImages: ImageRef[] = (input.referenceImages ?? [])
    .slice(0, 6)
    .map((r) => ({ url: r.url, label: r.label }));

  // 게임 이미지는 슬롯 순서대로 GAME-SLOT-N 라벨로
  const gameImages: ImageRef[] = input.slots.map((s, idx) => ({
    url: s.source.signed_url,
    label: `GAME-SLOT-${idx + 1} slot=${s.slot} file_id=${s.source.file_id}`,
  }));

  const images: ImageRef[] = [...refImages, ...gameImages];

  const userMessage = buildOverlayDesignPrompt(input);

  const completion = await complete({
    model: MODELS.OPUS,
    system: OVERLAY_DESIGN_SYSTEM_PROMPT,
    userMessage,
    images,
    maxTokens: 24000,
    temperature: 0.7,
  });

  let parsed: Omit<OverlayDesignResult, "usage">;
  try {
    parsed = parseJsonResponse<Omit<OverlayDesignResult, "usage">>(
      completion.text
    );
  } catch (e) {
    console.error(
      "[overlay-design] JSON 파싱 실패. 응답 앞 800자:",
      completion.text.slice(0, 800)
    );
    throw new Error(
      `오버레이 디자인 응답 파싱 실패: ${e instanceof Error ? e.message : "unknown"}`
    );
  }

  if (!Array.isArray(parsed.slots) || parsed.slots.length === 0) {
    throw new Error("오버레이 디자인 슬롯 결과가 비어 있습니다.");
  }

  // source_file_id 환각 방어: 입력에서 매핑된 file_id 만 허용
  const validIds = new Set(input.slots.map((s) => s.source.file_id));
  for (const slotRes of parsed.slots) {
    if (!validIds.has(slotRes.source_file_id)) {
      // 같은 slot 번호의 원본 file_id로 보정
      const fallback = input.slots.find((s) => s.slot === slotRes.slot);
      if (fallback) {
        slotRes.source_file_id = fallback.source.file_id;
      }
    }
    // needs_overlay=false면 overlay 무시
    if (!slotRes.needs_overlay) {
      slotRes.overlay = undefined;
    }
  }

  const cost = estimateOpusCost(
    completion.input_tokens,
    completion.output_tokens
  );

  return {
    reference_analysis: parsed.reference_analysis,
    slots: parsed.slots,
    usage: {
      input_tokens: completion.input_tokens,
      output_tokens: completion.output_tokens,
      cost_usd: cost,
    },
  };
}
