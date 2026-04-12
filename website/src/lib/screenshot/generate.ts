/**
 * Stage 9 오케스트레이션 — 평가 → 분기 → (가이드 | 제작) 파이프라인.
 *
 * 실행 순서:
 *   1. 주문 + AsoResult + 업로드 자료 로드
 *   2. library-coverage: Library 판정 + (필요 시) 엄선 보완 + 최신 데이터 반환
 *   3. judge-materials: 업로드 자료 평가 (verdict + keep + missing)
 *   4. 분기
 *      - insufficient → upload-guide 마크다운 생성 → deliverable(upload_materials_guide)
 *      - sufficient | partial → overlay-design → composite 렌더 → Storage 업로드
 *                                → deliverable(aso_screenshots)
 *   5. 이전 최신 deliverable(같은 type) 은 삭제하고 새 것만 남김 (최신 유지 정책).
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AsoResult } from "@/lib/ai/aso-analyzer";
import { getLibraryCoverage } from "./library-coverage";
import {
  judgeUploadedMaterials,
  type JudgeResult,
} from "./judge-materials";
import { buildUploadGuideMarkdown } from "./upload-guide";
import { designOverlays } from "./overlay-design";
import {
  renderCompositeBatch,
  type CompositeSlotInput,
} from "./composite-renderer";
import { closeBrowser } from "./renderer";

export type GenerateOutcome =
  | {
      mode: "upload_guide";
      deliverable_id: string;
      judgment: JudgeResult;
      guide_markdown: string;
      usage: {
        library_judgment_cost_usd: number;
        library_augmentation_cost_usd: number;
        judge_cost_usd: number;
        total_cost_usd: number;
      };
    }
  | {
      mode: "aso_screenshots";
      deliverable_id: string;
      judgment: JudgeResult;
      screenshots: Array<{
        slot: number;
        storage_path: string;
        file_size: number;
        source_file_id: string;
        purpose: string;
        needs_overlay: boolean;
        design_notes: string;
      }>;
      reference_analysis: unknown;
      usage: {
        library_judgment_cost_usd: number;
        library_augmentation_cost_usd: number;
        judge_cost_usd: number;
        overlay_design_cost_usd: number;
        total_cost_usd: number;
      };
    };

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

async function loadOrderAndAnalysis(orderId: string) {
  const admin = createAdminClient();

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, game_title, game_genre, store_url_android, target_market")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    throw new Error(`주문 조회 실패: ${orderErr?.message}`);
  }

  const { data: analysisRow } = await admin
    .from("deliverables")
    .select("content")
    .eq("order_id", orderId)
    .eq("type", "aso_analysis_report")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!analysisRow) {
    throw new Error("먼저 ASO 분석을 실행해야 합니다.");
  }
  const analysis = analysisRow.content as unknown as AsoResult;

  return { admin, order, analysis };
}

/**
 * 재실행 시 이전 Stage 9 결과물을 모두 삭제 (가이드 ↔ 스크린샷 상호 배타적 유지).
 *
 * 원칙: 한 주문은 "업로드 보완 요청 중" 또는 "스크린샷 제작 완료" 둘 중 하나의 최신 상태만 가진다.
 * 가이드 생성 시 기존 스크린샷도 삭제하고, 스크린샷 생성 시 기존 가이드도 삭제한다.
 * 개발자가 재업로드 후 재제작되면 이전 가이드·결과물은 혼동 방지를 위해 제거.
 */
async function purgePreviousStage9Deliverables(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string
) {
  const { data: prior } = await admin
    .from("deliverables")
    .select("id, type, content")
    .eq("order_id", orderId)
    .in("type", ["aso_screenshots", "upload_materials_guide"]);

  if (!prior || prior.length === 0) return;

  // aso_screenshots 는 Storage 파일도 정리
  const paths: string[] = [];
  for (const row of prior) {
    if (row.type === "aso_screenshots") {
      const content = row.content as {
        screenshots?: Array<{ storage_path?: string }>;
      } | null;
      for (const s of content?.screenshots ?? []) {
        if (s.storage_path) paths.push(s.storage_path);
      }
    }
  }
  if (paths.length > 0) {
    await admin.storage.from("deliverables").remove(paths);
  }

  const ids = prior.map((p) => p.id);
  await admin.from("deliverables").delete().in("id", ids);
}

/**
 * 업로드 자료 가이드 분기 처리.
 */
async function runUploadGuideBranch(opts: {
  admin: ReturnType<typeof createAdminClient>;
  orderId: string;
  game_title: string;
  game_genre: string;
  analysis: AsoResult;
  judgment: JudgeResult;
  libraryJudgmentCost: number;
  libraryAugmentationCost: number;
}): Promise<GenerateOutcome> {
  const { admin, orderId, judgment } = opts;

  // 업로드 파일 이름 맵 (가이드 문서 조립용)
  const { data: files } = await admin
    .from("order_files")
    .select("id, file_name, display_order")
    .eq("order_id", orderId)
    .eq("category", "screenshot");

  const filesMap: Record<string, { file_name: string; display_order: number }> =
    {};
  for (const f of files ?? []) {
    filesMap[f.id] = {
      file_name: f.file_name,
      display_order: f.display_order ?? 0,
    };
  }

  const markdown = buildUploadGuideMarkdown({
    game_title: opts.game_title,
    game_genre: opts.game_genre,
    analysis: opts.analysis,
    judgment,
    uploaded_files_map: filesMap,
  });

  // 이전 Stage 9 결과물 정리 (가이드·스크린샷 모두 — 한 주문은 최신 하나만 유지)
  await purgePreviousStage9Deliverables(admin, orderId);

  const { data: record, error } = await admin
    .from("deliverables")
    .insert({
      order_id: orderId,
      type: "upload_materials_guide",
      content: {
        guide_markdown: markdown,
        judgment,
      } as unknown as Record<string, unknown>,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !record) {
    throw new Error(`가이드 deliverable 저장 실패: ${error?.message}`);
  }

  const totalCost =
    opts.libraryJudgmentCost +
    opts.libraryAugmentationCost +
    judgment.usage.cost_usd;

  return {
    mode: "upload_guide",
    deliverable_id: record.id,
    judgment,
    guide_markdown: markdown,
    usage: {
      library_judgment_cost_usd: opts.libraryJudgmentCost,
      library_augmentation_cost_usd: opts.libraryAugmentationCost,
      judge_cost_usd: judgment.usage.cost_usd,
      total_cost_usd: totalCost,
    },
  };
}

/**
 * 스크린샷 제작 분기 처리.
 */
async function runScreenshotProductionBranch(opts: {
  admin: ReturnType<typeof createAdminClient>;
  orderId: string;
  game_title: string;
  game_genre: string;
  analysis: AsoResult;
  judgment: JudgeResult;
  referenceSummaries: Array<{
    game_title: string;
    slot_number: number;
    analysis_summary: string;
  }>;
  referenceImages: Array<{ url: string; label: string }>;
  libraryJudgmentCost: number;
  libraryAugmentationCost: number;
}): Promise<GenerateOutcome> {
  const { admin, orderId, judgment, analysis } = opts;

  // 1. 슬롯별 소스 이미지 매핑 결정
  //    우선순위: Judge가 per_slot_coverage에서 지정한 best_candidate_file_id,
  //            없으면 keep에서 assigned_slot 매칭, 없으면 순환 fallback.
  const { data: files } = await admin
    .from("order_files")
    .select("id, storage_path, file_name, display_order, uploaded_at")
    .eq("order_id", orderId)
    .eq("category", "screenshot")
    .order("display_order", { ascending: true })
    .order("uploaded_at", { ascending: true });

  if (!files || files.length === 0) {
    throw new Error("업로드된 스크린샷이 없습니다. (판정 결과와 불일치)");
  }

  const fileById = new Map(files.map((f) => [f.id, f]));

  // signed URL 발급
  const signedUrls = await Promise.all(
    files.map(async (f) => {
      const { data } = await admin.storage
        .from("order-materials")
        .createSignedUrl(f.storage_path, 3600);
      return { id: f.id, url: data?.signedUrl ?? null };
    })
  );
  const urlById = new Map(
    signedUrls.map((s) => [s.id, s.url])
  ) as Map<string, string | null>;

  // 슬롯별 file_id 결정
  const slotFileMap: Array<{
    slot: number;
    source: { file_id: string; signed_url: string; file_name: string };
  }> = [];

  for (const slotDef of analysis.screenshot_guide.slots) {
    let chosenFileId: string | null = null;

    // 1) per_slot_coverage 우선
    const cov = judgment.per_slot_coverage.find((c) => c.slot === slotDef.slot);
    if (cov?.best_candidate_file_id && fileById.has(cov.best_candidate_file_id)) {
      chosenFileId = cov.best_candidate_file_id;
    }

    // 2) keep의 assigned_slot 매칭
    if (!chosenFileId) {
      const kept = judgment.keep.find((k) => k.assigned_slot === slotDef.slot);
      if (kept && fileById.has(kept.file_id)) {
        chosenFileId = kept.file_id;
      }
    }

    // 3) keep 전체 중 아직 쓰이지 않은 것
    if (!chosenFileId) {
      const usedIds = new Set(slotFileMap.map((s) => s.source.file_id));
      const fallback = judgment.keep.find(
        (k) => !usedIds.has(k.file_id) && fileById.has(k.file_id)
      );
      if (fallback) chosenFileId = fallback.file_id;
    }

    // 4) 업로드 순환 fallback
    if (!chosenFileId) {
      const idx = slotFileMap.length % files.length;
      chosenFileId = files[idx].id;
    }

    if (!chosenFileId) {
      throw new Error(
        `슬롯 ${slotDef.slot} 에 배정할 소스 이미지를 결정하지 못했습니다.`
      );
    }
    const signed = urlById.get(chosenFileId);
    const f = fileById.get(chosenFileId);
    if (!signed || !f) {
      throw new Error(
        `슬롯 ${slotDef.slot} 에 배정할 소스 이미지 signed URL 발급 실패`
      );
    }

    slotFileMap.push({
      slot: slotDef.slot,
      source: {
        file_id: chosenFileId,
        signed_url: signed,
        file_name: f.file_name,
      },
    });
  }

  // 2. Overlay 디자인 호출
  console.log(
    `[generate-screenshots] Overlay 디자인 시작 — ${slotFileMap.length} 슬롯`
  );
  const design = await designOverlays({
    game_title: opts.game_title,
    game_genre: opts.game_genre,
    analysis,
    slots: slotFileMap,
    reference_screenshot_summaries: opts.referenceSummaries,
    referenceImages: opts.referenceImages,
  });
  console.log(
    `[generate-screenshots] Overlay 완료 — $${design.usage.cost_usd.toFixed(4)}`
  );

  // 3. Composite 렌더
  const compositeInputs: CompositeSlotInput[] = design.slots.map((slotRes) => {
    const mapped = slotFileMap.find((s) => s.slot === slotRes.slot);
    if (!mapped) {
      throw new Error(`슬롯 ${slotRes.slot} 소스 매핑이 사라졌습니다.`);
    }
    return {
      slot: slotRes.slot,
      background_image_url: mapped.source.signed_url,
      overlay: slotRes.overlay
        ? { html: slotRes.overlay.html, css: slotRes.overlay.css }
        : undefined,
    };
  });

  let buffers: Buffer[];
  try {
    buffers = await renderCompositeBatch(compositeInputs);
  } finally {
    await closeBrowser().catch(() => undefined);
  }

  // 4. 이전 Stage 9 결과물 정리 (가이드·스크린샷 모두 — 한 주문은 최신 하나만 유지)
  await purgePreviousStage9Deliverables(admin, orderId);

  // 5. Storage 업로드
  const screenshots: Array<{
    slot: number;
    storage_path: string;
    file_size: number;
    source_file_id: string;
    purpose: string;
    needs_overlay: boolean;
    design_notes: string;
  }> = [];

  for (let i = 0; i < buffers.length; i++) {
    const slotRes = design.slots[i];
    const mapped = slotFileMap.find((s) => s.slot === slotRes.slot)!;
    const storagePath = `${orderId}/aso_screenshots/slot-${String(
      slotRes.slot
    ).padStart(2, "0")}-${Date.now()}.png`;

    const { error: uploadError } = await admin.storage
      .from("deliverables")
      .upload(storagePath, buffers[i], {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        `슬롯 ${slotRes.slot} 업로드 실패: ${uploadError.message}`
      );
    }

    screenshots.push({
      slot: slotRes.slot,
      storage_path: storagePath,
      file_size: buffers[i].byteLength,
      source_file_id: mapped.source.file_id,
      purpose: slotRes.purpose,
      needs_overlay: slotRes.needs_overlay,
      design_notes: slotRes.design_notes,
    });
  }

  // 6. deliverable 저장
  const { data: record, error } = await admin
    .from("deliverables")
    .insert({
      order_id: orderId,
      type: "aso_screenshots",
      content: {
        screenshots,
        reference_analysis: design.reference_analysis,
        judgment_summary: {
          verdict: judgment.verdict,
          kept_count: judgment.keep.length,
          missing_count: judgment.missing_materials.length,
        },
      } as unknown as Record<string, unknown>,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !record) {
    throw new Error(`스크린샷 deliverable 저장 실패: ${error?.message}`);
  }

  const totalCost =
    opts.libraryJudgmentCost +
    opts.libraryAugmentationCost +
    judgment.usage.cost_usd +
    design.usage.cost_usd;

  return {
    mode: "aso_screenshots",
    deliverable_id: record.id,
    judgment,
    screenshots,
    reference_analysis: design.reference_analysis,
    usage: {
      library_judgment_cost_usd: opts.libraryJudgmentCost,
      library_augmentation_cost_usd: opts.libraryAugmentationCost,
      judge_cost_usd: judgment.usage.cost_usd,
      overlay_design_cost_usd: design.usage.cost_usd,
      total_cost_usd: totalCost,
    },
  };
}

/**
 * 메인 진입점.
 */
export async function generateScreenshotsForOrder(
  orderId: string
): Promise<GenerateOutcome> {
  const { admin, order, analysis } = await loadOrderAndAnalysis(orderId);

  // 타겟 시장 첫 항목을 country 로 사용 (없으면 기본 kr)
  const targetMarkets =
    order.target_market
      ?.split(",")
      .filter(Boolean)
      .map((m: string) => m.trim().toLowerCase()) ?? [];
  const primaryCountry = MARKET_TO_COUNTRY[targetMarkets[0]] ?? "kr";

  // 1. Library coverage (판정 + 필요 시 보완)
  const coverage = await getLibraryCoverage({
    analysis,
    game_title: order.game_title,
    game_genre: order.game_genre ?? "other",
    country: primaryCountry,
  });

  const referenceSummaries = coverage.screenshots.slice(0, 20).map((s) => ({
    game_title: s.game_title,
    slot_number: s.slot_number,
    analysis_summary: summarize(s.analysis),
  }));

  // 레퍼런스 이미지는 Vision 입력용으로 일부만 signed URL 붙임
  const sampleShots = coverage.screenshots.slice(0, 6);
  const refImagesSigned = await Promise.all(
    sampleShots.map(async (s) => {
      const { data } = await admin.storage
        .from("reference-library")
        .createSignedUrl(s.storage_path, 3600);
      return {
        url: data?.signedUrl ?? "",
        label: `REF ${s.game_title} slot ${s.slot_number}`,
      };
    })
  );
  const referenceImages = refImagesSigned.filter((r) => r.url);

  // 2. Judge
  const judgment = await judgeUploadedMaterials({
    orderId,
    game_title: order.game_title,
    game_genre: order.game_genre ?? "other",
    analysis,
    referenceScreenshots: coverage.screenshots,
    referenceSignedUrls: referenceImages,
  });

  const libraryJudgmentCost = coverage.judgment_cost_usd;
  const libraryAugmentationCost = coverage.augmentation?.cost_usd ?? 0;

  // 3. 분기
  if (judgment.verdict === "insufficient") {
    return runUploadGuideBranch({
      admin,
      orderId,
      game_title: order.game_title,
      game_genre: order.game_genre ?? "other",
      analysis,
      judgment,
      libraryJudgmentCost,
      libraryAugmentationCost,
    });
  }

  // sufficient 또는 partial → 제작 진행
  return runScreenshotProductionBranch({
    admin,
    orderId,
    game_title: order.game_title,
    game_genre: order.game_genre ?? "other",
    analysis,
    judgment,
    referenceSummaries,
    referenceImages,
    libraryJudgmentCost,
    libraryAugmentationCost,
  });
}

function summarize(analysis: Record<string, unknown> | null): string {
  if (!analysis) return "분석 요약 없음";
  const layout =
    (analysis.layout_pattern as string) ||
    (analysis.layout_archetype as string) ||
    "";
  const purpose =
    (analysis.purpose_signal as string) ||
    (analysis.slot_role as string) ||
    "";
  const what = analysis.what_makes_it_work as string;
  const parts: string[] = [];
  if (purpose) parts.push(`역할=${purpose}`);
  if (layout) parts.push(`레이아웃=${layout}`);
  if (what) parts.push(`강점=${truncate(what, 100)}`);
  return parts.join(" | ") || "분석 요약 없음";
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
