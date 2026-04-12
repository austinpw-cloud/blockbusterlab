/**
 * 업로드된 게임 자료 평가 — Stage 9 분기 진입점.
 *
 * 1차 업로드 자료를 보고 "이대로 고품질 ASO 스크린샷 제작 가능?"을 판정.
 * Library 샘플과 비교해 객관적 기준 제공.
 *
 * 결과물은:
 *   - sufficient/partial → overlay-design 경로로 진행
 *   - insufficient → upload-guide 생성 후 개발자에게 보완 요청
 */

import "server-only";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { complete, parseJsonResponse, type ImageRef } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import {
  JUDGE_SYSTEM_PROMPT,
  buildJudgePrompt,
  type UploadedFileInput,
} from "./judge-materials-prompt";
import type { AsoResult } from "@/lib/ai/aso-analyzer";
import type {
  ReferenceScreenshotSummary,
} from "./library-coverage";

/**
 * 업로드 이미지의 종횡비를 측정해 스토어 표준(세로 스크린샷, 9:16 ~ 9:20) 적합성 판정.
 *
 * 스토어 Top 게임은 업로드 시점에 이미 이 비율로 캡처해서 올림.
 * 우리 업로드가 비율을 크게 벗어나면 composite 단에서 원본을 건드리게 되므로
 * judge 단에서 사전 차단하고 upload_guide 로 재업로드 요청.
 */
export type AspectRatioVerdict = "ok" | "warn" | "fail";

export type AspectRatioCheck = {
  file_id: string;
  width: number | null;
  height: number | null;
  ratio: number | null;
  verdict: AspectRatioVerdict;
  reason?: string;
};

async function measureAspectRatio(
  fileId: string,
  signedUrl: string
): Promise<AspectRatioCheck> {
  try {
    const res = await fetch(signedUrl);
    if (!res.ok) {
      return {
        file_id: fileId,
        width: null,
        height: null,
        ratio: null,
        verdict: "warn",
        reason: `이미지 다운로드 실패 (HTTP ${res.status})`,
      };
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buffer).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) {
      return {
        file_id: fileId,
        width: w || null,
        height: h || null,
        ratio: null,
        verdict: "warn",
        reason: "해상도 메타데이터를 읽을 수 없음",
      };
    }
    const ratio = h / w;

    // 세로 스토어 스크린샷 기준: 9:16 (1.78) ~ 9:20 (2.22). 허용 범위 ±조금.
    let verdict: AspectRatioVerdict;
    let reason: string | undefined;

    if (ratio < 1.0) {
      verdict = "fail";
      reason = `가로 이미지 (${w}×${h}). 세로 스토어 스크린샷 1080×1920 또는 1080×2400 비율로 재캡처 필요`;
    } else if (ratio < 1.5) {
      verdict = "fail";
      reason = `비율 ${ratio.toFixed(2)}:1 (${w}×${h}) — 세로지만 너무 짧음. 9:16 (1.78) 또는 9:20 (2.22) 권장`;
    } else if (ratio < 1.6) {
      verdict = "warn";
      reason = `비율 ${ratio.toFixed(2)}:1 (${w}×${h}) — 9:16에 약간 못 미침`;
    } else if (ratio <= 2.3) {
      verdict = "ok";
    } else if (ratio <= 2.6) {
      verdict = "warn";
      reason = `비율 ${ratio.toFixed(2)}:1 (${w}×${h}) — 9:20보다 길어 미세 상·하 크롭 가능`;
    } else {
      verdict = "fail";
      reason = `비율 ${ratio.toFixed(2)}:1 (${w}×${h}) — 너무 긴 세로. 다시 캡처 권장`;
    }

    return {
      file_id: fileId,
      width: w,
      height: h,
      ratio,
      verdict,
      reason,
    };
  } catch (e) {
    return {
      file_id: fileId,
      width: null,
      height: null,
      ratio: null,
      verdict: "warn",
      reason: `측정 실패: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

/** Opus 4.6: $15/1M input, $75/1M output */
function estimateOpusCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 15 + (outputTokens / 1_000_000) * 75;
}

export type JudgeKeepEntry = {
  file_id: string;
  assigned_slot: number | null;
  strengths: string[];
  why_keep: string;
};

export type JudgeSlotCoverage = {
  slot: number;
  purpose: string;
  has_suitable_source: boolean;
  best_candidate_file_id: string | null;
  issue?: string;
};

export type JudgeMissingMaterial = {
  type: string;
  spec: string;
  why_needed: string;
  replaces_file_id: string | null;
  reference_example?: string;
};

export type JudgeResult = {
  verdict: "sufficient" | "partial" | "insufficient";
  overall_notes: string;
  strengths: string[];
  keep: JudgeKeepEntry[];
  per_slot_coverage: JudgeSlotCoverage[];
  missing_materials: JudgeMissingMaterial[];
  aspect_ratio_checks: AspectRatioCheck[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    uploads_count: number;
    references_count: number;
  };
};

/**
 * Reference 스크린샷 분석(JSON)을 Judge 프롬프트용 한 줄 요약으로 압축.
 * 모든 분석 JSON을 그대로 넣으면 토큰 폭주 — 핵심만 추출.
 */
function summarizeReferenceAnalysis(
  analysis: Record<string, unknown> | null
): string {
  if (!analysis) return "";

  // 여러 스키마 버전 대응
  const layout =
    (analysis.layout_pattern as string) ||
    (analysis.layout_archetype as string) ||
    "";
  const purpose =
    (analysis.purpose_signal as string) ||
    (analysis.slot_role as string) ||
    "";
  const visualHierarchy = analysis.visual_hierarchy as string;
  const whatWorks = analysis.what_makes_it_work as string;

  const parts: string[] = [];
  if (purpose) parts.push(`역할=${purpose}`);
  if (layout) parts.push(`레이아웃=${layout}`);
  if (visualHierarchy) parts.push(`hierarchy=${truncate(visualHierarchy, 80)}`);
  if (whatWorks) parts.push(`강점=${truncate(whatWorks, 120)}`);

  return parts.join(" | ") || "분석 요약 없음";
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/**
 * 업로드된 order_files (screenshot category) 로드 + signed URL 발급.
 */
async function loadUploadedScreenshots(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string
): Promise<
  Array<
    UploadedFileInput & {
      signed_url: string;
    }
  >
> {
  const { data: files, error } = await admin
    .from("order_files")
    .select("id, storage_path, file_name, mime_type, display_order, uploaded_at")
    .eq("order_id", orderId)
    .eq("category", "screenshot")
    .order("display_order", { ascending: true })
    .order("uploaded_at", { ascending: true });

  if (error) {
    throw new Error(`order_files 조회 실패: ${error.message}`);
  }

  const rows = files ?? [];
  const urls = await Promise.all(
    rows.map(async (f) => {
      const { data } = await admin.storage
        .from("order-materials")
        .createSignedUrl(f.storage_path, 3600);
      return data?.signedUrl ?? null;
    })
  );

  return rows
    .map((f, i) => {
      const url = urls[i];
      if (!url) return null;
      return {
        file_id: f.id,
        file_path: f.storage_path,
        file_name: f.file_name,
        display_order: f.display_order ?? 0,
        mime_type: f.mime_type ?? undefined,
        signed_url: url,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

/**
 * 메인 진입점.
 */
export async function judgeUploadedMaterials(opts: {
  orderId: string;
  game_title: string;
  game_genre: string;
  analysis: AsoResult;
  referenceScreenshots: ReferenceScreenshotSummary[];
  referenceSignedUrls?: Array<{ url: string; label: string }>; // 없으면 분석 요약만으로 평가
}): Promise<JudgeResult> {
  const admin = createAdminClient();

  // 1. 업로드 자료 로드 + signed URL
  const uploaded = await loadUploadedScreenshots(admin, opts.orderId);
  if (uploaded.length === 0) {
    // 업로드 없으면 바로 insufficient로 단축 평가
    return {
      verdict: "insufficient",
      overall_notes:
        "업로드된 게임 스크린샷이 없습니다. 먼저 게임 화면 캡처를 업로드해 주세요.",
      strengths: [],
      keep: [],
      per_slot_coverage: opts.analysis.screenshot_guide.slots.map((s) => ({
        slot: s.slot,
        purpose: s.purpose,
        has_suitable_source: false,
        best_candidate_file_id: null,
        issue: "업로드 자료 없음",
      })),
      missing_materials: [
        {
          type: "all_screenshots",
          spec: "게임 내 핵심 장면 7~10장 (각 슬롯 의도에 맞게)",
          why_needed: "평가·제작의 기초 자료가 필요합니다.",
          replaces_file_id: null,
        },
      ],
      aspect_ratio_checks: [],
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        uploads_count: 0,
        references_count: opts.referenceScreenshots.length,
      },
    };
  }

  // 1-A. 종횡비 사전 검증 (composite 단의 원본 보존을 위해 judge 에서 걸러냄)
  const aspectChecks = await Promise.all(
    uploaded.map((u) => measureAspectRatio(u.file_id, u.signed_url))
  );
  const failedChecks = aspectChecks.filter((c) => c.verdict === "fail");
  const warnChecks = aspectChecks.filter((c) => c.verdict === "warn");

  // 2. 레퍼런스 요약 (텍스트) 조립
  const refSummaries = opts.referenceScreenshots
    .slice(0, 20) // 너무 많으면 토큰 폭주
    .map((r) => ({
      game_title: r.game_title,
      slot_number: r.slot_number,
      analysis_summary: summarizeReferenceAnalysis(r.analysis),
    }));

  // 3. Vision 입력 구성 (업로드 이미지 + 선택적으로 레퍼런스 이미지 일부)
  const uploadImages: ImageRef[] = uploaded.map((u, i) => ({
    url: u.signed_url,
    label: `UPLOAD-${i + 1} (file_id=${u.file_id})`,
  }));

  const refImages: ImageRef[] = (opts.referenceSignedUrls ?? [])
    .slice(0, 6)
    .map((r) => ({ url: r.url, label: r.label }));

  const images: ImageRef[] = [...refImages, ...uploadImages];

  // 4. Opus 호출 (비율 측정 결과도 입력으로 전달)
  const userMessage = buildJudgePrompt({
    game_title: opts.game_title,
    game_genre: opts.game_genre,
    analysis: opts.analysis,
    uploaded_files: uploaded.map((u) => {
      const check = aspectChecks.find((c) => c.file_id === u.file_id);
      return {
        file_id: u.file_id,
        file_path: u.file_path,
        file_name: u.file_name,
        display_order: u.display_order,
        mime_type: u.mime_type,
        aspect_ratio: check?.ratio ?? null,
        dimensions:
          check?.width && check?.height
            ? `${check.width}×${check.height}`
            : null,
        aspect_verdict: check?.verdict ?? "warn",
        aspect_reason: check?.reason,
      };
    }),
    reference_screenshot_summaries: refSummaries,
  });

  const completion = await complete({
    model: MODELS.OPUS,
    system: JUDGE_SYSTEM_PROMPT,
    userMessage,
    images,
    maxTokens: 8000,
    temperature: 0.4,
  });

  // 5. 파싱 + 기본 검증
  let parsed: Omit<JudgeResult, "usage">;
  try {
    parsed = parseJsonResponse<Omit<JudgeResult, "usage">>(completion.text);
  } catch (e) {
    console.error(
      "[judge-materials] JSON 파싱 실패, 응답 앞 800자:",
      completion.text.slice(0, 800)
    );
    throw new Error(
      `판정 응답 파싱 실패: ${e instanceof Error ? e.message : "unknown"}`
    );
  }

  if (!parsed.verdict || !Array.isArray(parsed.per_slot_coverage)) {
    throw new Error("판정 응답 형식이 잘못되었습니다.");
  }

  // === AI 환각·정합성 방어 ===
  const validIds = new Set(uploaded.map((u) => u.file_id));
  const validSlots = new Set(
    opts.analysis.screenshot_guide.slots.map((s) => s.slot)
  );

  // 1) keep.file_id 유효성
  parsed.keep = (parsed.keep ?? []).filter((k) => validIds.has(k.file_id));

  // 2) keep.assigned_slot 범위 검증
  for (const k of parsed.keep) {
    if (k.assigned_slot != null && !validSlots.has(k.assigned_slot)) {
      console.warn(
        `[judge-materials] keep.assigned_slot=${k.assigned_slot} 가 유효 슬롯이 아님 → null 로 보정`
      );
      k.assigned_slot = null;
    }
  }

  // 3) per_slot_coverage 가 모든 슬롯을 포함하도록 보정
  const coverageBySlot = new Map(
    (parsed.per_slot_coverage ?? []).map((c) => [c.slot, c])
  );
  const slotDefs = opts.analysis.screenshot_guide.slots;
  const completeCoverage = slotDefs.map((def) => {
    const existing = coverageBySlot.get(def.slot);
    if (existing) {
      // best_candidate_file_id 유효성
      if (
        existing.best_candidate_file_id &&
        !validIds.has(existing.best_candidate_file_id)
      ) {
        console.warn(
          `[judge-materials] per_slot_coverage[${def.slot}].best_candidate_file_id 환각 → null 보정`
        );
        existing.best_candidate_file_id = null;
      }
      return existing;
    }
    // 누락된 슬롯은 보수적으로 has_suitable_source=false 로 채움
    console.warn(
      `[judge-materials] per_slot_coverage 에 slot ${def.slot} 누락 → 보정`
    );
    return {
      slot: def.slot,
      purpose: def.purpose,
      has_suitable_source: false,
      best_candidate_file_id: null,
      issue: "per_slot_coverage 누락 (보정)",
    } satisfies JudgeSlotCoverage;
  });
  parsed.per_slot_coverage = completeCoverage;

  // 4) missing_materials.replaces_file_id 유효성
  parsed.missing_materials = (parsed.missing_materials ?? []).map((m) => {
    if (m.replaces_file_id && !validIds.has(m.replaces_file_id)) {
      console.warn(
        `[judge-materials] missing.replaces_file_id 환각 → null 보정`
      );
      return { ...m, replaces_file_id: null };
    }
    return m;
  });

  // aspect_ratio fail 파일은 keep 에서 강제 제외 (원본 보존 위해 composite 진입 금지)
  const failedIds = new Set(failedChecks.map((c) => c.file_id));
  const keepBeforeAspect = parsed.keep.length;
  parsed.keep = parsed.keep.filter((k) => !failedIds.has(k.file_id));
  const removedDueToAspect = keepBeforeAspect - parsed.keep.length;

  // aspect fail 이 있으면 해당 파일을 missing_materials 에 "비율 재촬영 요청" 으로 추가
  if (failedChecks.length > 0) {
    for (const c of failedChecks) {
      const uploaded_file = uploaded.find((u) => u.file_id === c.file_id);
      parsed.missing_materials = parsed.missing_materials ?? [];
      parsed.missing_materials.push({
        type: "aspect_ratio_mismatch",
        spec: "1080×1920 (9:16) 또는 1080×2400 (9:20) 세로 해상도로 재캡처. 게임 내 모바일 세로 뷰 기준.",
        why_needed: `${uploaded_file?.file_name ?? c.file_id}: ${c.reason ?? "비율이 스토어 세로 스크린샷 기준에서 크게 벗어남"}`,
        replaces_file_id: c.file_id,
      });
    }

    // 모든 업로드가 fail 이거나 과반이면 verdict 강제로 insufficient
    if (
      failedChecks.length === uploaded.length ||
      failedChecks.length / uploaded.length >= 0.5
    ) {
      parsed.verdict = "insufficient";
      parsed.overall_notes =
        `업로드된 자료 중 ${failedChecks.length}/${uploaded.length}장이 스토어 세로 스크린샷 비율을 벗어납니다. ` +
        `1080×1920 또는 1080×2400 비율로 재캡처 후 다시 업로드해 주세요.\n\n` +
        (parsed.overall_notes ?? "");
    } else if (parsed.verdict === "sufficient") {
      // 일부만 fail 이면 최소 partial 로 하향
      parsed.verdict = "partial";
    }
  } else if (warnChecks.length > 0 && parsed.verdict === "sufficient") {
    // warn 만 있으면 sufficient 유지 — composite 단계에서 소량 크롭 허용
  }

  if (removedDueToAspect > 0) {
    console.log(
      `[judge-materials] aspect_ratio fail 로 keep 에서 ${removedDueToAspect}장 제외`
    );
  }

  const cost = estimateOpusCost(
    completion.input_tokens,
    completion.output_tokens
  );

  return {
    ...parsed,
    aspect_ratio_checks: aspectChecks,
    usage: {
      input_tokens: completion.input_tokens,
      output_tokens: completion.output_tokens,
      cost_usd: cost,
      uploads_count: uploaded.length,
      references_count: refSummaries.length,
    },
  };
}
