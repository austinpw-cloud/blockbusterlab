/**
 * 외부 URL 이미지를 다운로드해서 Supabase Storage에 업로드.
 *
 * 스크래핑으로 얻은 Google Play CDN 이미지들을 우리 저장소로 옮길 때 사용.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { toHighResUrl } from "./highres";

export type IngestedImage = {
  category: "screenshot" | "logo" | "other";
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  source_url: string;
};

type IngestJob = {
  url: string;
  category: "screenshot" | "logo" | "other";
  suggestedName?: string;
};

/**
 * URL에서 확장자 추측. 실패 시 .jpg.
 */
function guessExtension(contentType: string | null, url: string): string {
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return ".jpg";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";

  const urlMatch = url.match(/\.(png|jpe?g|webp|gif)(\?.*)?$/i);
  if (urlMatch) return `.${urlMatch[1].toLowerCase().replace("jpeg", "jpg")}`;

  return ".jpg";
}

async function downloadImage(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`이미지 다운로드 실패 (${res.status}): ${url}`);
  }
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

/**
 * 여러 이미지를 병렬로 다운로드해서 Supabase Storage에 업로드.
 *
 * @param orderId  주문 ID (Storage 경로의 prefix)
 * @param jobs     다운로드 작업 목록
 */
export async function ingestImagesFromUrls(
  orderId: string,
  jobs: IngestJob[]
): Promise<IngestedImage[]> {
  const admin = createAdminClient();

  const results = await Promise.all(
    jobs.map(async (job, idx) => {
      // Google Play CDN URL이면 고해상도로 강제 (호출자가 이미 변환했으면 no-op)
      const sourceUrl =
        job.category === "logo"
          ? toHighResUrl(job.url, 1024)
          : toHighResUrl(job.url);
      const { buffer, contentType } = await downloadImage(sourceUrl);
      const ext = guessExtension(contentType, sourceUrl);
      const baseName = job.suggestedName ?? `${job.category}-${idx + 1}`;
      const safeName = `${baseName}-${Date.now()}-${idx}${ext}`;
      const storagePath = `${orderId}/${job.category}/${safeName}`;

      const { error } = await admin.storage
        .from("order-materials")
        .upload(storagePath, buffer, {
          contentType,
          upsert: false,
        });

      if (error) {
        throw new Error(`Storage 업로드 실패: ${error.message}`);
      }

      return {
        category: job.category,
        file_name: safeName,
        file_size: buffer.byteLength,
        mime_type: contentType,
        storage_path: storagePath,
        source_url: sourceUrl,
      };
    })
  );

  return results;
}
