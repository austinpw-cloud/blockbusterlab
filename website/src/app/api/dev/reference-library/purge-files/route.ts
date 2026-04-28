/**
 * 개발 전용: reference-library 버킷의 모든 파일 삭제.
 * DB 행은 유지 (analysis JSON 보존).
 *
 * 배경: Stage 9 가 Vision 재첨부 안 함 (JSON 만으로 충분) — 이미지 보관 불필요.
 *
 * 사용:
 *   curl "http://localhost:3000/api/dev/reference-library/purge-files?dry=1"
 *   curl -X POST "http://localhost:3000/api/dev/reference-library/purge-files?execute=1"
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

const BUCKET = "reference-library";

async function listAllPaths(
  admin: ReturnType<typeof createAdminClient>,
  prefix = ""
): Promise<string[]> {
  const all: string[] = [];
  const { data, error } = await admin.storage.from(BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw new Error(`list 실패 (${prefix}): ${error.message}`);

  for (const entry of data ?? []) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id == null) {
      // 폴더
      const sub = await listAllPaths(admin, path);
      all.push(...sub);
    } else {
      all.push(path);
    }
  }
  return all;
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const admin = createAdminClient();

  try {
    const paths = await listAllPaths(admin);
    return NextResponse.json({
      bucket: BUCKET,
      total_files: paths.length,
      sample: paths.slice(0, 10),
      dry_run: dry,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }

  if (req.nextUrl.searchParams.get("execute") !== "1") {
    return NextResponse.json(
      { error: "execute=1 required for actual deletion" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  try {
    const paths = await listAllPaths(admin);
    if (paths.length === 0) {
      return NextResponse.json({ deleted: 0, message: "no files" });
    }

    // Supabase remove 는 batch 100 정도까지 안전
    const BATCH = 100;
    let deleted = 0;
    const errors: string[] = [];
    for (let i = 0; i < paths.length; i += BATCH) {
      const chunk = paths.slice(i, i + BATCH);
      const { error } = await admin.storage.from(BUCKET).remove(chunk);
      if (error) {
        errors.push(`batch ${i}: ${error.message}`);
      } else {
        deleted += chunk.length;
      }
    }

    return NextResponse.json({
      bucket: BUCKET,
      deleted,
      total: paths.length,
      errors,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
