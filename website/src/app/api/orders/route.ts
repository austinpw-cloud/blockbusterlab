/**
 * POST /api/orders
 *
 * 주문 접수 엔드포인트.
 *
 * 입력: multipart/form-data
 *   - 필드: customer_name, customer_email, customer_phone, studio_name,
 *           game_title, game_genre,
 *           store_url_android (Google Play URL, 선택),
 *           store_url_apple (Apple App Store URL, 선택 — 둘 중 하나 이상 권장),
 *           target_markets[], feature_1/2/3, emphasis_notes, avoid_notes, package_id
 *   - 파일: screenshots[], logo[], other[]
 *     (store URL 이 하나도 없으면 screenshots 최소 5장 + logo 필수)
 *
 * 응답:
 *   200: { order_number: "BBL-20260412-0001", order_id: "...",
 *          scraped_gplay, scraped_apple, ingested_file_count }
 *   400: { error: "검증 실패 메시지" }
 *   500: { error: "서버 에러 메시지" }
 */

import { NextRequest, NextResponse } from "next/server";

import {
  orderInputSchema,
  MAX_FILE_SIZE_BYTES,
  MIN_SCREENSHOT_COUNT,
  MAX_SCREENSHOT_COUNT,
  MAX_LOGO_COUNT,
  MAX_OTHER_COUNT,
  validateFilesForCategory,
} from "@/lib/aso/schema";
import { ASO_PACKAGES } from "@/lib/aso/constants";
import { createOrder, type IncomingFile } from "@/lib/aso/orders";

export const runtime = "nodejs";
export const maxDuration = 60;

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getAllStrings(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((v): v is string => typeof v === "string");
}

function getFiles(formData: FormData, key: string): File[] {
  return formData.getAll(key).filter((v): v is File => v instanceof File);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // 1. 단순 필드 파싱
    const parsed = {
      customer_name: getString(formData, "customer_name").trim(),
      customer_email: getString(formData, "customer_email").trim(),
      customer_phone: getString(formData, "customer_phone").trim(),
      studio_name: getString(formData, "studio_name").trim(),
      game_title: getString(formData, "game_title").trim(),
      game_genre: getString(formData, "game_genre"),
      store_url_android: getString(formData, "store_url_android").trim(),
      store_url_apple: getString(formData, "store_url_apple").trim(),
      target_markets: getAllStrings(formData, "target_markets"),
      feature_1: getString(formData, "feature_1").trim(),
      feature_2: getString(formData, "feature_2").trim(),
      feature_3: getString(formData, "feature_3").trim(),
      emphasis_notes: getString(formData, "emphasis_notes").trim(),
      avoid_notes: getString(formData, "avoid_notes").trim(),
      package_id: getString(formData, "package_id"),
    };

    // 2. Zod 검증
    const validation = orderInputSchema.safeParse(parsed);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "입력값 오류",
          field: firstIssue?.path?.join("."),
        },
        { status: 400 }
      );
    }
    const input = validation.data;

    // 3. 패키지 검증 + 가격 조회
    const pkg = ASO_PACKAGES.find((p) => p.id === input.package_id);
    if (!pkg) {
      return NextResponse.json({ error: "존재하지 않는 패키지" }, { status: 400 });
    }
    if (!pkg.active) {
      return NextResponse.json(
        { error: "현재 선택 불가능한 패키지입니다" },
        { status: 400 }
      );
    }

    // 4. 파일 파싱 + 검증
    const screenshots = getFiles(formData, "screenshots");
    const logos = getFiles(formData, "logo");
    const others = getFiles(formData, "other");

    // 스토어 URL 하나라도 있으면 자동 수집 가능 — 파일 최소 요구 완화.
    // 둘 다 없을 때만 원본 파일 필수.
    const hasStoreUrl = !!input.store_url_android || !!input.store_url_apple;

    if (!hasStoreUrl) {
      if (screenshots.length < MIN_SCREENSHOT_COUNT) {
        return NextResponse.json(
          {
            error: `스토어 URL이 없는 경우 스크린샷 최소 ${MIN_SCREENSHOT_COUNT}장 필요합니다.`,
          },
          { status: 400 }
        );
      }
      if (logos.length < 1) {
        return NextResponse.json(
          { error: "스토어 URL이 없는 경우 게임 로고를 업로드해 주세요." },
          { status: 400 }
        );
      }
    }

    // 카테고리별 MIME·개수 검증 (서버 enforce)
    const ssError = validateFilesForCategory(screenshots, "screenshot", MAX_SCREENSHOT_COUNT);
    if (ssError) return NextResponse.json({ error: ssError }, { status: 400 });

    const logoError = validateFilesForCategory(logos, "logo", MAX_LOGO_COUNT);
    if (logoError) return NextResponse.json({ error: logoError }, { status: 400 });

    const otherError = validateFilesForCategory(others, "other", MAX_OTHER_COUNT);
    if (otherError) return NextResponse.json({ error: otherError }, { status: 400 });

    // 크기 검증
    const allFiles = [...screenshots, ...logos, ...others];
    const oversize = allFiles.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversize) {
      return NextResponse.json(
        {
          error: `파일 크기 초과: ${oversize.name} (${(
            oversize.size /
            1024 /
            1024
          ).toFixed(1)}MB)`,
        },
        { status: 400 }
      );
    }

    // 5. IncomingFile 형태로 정리
    const incoming: IncomingFile[] = [
      ...screenshots.map((file) => ({ file, category: "screenshot" as const })),
      ...logos.map((file) => ({ file, category: "logo" as const })),
      ...others.map((file) => ({ file, category: "other" as const })),
    ];

    // 6. 주문 생성
    const result = await createOrder(input, incoming, pkg.price_krw);

    return NextResponse.json({
      ok: true,
      order_id: result.order_id,
      order_number: result.order_number,
      scraped_gplay: result.scraped
        ? {
            title: result.scraped.title,
            genre: result.scraped.genre,
            screenshot_count: result.scraped.screenshot_urls.length,
          }
        : null,
      scraped_apple: result.scraped_apple
        ? {
            title: result.scraped_apple.title,
            genre: result.scraped_apple.genre,
            iphone_screenshot_count:
              result.scraped_apple.iphone_screenshot_urls.length,
            ipad_screenshot_count:
              result.scraped_apple.ipad_screenshot_urls.length,
          }
        : null,
      ingested_file_count: result.ingested_file_count,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    console.error("[api/orders] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
