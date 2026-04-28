/**
 * 주문 접수 서버 로직.
 *
 * API 라우트에서 분리하여 테스트 용이 + 재사용성 확보.
 *
 * 책임:
 *  1. 고객 upsert (이메일 기준)
 *  2. (선택) Google Play 스토어 URL에서 자동 수집
 *  3. 주문 생성
 *  4. 사용자 업로드 파일 + 자동 수집 이미지 모두 Storage에 저장
 *  5. order_files 레코드 생성
 *
 * 실패 시 가능한 한 rollback (DB) 시도.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderInput } from "./schema";
import { scrapeGooglePlay, type GooglePlayAppInfo } from "@/lib/scraper/google-play";
import {
  scrapeAppleAppStore,
  type AppleAppStoreAppInfo,
} from "@/lib/scraper/apple-app-store";
import { ingestImagesFromUrls } from "@/lib/scraper/image-ingest";

export type IncomingFile = {
  file: File;
  category: "screenshot" | "logo" | "other";
};

export type CreateOrderResult = {
  order_id: string;
  order_number: string;
  scraped?: GooglePlayAppInfo;
  scraped_apple?: AppleAppStoreAppInfo;
  ingested_file_count: number;
};

/**
 * 파일명 슬러그 — 한국어/특수문자 제거 + timestamp.
 */
function slugifyFileName(name: string): string {
  const ext = name.match(/\.[^.]+$/)?.[0] ?? "";
  const base = name.replace(/\.[^.]+$/, "");
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${slug || "file"}-${Date.now()}${ext}`;
}

/**
 * 고객 찾기 or 생성 (이메일 기준).
 */
async function upsertCustomer(
  admin: ReturnType<typeof createAdminClient>,
  input: OrderInput
): Promise<string> {
  const { data: existing } = await admin
    .from("customers")
    .select("id")
    .eq("email", input.customer_email)
    .maybeSingle();

  if (existing) {
    await admin
      .from("customers")
      .update({
        name: input.customer_name,
        studio_name: input.studio_name,
        phone: input.customer_phone || null,
      })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data: created, error } = await admin
    .from("customers")
    .insert({
      email: input.customer_email,
      name: input.customer_name,
      studio_name: input.studio_name,
      phone: input.customer_phone || null,
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(`고객 생성 실패: ${error?.message}`);
  }

  return created.id;
}

/**
 * 주문 레코드 생성.
 * 스크랩 결과가 있으면 additional_notes에 구조화해서 저장.
 */
async function createOrderRecord(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string,
  input: OrderInput,
  priceKrw: number,
  scraped: GooglePlayAppInfo | null,
  scrapedApple: AppleAppStoreAppInfo | null
): Promise<{ order_id: string; order_number: string }> {
  const userFeatures = [input.feature_1, input.feature_2, input.feature_3]
    .filter((f) => f && f.trim())
    .join("\n");

  // 사용자 미기재 시 스크랩된 소개문 앞부분을 fallback으로 (Google → Apple 순)
  const coreFeatures =
    userFeatures ||
    (scraped?.description
      ? scraped.description.slice(0, 1500)
      : scrapedApple?.description
        ? scrapedApple.description.slice(0, 1500)
        : "(정보 없음 — 추후 보강 필요)");

  const noteBlocks: string[] = [];
  if (input.emphasis_notes) noteBlocks.push(`[강조] ${input.emphasis_notes}`);
  if (input.avoid_notes) noteBlocks.push(`[피할 점] ${input.avoid_notes}`);
  // additional_notes 는 Stage 8 ASO 분석 프롬프트로 흘러감 — **평점·리뷰 수는 제외**
  // (v2.6: 게임성·운영 신호는 ASO 분석 대상 아님). 평점은 관리자 UI·로그에서만 참조.
  if (scraped) {
    noteBlocks.push(
      `[Google Play 자동 수집]\n` +
        `- 제목: ${scraped.title}\n` +
        `- 개발사: ${scraped.developer}\n` +
        `- 장르: ${scraped.genre}\n` +
        `- 다운로드: ${scraped.installs ?? "-"}\n` +
        `- 스크린샷: ${scraped.screenshot_urls.length}장 자동 수집됨`
    );
  }
  if (scrapedApple) {
    noteBlocks.push(
      `[Apple App Store 자동 수집]\n` +
        `- 제목: ${scrapedApple.title}\n` +
        `- 개발사: ${scrapedApple.developer}\n` +
        `- 장르: ${scrapedApple.genre}\n` +
        `- 버전: ${scrapedApple.version ?? "-"} (updated: ${scrapedApple.updated?.slice(0, 10) ?? "-"})\n` +
        `- iPhone 스크린샷: ${scrapedApple.iphone_screenshot_urls.length}장 / iPad: ${scrapedApple.ipad_screenshot_urls.length}장 자동 수집됨`
    );
  }
  const additionalNotes = noteBlocks.join("\n\n") || null;

  const targetMarket = input.target_markets.join(",");

  const { data, error } = await admin
    .from("orders")
    .insert({
      customer_id: customerId,
      service_type: "aso",
      package_tier: input.package_id,
      game_title: input.game_title,
      game_genre: input.game_genre,
      store_url_android: input.store_url_android || null,
      store_url_apple: input.store_url_apple || null,
      core_features: coreFeatures,
      target_market: targetMarket,
      additional_notes: additionalNotes,
      status: "pending",
      price_krw: priceKrw,
      payment_status: "pending",
    })
    .select("id, order_number")
    .single();

  if (error || !data) {
    throw new Error(`주문 생성 실패: ${error?.message}`);
  }

  return { order_id: data.id, order_number: data.order_number };
}

/**
 * 사용자가 업로드한 File 객체 하나를 Storage에 업로드.
 */
async function uploadUserFile(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  item: IncomingFile,
  displayOrder: number
) {
  const safeName = slugifyFileName(item.file.name);
  const storagePath = `${orderId}/${item.category}/${safeName}`;

  const { error } = await admin.storage
    .from("order-materials")
    .upload(storagePath, item.file, {
      contentType: item.file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`파일 업로드 실패 (${item.file.name}): ${error.message}`);
  }

  return {
    order_id: orderId,
    category: item.category,
    file_name: item.file.name,
    file_size: item.file.size,
    mime_type: item.file.type,
    storage_path: storagePath,
    display_order: displayOrder,
  };
}

/**
 * order_files 레코드 일괄 INSERT.
 */
async function recordOrderFiles(
  admin: ReturnType<typeof createAdminClient>,
  rows: Array<{
    order_id: string;
    category: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    storage_path: string;
    display_order: number;
  }>
) {
  if (rows.length === 0) return;
  const { error } = await admin.from("order_files").insert(rows);
  if (error) {
    throw new Error(`파일 메타데이터 저장 실패: ${error.message}`);
  }
}

/**
 * 주문 삭제 (rollback). Storage orphan은 추후 정기 청소.
 */
async function rollbackOrder(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string
) {
  try {
    await admin.from("orders").delete().eq("id", orderId);
  } catch {
    console.error(`[orders] rollback failed for order ${orderId}`);
  }
}

/**
 * 메인 진입점 — 주문 생성 + 파일 수집/업로드 전체.
 */
export async function createOrder(
  input: OrderInput,
  files: IncomingFile[],
  priceKrw: number
): Promise<CreateOrderResult> {
  const admin = createAdminClient();

  // 1. 양 스토어 URL 있으면 병렬 스크랩 시도 (각각 실패해도 주문은 진행)
  const [scraped, scrapedApple] = await Promise.all([
    input.store_url_android
      ? scrapeGooglePlay(input.store_url_android).catch((e) => {
          console.warn(
            "[orders] Google Play 스크랩 실패, 수동 진행:",
            e instanceof Error ? e.message : e
          );
          return null;
        })
      : Promise.resolve(null),
    input.store_url_apple
      ? scrapeAppleAppStore(input.store_url_apple).catch((e) => {
          console.warn(
            "[orders] Apple App Store 스크랩 실패, 수동 진행:",
            e instanceof Error ? e.message : e
          );
          return null;
        })
      : Promise.resolve(null),
  ]);

  // 2. 고객
  const customerId = await upsertCustomer(admin, input);

  // 3. 주문
  const { order_id, order_number } = await createOrderRecord(
    admin,
    customerId,
    input,
    priceKrw,
    scraped,
    scrapedApple
  );

  let ingestedFileCount = 0;

  try {
    // 4a. 사용자 업로드 파일 저장
    const userUploadRows = await Promise.all(
      files.map((item, idx) => uploadUserFile(admin, order_id, item, idx))
    );

    // 4b. 스크랩된 이미지 다운로드 + 저장 (Google Play + Apple App Store 각각)
    const scrapedRows: Awaited<ReturnType<typeof uploadUserFile>>[] = [];

    const ingestJobs: Array<{
      url: string;
      category: "logo" | "screenshot";
      suggestedName: string;
    }> = [];

    if (scraped) {
      ingestJobs.push({
        url: scraped.icon_url,
        category: "logo",
        suggestedName: "gplay-icon",
      });
      ingestJobs.push(
        ...scraped.screenshot_urls.map((url, idx) => ({
          url,
          category: "screenshot" as const,
          suggestedName: `gplay-screenshot-${idx + 1}`,
        }))
      );
    }

    if (scrapedApple) {
      ingestJobs.push({
        url: scrapedApple.icon_url,
        category: "logo",
        suggestedName: "apple-icon",
      });
      ingestJobs.push(
        ...scrapedApple.iphone_screenshot_urls.map((url, idx) => ({
          url,
          category: "screenshot" as const,
          suggestedName: `apple-iphone-screenshot-${idx + 1}`,
        }))
      );
      // iPad 스크린샷은 참고용으로 `other` 카테고리에 저장
      ingestJobs.push(
        ...scrapedApple.ipad_screenshot_urls.map((url, idx) => ({
          url,
          category: "screenshot" as const,
          suggestedName: `apple-ipad-screenshot-${idx + 1}`,
        }))
      );
    }

    if (ingestJobs.length > 0) {
      const ingested = await ingestImagesFromUrls(order_id, ingestJobs);
      for (let i = 0; i < ingested.length; i++) {
        const img = ingested[i];
        scrapedRows.push({
          order_id,
          category: img.category,
          file_name: img.file_name,
          file_size: img.file_size,
          mime_type: img.mime_type,
          storage_path: img.storage_path,
          display_order: userUploadRows.length + i,
        });
      }
    }

    // 4c. 레코드 일괄 저장
    const allRows = [...userUploadRows, ...scrapedRows];
    await recordOrderFiles(admin, allRows);
    ingestedFileCount = allRows.length;
  } catch (e) {
    await rollbackOrder(admin, order_id);
    throw e;
  }

  return {
    order_id,
    order_number,
    scraped: scraped ?? undefined,
    scraped_apple: scrapedApple ?? undefined,
    ingested_file_count: ingestedFileCount,
  };
}
