/**
 * 주문 상세 페이지에서 사용하는 Server Actions.
 * 상태 변경 등.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import type { OrderStatus } from "@/lib/aso/status";
import { NEXT_STATUSES } from "@/lib/aso/status";
import { generateAsoForOrder } from "@/lib/ai/aso-analyzer";
import { generateScreenshotsForOrder } from "@/lib/screenshot/generate";

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();

    const admin = createAdminClient();

    // 현재 상태 확인 (전환 가능 체크)
    const { data: current, error: fetchError } = await admin
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (fetchError || !current) {
      return { ok: false, error: "주문을 찾을 수 없습니다." };
    }

    const allowed = NEXT_STATUSES[current.status as OrderStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      return {
        ok: false,
        error: `'${current.status}' 상태에서 '${nextStatus}'로 전환할 수 없습니다.`,
      };
    }

    // 추가 필드 업데이트 (delivered는 시간 기록)
    const updates: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "delivered") {
      updates.delivered_at = new Date().toISOString();
    } else if (nextStatus === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await admin
      .from("orders")
      .update(updates)
      .eq("id", orderId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
}

/**
 * ASO 분석 실행 — Opus 호출하고 결과 deliverables에 저장.
 * 완료되면 status를 'processing'으로 업데이트.
 */
export async function runAsoAnalysis(
  orderId: string
): Promise<{
  ok: boolean;
  error?: string;
  deliverable_id?: string;
  cost_usd?: number;
}> {
  try {
    await requireAdmin();

    const result = await generateAsoForOrder(orderId);

    // 주문 상태를 pending → processing으로 자동 전환 (이미 processing이면 유지)
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (order?.status === "pending") {
      await admin
        .from("orders")
        .update({ status: "processing" })
        .eq("id", orderId);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");

    return {
      ok: true,
      deliverable_id: result.deliverable_id,
      cost_usd: result.usage.approx_cost_usd,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
}

/**
 * 스토어 스크린샷 PNG 세트 생성 — AI 분석 결과 기반.
 */
export async function generateStoreScreenshots(
  orderId: string
): Promise<{
  ok: boolean;
  error?: string;
  mode?: "aso_screenshots" | "upload_guide";
  count?: number;
  deliverable_id?: string;
  verdict?: "sufficient" | "partial" | "insufficient";
}> {
  try {
    await requireAdmin();

    const result = await generateScreenshotsForOrder(orderId);

    revalidatePath(`/admin/orders/${orderId}`);

    if (result.mode === "aso_screenshots") {
      return {
        ok: true,
        mode: "aso_screenshots",
        count: result.screenshots.length,
        deliverable_id: result.deliverable_id,
        verdict: result.judgment.verdict,
      };
    }

    return {
      ok: true,
      mode: "upload_guide",
      count: 0,
      deliverable_id: result.deliverable_id,
      verdict: result.judgment.verdict,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: "pending" | "paid" | "refunded"
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();

    const admin = createAdminClient();
    const { error } = await admin
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", orderId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
}
