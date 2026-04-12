/**
 * GET /api/admin/orders/[orderId]/files
 *
 * 주문에 업로드된 파일 목록 + signed URL 반환. 관리자 인증 필수.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

type Params = Promise<{ orderId: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await params;
    const admin = createAdminClient();

    const { data: files, error } = await admin
      .from("order_files")
      .select(
        "id, category, file_name, file_size, mime_type, storage_path, uploaded_at"
      )
      .eq("order_id", orderId)
      .order("category")
      .order("uploaded_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const withUrls = await Promise.all(
      (files ?? []).map(async (f) => {
        const { data: signed } = await admin.storage
          .from("order-materials")
          .createSignedUrl(f.storage_path, 3600);

        return {
          ...f,
          signed_url: signed?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      order_id: orderId,
      count: withUrls.length,
      files: withUrls,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
