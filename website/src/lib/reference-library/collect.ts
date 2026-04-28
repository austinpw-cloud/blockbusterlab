/**
 * Reference Library 수집 — Top 게임 + 스크린샷 다운로드.
 *
 * 1회성 실행 (장르별 또는 전체).
 * Google Play Top 차트에서 Top N 게임을 가져와 스크린샷/아이콘을 Storage에 저장.
 */

import "server-only";
import gplay from "google-play-scraper";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";
import { toHighResUrl } from "@/lib/scraper/highres";
import { getLangForCountry } from "@/lib/scraper/competitor-fetch";
// v2.6 이후 리뷰·평점 테마는 ASO 분석 대상 아님 (`fetchReviewSamples` import 제거).
// `extractMonetizationHint` 는 ASO 메시징 해석에 필요해 유지.
import { extractMonetizationHint } from "@/lib/scraper/reviews";

const GENRE_TO_GPLAY_CATEGORY: Record<string, string> = {
  puzzle: "GAME_PUZZLE",
  rpg: "GAME_ROLE_PLAYING",
  action: "GAME_ACTION",
  strategy: "GAME_STRATEGY",
  simulation: "GAME_SIMULATION",
  casual: "GAME_CASUAL",
  arcade: "GAME_ARCADE",
  sports: "GAME_SPORTS",
  racing: "GAME_RACING",
  card: "GAME_CARD",
  adventure: "GAME_ADVENTURE",
  board: "GAME_BOARD",
  word: "GAME_WORD",
};

const COLLECTION_BUCKET = "reference-library";

async function downloadImage(url: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`다운로드 실패 (${res.status}): ${url}`);
  }
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

function guessExt(contentType: string): string {
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  return ".jpg";
}

export type CollectProgress = {
  genre: string;
  stage: "fetching_list" | "fetching_details" | "downloading" | "done";
  total_games: number;
  games_processed: number;
  screenshots_downloaded: number;
  errors: string[];
};

/**
 * 장르별 Top N 게임 수집 + 스크린샷/아이콘 저장.
 */
export async function collectReferenceGamesForGenre(
  genre: string,
  topN = 15,
  country = "kr",
  onProgress?: (p: CollectProgress) => void
): Promise<CollectProgress> {
  const admin = createAdminClient();
  const runId = randomUUID();
  const lang = getLangForCountry(country);

  const progress: CollectProgress = {
    genre,
    stage: "fetching_list",
    total_games: 0,
    games_processed: 0,
    screenshots_downloaded: 0,
    errors: [],
  };
  onProgress?.(progress);

  const category = GENRE_TO_GPLAY_CATEGORY[genre];
  if (!category) {
    throw new Error(`알 수 없는 장르: ${genre}`);
  }

  // 1. Top 차트 조회
  const list = await gplay.list({
    category: category as Parameters<typeof gplay.list>[0]["category"],
    collection: "TOP_FREE" as Parameters<typeof gplay.list>[0]["collection"],
    country,
    num: topN,
    fullDetail: false,
  });
  const appIds = list.map((a) => a.appId);

  progress.stage = "fetching_details";
  progress.total_games = appIds.length;
  onProgress?.(progress);

  // 2. 각 게임 상세 조회 + 저장
  for (let i = 0; i < appIds.length; i++) {
    const appId = appIds[i];

    try {
      // 같은 (country, app_id) 로 이미 수집한 게임이면 스킵
      const { data: existing } = await admin
        .from("reference_games")
        .select("id")
        .eq("country", country)
        .eq("app_id", appId)
        .maybeSingle();

      if (existing) {
        progress.games_processed++;
        onProgress?.(progress);
        continue;
      }

      const app = await gplay.app({ appId, country, lang });

      // 수익모델 힌트만 추출. v2.6: 리뷰 수집 중단.
      const monetization = extractMonetizationHint(
        app as Parameters<typeof extractMonetizationHint>[0]
      );

      // 아이콘 다운로드
      let iconStoragePath: string | null = null;
      try {
        const { buffer, contentType } = await downloadImage(
          toHighResUrl(app.icon, 1024)
        );
        const ext = guessExt(contentType);
        iconStoragePath = `${country}/${genre}/${appId}/icon${ext}`;
        const { error } = await admin.storage
          .from(COLLECTION_BUCKET)
          .upload(iconStoragePath, buffer, {
            contentType,
            upsert: true,
          });
        if (error) throw error;
      } catch (e) {
        progress.errors.push(
          `[${appId}] icon 실패: ${e instanceof Error ? e.message : e}`
        );
      }

      // reference_games insert. `rating`·`ratings_count` 는 운영 메타로만 저장 (ASO 분석 입력 아님).
      // `reviews_summary`·`reviews_collected_at` 은 v2.6 이후 수집 안 함 (dead column).
      const { data: gameRow, error: gameErr } = await admin
        .from("reference_games")
        .insert({
          genre,
          country,
          app_id: appId,
          title: app.title,
          developer: app.developer,
          gplay_genre: app.genre,
          rating: app.score ?? null,
          ratings_count: app.ratings ?? null,
          installs: app.installs ?? null,
          min_installs: app.minInstalls ?? null,
          store_url: app.url,
          short_description: app.summary ?? null,
          full_description: app.description ?? null,
          icon_storage_path: iconStoragePath,
          icon_original_url: toHighResUrl(app.icon, 1024),
          rank_position: i + 1,
          collection_run_id: runId,
          monetization,
          video_url: app.video ?? null,
          last_refreshed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (gameErr || !gameRow) {
        throw new Error(`reference_games insert 실패: ${gameErr?.message}`);
      }

      // 스크린샷 다운로드 + reference_screenshots insert
      const screenshots = app.screenshots ?? [];
      for (let slotIdx = 0; slotIdx < screenshots.length; slotIdx++) {
        const url = toHighResUrl(screenshots[slotIdx]);
        try {
          const { buffer, contentType } = await downloadImage(url);
          const ext = guessExt(contentType);
          const path = `${country}/${genre}/${appId}/slot-${String(slotIdx + 1).padStart(
            2,
            "0"
          )}${ext}`;

          const { error: uploadErr } = await admin.storage
            .from(COLLECTION_BUCKET)
            .upload(path, buffer, { contentType, upsert: true });
          if (uploadErr) throw uploadErr;

          const { error: ssErr } = await admin
            .from("reference_screenshots")
            .insert({
              game_id: gameRow.id,
              slot_number: slotIdx + 1,
              storage_path: path,
              original_url: url,
              file_size: buffer.byteLength,
            });
          if (ssErr) throw ssErr;

          progress.screenshots_downloaded++;
        } catch (e) {
          progress.errors.push(
            `[${appId}] slot ${slotIdx + 1} 실패: ${e instanceof Error ? e.message : e}`
          );
        }
      }
    } catch (e) {
      progress.errors.push(
        `[${appId}] 처리 실패: ${e instanceof Error ? e.message : e}`
      );
    }

    progress.games_processed++;
    onProgress?.(progress);
  }

  progress.stage = "done";
  onProgress?.(progress);
  return progress;
}

/**
 * 지정된 app_id 목록만 수집.
 *
 * library-coverage 에서 "엄선된 추가 벤치마크"를 Library에 보완할 때 사용.
 * 이미 수집된 게임은 skip (analysis 보존).
 */
export async function collectSpecificGames(opts: {
  genre: string;
  appIds: string[];
  country?: string;
  onProgress?: (p: CollectProgress) => void;
}): Promise<CollectProgress> {
  const admin = createAdminClient();
  const runId = randomUUID();
  const country = opts.country ?? "kr";
  const lang = getLangForCountry(country);

  const progress: CollectProgress = {
    genre: opts.genre,
    stage: "fetching_details",
    total_games: opts.appIds.length,
    games_processed: 0,
    screenshots_downloaded: 0,
    errors: [],
  };
  opts.onProgress?.(progress);

  for (const appId of opts.appIds) {
    try {
      const { data: existing } = await admin
        .from("reference_games")
        .select("id")
        .eq("country", country)
        .eq("app_id", appId)
        .maybeSingle();

      if (existing) {
        progress.games_processed++;
        opts.onProgress?.(progress);
        continue;
      }

      const app = await gplay.app({ appId, country, lang });

      // 수익모델 힌트만 추출. v2.6: 리뷰 수집 중단.
      const monetization = extractMonetizationHint(
        app as Parameters<typeof extractMonetizationHint>[0]
      );

      // 아이콘
      let iconStoragePath: string | null = null;
      try {
        const { buffer, contentType } = await downloadImage(
          toHighResUrl(app.icon, 1024)
        );
        const ext = guessExt(contentType);
        iconStoragePath = `${country}/${opts.genre}/${appId}/icon${ext}`;
        const { error } = await admin.storage
          .from(COLLECTION_BUCKET)
          .upload(iconStoragePath, buffer, { contentType, upsert: true });
        if (error) throw error;
      } catch (e) {
        progress.errors.push(
          `[${appId}] icon 실패: ${e instanceof Error ? e.message : e}`
        );
      }

      const { data: gameRow, error: gameErr } = await admin
        .from("reference_games")
        .insert({
          genre: opts.genre,
          country,
          app_id: appId,
          title: app.title,
          developer: app.developer,
          gplay_genre: app.genre,
          rating: app.score ?? null,
          ratings_count: app.ratings ?? null,
          installs: app.installs ?? null,
          min_installs: app.minInstalls ?? null,
          store_url: app.url,
          short_description: app.summary ?? null,
          full_description: app.description ?? null,
          icon_storage_path: iconStoragePath,
          icon_original_url: toHighResUrl(app.icon, 1024),
          rank_position: null, // 엄선 수집은 순위 의미 없음
          collection_run_id: runId,
          monetization,
          video_url: app.video ?? null,
          last_refreshed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (gameErr || !gameRow) {
        throw new Error(`reference_games insert 실패: ${gameErr?.message}`);
      }

      const screenshots = app.screenshots ?? [];
      for (let slotIdx = 0; slotIdx < screenshots.length; slotIdx++) {
        const url = toHighResUrl(screenshots[slotIdx]);
        try {
          const { buffer, contentType } = await downloadImage(url);
          const ext = guessExt(contentType);
          const path = `${country}/${opts.genre}/${appId}/slot-${String(
            slotIdx + 1
          ).padStart(2, "0")}${ext}`;

          const { error: uploadErr } = await admin.storage
            .from(COLLECTION_BUCKET)
            .upload(path, buffer, { contentType, upsert: true });
          if (uploadErr) throw uploadErr;

          const { error: ssErr } = await admin
            .from("reference_screenshots")
            .insert({
              game_id: gameRow.id,
              slot_number: slotIdx + 1,
              storage_path: path,
              original_url: url,
              file_size: buffer.byteLength,
            });
          if (ssErr) throw ssErr;

          progress.screenshots_downloaded++;
        } catch (e) {
          progress.errors.push(
            `[${appId}] slot ${slotIdx + 1} 실패: ${e instanceof Error ? e.message : e}`
          );
        }
      }
    } catch (e) {
      progress.errors.push(
        `[${appId}] 처리 실패: ${e instanceof Error ? e.message : e}`
      );
    }

    progress.games_processed++;
    opts.onProgress?.(progress);
  }

  progress.stage = "done";
  opts.onProgress?.(progress);
  return progress;
}

/**
 * 장르 전체 재수집 (기존 데이터 드롭 후).
 *
 * 해상도 수정 등으로 Storage 내용 전부 다시 받아야 할 때 사용.
 * analysis 는 다시 돌려야 함 (analyze 모듈).
 */
export async function recollectGenreFromScratch(
  genre: string,
  topN = 10,
  country = "kr",
  onProgress?: (p: CollectProgress) => void
): Promise<CollectProgress> {
  const admin = createAdminClient();

  // 1. 해당 (country, genre) reference_games 조회 (CASCADE로 screenshots도 삭제됨)
  const { data: existing } = await admin
    .from("reference_games")
    .select("id, app_id")
    .eq("country", country)
    .eq("genre", genre);

  const oldAppIds = (existing ?? []).map((g) => g.app_id);

  // 2. Storage 내용 삭제 (경로에 country 포함)
  if (oldAppIds.length > 0) {
    const prefixes = oldAppIds.map((id) => `${country}/${genre}/${id}`);
    for (const prefix of prefixes) {
      const { data: files } = await admin.storage
        .from(COLLECTION_BUCKET)
        .list(prefix, { limit: 100 });
      if (files && files.length > 0) {
        const paths = files.map((f) => `${prefix}/${f.name}`);
        await admin.storage.from(COLLECTION_BUCKET).remove(paths);
      }
    }
  }

  // 3. reference_games 삭제 (country, genre 범위)
  await admin
    .from("reference_games")
    .delete()
    .eq("country", country)
    .eq("genre", genre);

  // 4. 새로 수집
  return collectReferenceGamesForGenre(genre, topN, country, onProgress);
}

/**
 * 전체 장르 수집 (순차).
 */
export async function collectAllGenres(
  topN = 15,
  country = "kr"
): Promise<Record<string, CollectProgress>> {
  const genres = Object.keys(GENRE_TO_GPLAY_CATEGORY);
  const results: Record<string, CollectProgress> = {};

  for (const genre of genres) {
    console.log(`\n━━━━━ ${genre} 수집 시작 ━━━━━`);
    results[genre] = await collectReferenceGamesForGenre(
      genre,
      topN,
      country,
      (p) =>
        console.log(
          `  [${p.stage}] ${p.games_processed}/${p.total_games} 게임, ${p.screenshots_downloaded} 스크린샷`
        )
    );
  }

  return results;
}
