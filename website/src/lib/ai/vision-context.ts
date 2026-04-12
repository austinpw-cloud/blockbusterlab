/**
 * 주문에 업로드된 이미지(스크린샷 + 아이콘)를 Claude Vision 입력용 블록으로 변환.
 *
 * Claude API는 이미지 URL 직접 참조 가능 (Anthropic이 내부적으로 다운로드).
 * Supabase Storage의 signed URL을 발급해서 그대로 전달.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type VisionImageRef = {
  category: "screenshot" | "logo" | "other";
  file_name: string;
  signed_url: string;
};

/**
 * 주문의 업로드 이미지를 가져와 Vision용 signed URL 발급.
 *
 * 샘플링:
 * - logo: 1장 (있다면 모두)
 * - screenshot: 최대 maxScreenshots 장 (스크랩된 경우 24장+ 이므로 샘플링)
 *
 * @param orderId
 * @param maxScreenshots 스크린샷 최대 개수 (기본 8)
 */
export async function fetchOrderVisualContext(
  orderId: string,
  maxScreenshots = 8
): Promise<VisionImageRef[]> {
  const admin = createAdminClient();

  const { data: files } = await admin
    .from("order_files")
    .select("category, file_name, storage_path, display_order, uploaded_at")
    .eq("order_id", orderId)
    .in("category", ["logo", "screenshot"])
    .order("display_order")
    .order("uploaded_at");

  if (!files || files.length === 0) return [];

  // 로고 — 있는 대로 모두 (일반적으로 1-2개)
  const logos = files.filter((f) => f.category === "logo").slice(0, 2);

  // 스크린샷 — 균등 샘플링으로 maxScreenshots 개
  const allScreenshots = files.filter((f) => f.category === "screenshot");
  let sampledScreenshots = allScreenshots;
  if (allScreenshots.length > maxScreenshots) {
    const step = allScreenshots.length / maxScreenshots;
    sampledScreenshots = [];
    for (let i = 0; i < maxScreenshots; i++) {
      sampledScreenshots.push(allScreenshots[Math.floor(i * step)]);
    }
  }

  const picked = [...logos, ...sampledScreenshots];

  const refs = await Promise.all(
    picked.map(async (f) => {
      const { data } = await admin.storage
        .from("order-materials")
        .createSignedUrl(f.storage_path, 3600);
      return {
        category: f.category as VisionImageRef["category"],
        file_name: f.file_name,
        signed_url: data?.signedUrl ?? "",
      };
    })
  );

  return refs.filter((r) => r.signed_url);
}
