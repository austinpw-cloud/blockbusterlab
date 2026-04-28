/**
 * Reference Library 큐레이션 수집 오케스트레이터 — 50개 구성.
 *
 * 3 경로 (설계 §3):
 *   1) 매출 차트 상위 35개 — Google Play GROSSING × KR/US/JP 합산 dedupe
 *   2) 장르 키워드 검색 10개 — 키워드별 검색 결과 상위
 *   3) ASO 케이스 스터디 5개 — 수동 App ID 리스트
 *
 * 수집 후 각 게임에 자동 태깅:
 *   selection_basis · target_markets · monetization_model · studio_size · genre
 *
 * dry_run 모드 지원 — 후보 리스트만 보여주고 실제 수집은 안 함.
 */

import "server-only";
import gplay from "google-play-scraper";
import { createAdminClient } from "@/lib/supabase/admin";
import { collectSpecificGames } from "./collect";
import { getLangForCountry } from "@/lib/scraper/competitor-fetch";
import {
  SEARCH_KEYWORDS,
  CASE_STUDY_APP_IDS,
  GROSSING_COUNTRIES,
  CURATION_QUOTAS,
  GPLAY_CATEGORY_TO_GENRE,
  isIpFranchise,
} from "./curated-lists";
import {
  inferMonetizationModel,
  inferStudioSize,
  normalizeGenreFromGplay,
  mergeMarkets,
  type SelectionBasis,
} from "./tag-game";

/**
 * Library 수집에서 제외해야 하는지 판정.
 *
 * 제외 기준:
 *   1) developer 가 AAA·IP 퍼블리셔 whitelist 매칭 (브랜드 파워로 매출 나옴 — ASO 분석 가치 낮음)
 *   2) title 에 IP 프랜차이즈 키워드 포함 (라이선스 IP 기반)
 *
 * ASO 혁신 사례 (Dream Games·Playrix·Voodoo 등) 는 mid 로 분류되어 포함됨.
 */
function shouldExcludeFromLibrary(game: {
  title: string;
  developer: string | null;
}): { excluded: boolean; reason?: string } {
  const size = inferStudioSize(game.developer);
  if (size === "aaa") {
    return {
      excluded: true,
      reason: `AAA publisher: ${game.developer}`,
    };
  }
  const ipMatch = isIpFranchise(game.title);
  if (ipMatch) {
    return {
      excluded: true,
      reason: `IP franchise keyword: "${ipMatch}" in title`,
    };
  }
  return { excluded: false };
}

export type CurationCandidate = {
  app_id: string;
  title: string;
  developer: string | null;
  genre: string | null;
  country: string; // 수집 위치 (스토리지 저장 시 사용)
  target_markets: string[]; // 이 게임이 등장한 시장 배열
  selection_basis: SelectionBasis;
  source_notes: string[]; // 디버그용 메모 (어느 경로에서 걸렸나)
  rank_signal: number; // 정렬용 — 여러 경로 등장 + 최고 순위 가중
  is_seed: boolean; // 각 (국가 × 장르) GROSSING Top 3 에 들면 true. 쿼터 선정 시 우선권
  best_seed_rank: number; // 이 게임이 (국가 × 장르) GROSSING 에서 얻은 최고 순위 (1/2/3). seed 아니면 Infinity
};

export type CurationResult = {
  dry_run: boolean;
  candidates_before_selection: number;
  selected: number;
  by_basis: Record<SelectionBasis, number>;
  collected: number;
  tagged: number;
  errors: string[];
  candidates?: CurationCandidate[]; // dry_run 시만
};

/**
 * 1경로: 매출 차트 상위.
 *
 * Google Play GROSSING 은 category 필수 (category 없이 전역 GROSSING 은 앱 전체 —
 * 게임 외 앱 포함됨. fullDetail=false 응답엔 genreId 없어 사후 필터 불가).
 * 따라서 우리가 관심 있는 GAME_* 하위 카테고리 × 국가 조합으로 반복 조회.
 *
 * 이 방식의 부수 이점: 카테고리가 곧 장르이므로 candidate.genre 를 즉시 결정.
 */
async function fetchGrossingCandidates(
  limitPerCategory = 10,
  errors: string[] = []
): Promise<CurationCandidate[]> {
  const byAppId = new Map<string, CurationCandidate>();
  const gameCategories = Object.keys(GPLAY_CATEGORY_TO_GENRE); // GAME_PUZZLE, ...

  for (const country of GROSSING_COUNTRIES) {
    for (const category of gameCategories) {
      try {
        const list = await gplay.list({
          category: category as Parameters<typeof gplay.list>[0]["category"],
          collection:
            "GROSSING" as Parameters<typeof gplay.list>[0]["collection"],
          country,
          num: limitPerCategory,
          fullDetail: false,
        });

        const genreName = GPLAY_CATEGORY_TO_GENRE[category];

        for (let i = 0; i < list.length; i++) {
          const app = list[i];

          // AAA·IP 필터
          const ex = shouldExcludeFromLibrary({
            title: app.title,
            developer: app.developer ?? null,
          });
          if (ex.excluded) {
            errors.push(
              `[excluded] grossing ${country}:${category}#${i + 1} ${app.appId} — ${ex.reason}`
            );
            continue;
          }

          const existing = byAppId.get(app.appId);
          const rankPosition = i + 1; // 1-based
          // rank_signal: 카테고리 내 순위 역산. 1위 = limitPerCategory, 2위 = limitPerCategory-1 ...
          const rankScore = Math.max(0, limitPerCategory - i);
          // 각 (국가 × 장르) GROSSING Top 3 는 시드로 보장 — signal 무관하게 우선 포함
          const isTop3 = i < 3;
          if (existing) {
            existing.target_markets = mergeMarkets(
              existing.target_markets,
              country
            );
            // 복수 국가·카테고리 등장 시 소폭 보너스(+10). 너무 크면 단일 시장 최상위 게임을 덮어버림.
            existing.rank_signal += rankScore + 10;
            existing.source_notes.push(`grossing:${country}:${category}#${i + 1}`);
            if (isTop3) {
              existing.is_seed = true;
              existing.best_seed_rank = Math.min(
                existing.best_seed_rank,
                rankPosition
              );
            }
          } else {
            byAppId.set(app.appId, {
              app_id: app.appId,
              title: app.title,
              developer: app.developer ?? null,
              genre: genreName, // 카테고리가 곧 장르
              country,
              target_markets: [country],
              selection_basis: "revenue_top",
              source_notes: [`grossing:${country}:${category}#${i + 1}`],
              rank_signal: rankScore,
              is_seed: isTop3,
              best_seed_rank: isTop3 ? rankPosition : Infinity,
            });
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`grossing ${country}:${category} 실패: ${msg}`);
        console.error(`[curate] grossing ${country}:${category} 실패:`, msg);
      }
    }
  }

  return Array.from(byAppId.values()).sort(
    (a, b) => b.rank_signal - a.rank_signal
  );
}

/**
 * 2경로: 장르 키워드 검색 상위.
 * SEARCH_KEYWORDS × country 로 검색 → 상위 Top 5 합쳐 dedupe.
 */
async function fetchKeywordCandidates(
  topPerKeyword = 5,
  errors: string[] = []
): Promise<CurationCandidate[]> {
  const byAppId = new Map<string, CurationCandidate>();

  for (const [country, keywords] of Object.entries(SEARCH_KEYWORDS)) {
    for (const keyword of keywords) {
      try {
        const results = await gplay.search({
          term: keyword,
          country,
          lang: getLangForCountry(country),
          num: topPerKeyword,
          fullDetail: false,
        });

        for (let i = 0; i < results.length; i++) {
          const app = results[i];

          // AAA·IP 필터
          const ex = shouldExcludeFromLibrary({
            title: app.title,
            developer: app.developer ?? null,
          });
          if (ex.excluded) {
            errors.push(
              `[excluded] search ${country} "${keyword}"#${i + 1} ${app.appId} — ${ex.reason}`
            );
            continue;
          }

          const existing = byAppId.get(app.appId);
          const rankScore = Math.max(0, topPerKeyword + 1 - (i + 1));
          if (existing) {
            existing.target_markets = mergeMarkets(
              existing.target_markets,
              country
            );
            existing.rank_signal += rankScore;
            existing.source_notes.push(`search:${country}:"${keyword}"#${i + 1}`);
          } else {
            byAppId.set(app.appId, {
              app_id: app.appId,
              title: app.title,
              developer: app.developer ?? null,
              genre: null,
              country,
              target_markets: [country],
              selection_basis: "keyword_search",
              source_notes: [`search:${country}:"${keyword}"#${i + 1}`],
              rank_signal: rankScore,
              is_seed: false,
              best_seed_rank: Infinity,
            });
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`search ${country} "${keyword}" 실패: ${msg}`);
        console.error(`[curate] search ${country} "${keyword}" 실패:`, msg);
      }
    }
  }

  return Array.from(byAppId.values()).sort(
    (a, b) => b.rank_signal - a.rank_signal
  );
}

/**
 * 3경로: 케이스 스터디 수동 리스트.
 */
function fetchCaseStudyCandidates(): CurationCandidate[] {
  return CASE_STUDY_APP_IDS.map((entry) => ({
    app_id: entry.app_id,
    title: "", // 상세 조회 시 채워짐
    developer: null,
    genre: null,
    country: entry.country,
    target_markets: [entry.country],
    selection_basis: "case_study" as SelectionBasis,
    source_notes: [`case_study: ${entry.source_note}`],
    rank_signal: 1000, // 수동 큐레이션이라 고정 최우선
    is_seed: true,
    best_seed_rank: 0, // 수동 큐레이션은 최우선 (0 이 Top 1 보다도 우선)
  }));
}

/**
 * 3경로 후보 병합. 같은 app_id 가 여러 경로에서 걸리면 우선순위 규칙으로 selection_basis 선택.
 * 우선순위: case_study > revenue_top > keyword_search
 */
function mergeAllCandidates(
  grossing: CurationCandidate[],
  keyword: CurationCandidate[],
  caseStudy: CurationCandidate[]
): CurationCandidate[] {
  const priority: Record<SelectionBasis, number> = {
    case_study: 3,
    revenue_top: 2,
    keyword_search: 1,
    indie_exemplar: 0,
    commission_driven: 0,
  };

  const byAppId = new Map<string, CurationCandidate>();

  const pushOrMerge = (c: CurationCandidate) => {
    const existing = byAppId.get(c.app_id);
    if (!existing) {
      byAppId.set(c.app_id, { ...c, target_markets: [...c.target_markets] });
      return;
    }
    existing.target_markets = Array.from(
      new Set([...existing.target_markets, ...c.target_markets])
    );
    existing.source_notes = [...existing.source_notes, ...c.source_notes];
    existing.rank_signal += c.rank_signal;
    if (c.is_seed) existing.is_seed = true;
    existing.best_seed_rank = Math.min(existing.best_seed_rank, c.best_seed_rank);
    // selection_basis 는 우선순위로 덮어씀
    if (priority[c.selection_basis] > priority[existing.selection_basis]) {
      existing.selection_basis = c.selection_basis;
    }
  };

  for (const c of caseStudy) pushOrMerge(c);
  for (const c of grossing) pushOrMerge(c);
  for (const c of keyword) pushOrMerge(c);

  return Array.from(byAppId.values());
}

/**
 * 쿼터 기반 최종 선정 — basis 별 상한 + revenue_top 내부에 장르당 상한 적용.
 *
 * revenue_top 의 장르 균형: 카테고리별 매출 Top 이 섞여 있으므로
 * 장르당 상한을 두지 않으면 한 장르(예: 퍼즐·캐주얼)가 독식할 수 있음.
 * RPG·전략 같은 다른 장르가 배제되지 않도록 장르당 최대 N개로 제한.
 */
function selectByQuotas(
  all: CurationCandidate[]
): CurationCandidate[] {
  const selected: CurationCandidate[] = [];
  const count: Record<SelectionBasis, number> = {
    revenue_top: 0,
    keyword_search: 0,
    case_study: 0,
    indie_exemplar: 0,
    commission_driven: 0,
  };

  // 초기 큐레이션은 3경로만 (v2.5 이후). `indie_exemplar` · `commission_driven` 은
  // 온디맨드 확장 (library-coverage.ts) 또는 미래 확장을 위한 예약값이라 여기 등록 안 함.
  // `addIfFits` 가 limits 없는 selection_basis 는 거부하므로 초기 큐레이션에 포함 안 됨.
  const limits: Record<string, number> = {
    revenue_top: CURATION_QUOTAS.grossing,
    keyword_search: CURATION_QUOTAS.keyword_search,
    case_study: CURATION_QUOTAS.case_study,
  };

  // revenue_top 내 장르당 상한. 한 장르 독식 방지.
  const REVENUE_PER_GENRE_CAP = 5;
  const genreCount = new Map<string, number>();

  const addIfFits = (c: CurationCandidate): boolean => {
    const limit = limits[c.selection_basis];
    if (limit === undefined) return false;
    if (count[c.selection_basis] >= limit) return false;

    if (c.selection_basis === "revenue_top" && c.genre) {
      const cur = genreCount.get(c.genre) ?? 0;
      if (cur >= REVENUE_PER_GENRE_CAP) return false;
      genreCount.set(c.genre, cur + 1);
    }

    selected.push(c);
    count[c.selection_basis]++;
    return true;
  };

  // 1단계: seed 우선 포함.
  // 정렬 기준: best_seed_rank ASC (Top 1 먼저 → Top 2 → Top 3), 동률은 rank_signal DESC.
  // 이래야 각 (국가 × 장르) Top 1 이 고르게 먼저 포함되고, 남은 슬롯은 Top 2·3 중 signal 상위로.
  const seeds = all
    .filter((c) => c.is_seed)
    .sort((a, b) => {
      if (a.best_seed_rank !== b.best_seed_rank) {
        return a.best_seed_rank - b.best_seed_rank;
      }
      return b.rank_signal - a.rank_signal;
    });
  for (const c of seeds) {
    addIfFits(c);
    if (selected.length >= CURATION_QUOTAS.total) return selected;
  }

  // 2단계: 남은 쿼터를 signal 상위로 채움
  const rest = all
    .filter((c) => !c.is_seed)
    .sort((a, b) => b.rank_signal - a.rank_signal);
  for (const c of rest) {
    addIfFits(c);
    if (selected.length >= CURATION_QUOTAS.total) break;
  }

  return selected;
}

/**
 * 단건 수집·태깅 — gplay 상세 조회 + 장르 판정 + collect 위임 + 태깅 UPDATE.
 */
async function collectAndTagOne(
  admin: ReturnType<typeof createAdminClient>,
  candidate: CurationCandidate
): Promise<{ ok: boolean; tagged: boolean; error?: string }> {
  try {
    // 상세 조회 (장르·developer·monetization 정보 획득)
    const app = await gplay.app({
      appId: candidate.app_id,
      country: candidate.country,
      lang: getLangForCountry(candidate.country),
    });

    // candidate.genre 가 있으면 우선 사용 (grossing 경로는 카테고리로 이미 판정됨).
    // 없으면 gplay.app 의 genreId 로 판정.
    const normalizedGenre =
      candidate.genre ??
      normalizeGenreFromGplay(app.genreId ?? null) ??
      null;
    if (!normalizedGenre) {
      return {
        ok: false,
        tagged: false,
        error: `장르 매핑 실패 (gplay genreId: ${app.genreId ?? "null"})`,
      };
    }

    // 기존 collect 로 download + DB insert (중복이면 skip)
    await collectSpecificGames({
      genre: normalizedGenre,
      appIds: [candidate.app_id],
      country: candidate.country,
    });

    // 태깅 업데이트
    const studio_size = inferStudioSize(app.developer ?? null);

    const { data: row, error: rowErr } = await admin
      .from("reference_games")
      .select("id, monetization")
      .eq("country", candidate.country)
      .eq("app_id", candidate.app_id)
      .maybeSingle();

    if (rowErr) throw new Error(`조회 실패: ${rowErr.message}`);
    if (!row) throw new Error(`수집된 row 찾을 수 없음`);

    const monetization_model = inferMonetizationModel(
      (row.monetization ?? null) as Record<string, unknown> | null
    );

    const { error: upErr } = await admin
      .from("reference_games")
      .update({
        selection_basis: candidate.selection_basis,
        target_markets: candidate.target_markets,
        monetization_model,
        studio_size,
      })
      .eq("id", row.id);

    if (upErr) throw new Error(`태깅 UPDATE 실패: ${upErr.message}`);

    return { ok: true, tagged: true };
  } catch (e) {
    return {
      ok: false,
      tagged: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export type CurateOptions = {
  dry_run?: boolean;
  include_all_candidates?: boolean; // dry_run 디버그용: 선정 안 된 후보도 함께 반환
  onProgress?: (msg: string) => void;
};

/**
 * 전체 큐레이션 실행.
 *
 * dry_run=true 면 후보 선별까지만 수행하고 반환. 실제 스크래핑·Anthropic 호출 없음.
 */
export async function curateLibrary(
  opts: CurateOptions = {}
): Promise<CurationResult> {
  const log = (msg: string) => {
    console.log(`[curate] ${msg}`);
    opts.onProgress?.(msg);
  };

  const fetchErrors: string[] = [];

  log("매출 차트 수집 시작");
  // 카테고리당 10개 × 10 카테고리 × 3 국가 = 최대 300개 (dedupe 전)
  const grossing = await fetchGrossingCandidates(10, fetchErrors);
  log(`매출 차트 후보: ${grossing.length}개 (카테고리·dedupe 후)`);

  log("키워드 검색 수집 시작");
  const keyword = await fetchKeywordCandidates(5, fetchErrors);
  log(`키워드 검색 후보: ${keyword.length}개 (dedupe 후)`);

  const caseStudy = fetchCaseStudyCandidates();
  log(`케이스 스터디 후보: ${caseStudy.length}개`);

  const merged = mergeAllCandidates(grossing, keyword, caseStudy);
  log(`전체 후보 (3경로 병합 후): ${merged.length}개`);

  const selected = selectByQuotas(merged);
  log(`쿼터 기반 선정: ${selected.length}개`);

  const by_basis: Record<SelectionBasis, number> = {
    revenue_top: 0,
    keyword_search: 0,
    case_study: 0,
    indie_exemplar: 0,
    commission_driven: 0,
  };
  for (const s of selected) by_basis[s.selection_basis]++;

  if (opts.dry_run) {
    return {
      dry_run: true,
      candidates_before_selection: merged.length,
      selected: selected.length,
      by_basis,
      collected: 0,
      tagged: 0,
      errors: fetchErrors,
      candidates: opts.include_all_candidates ? merged : selected,
    };
  }

  log("실제 수집·태깅 시작");
  const admin = createAdminClient();
  let collected = 0;
  let tagged = 0;
  const errors: string[] = [...fetchErrors];

  for (let i = 0; i < selected.length; i++) {
    const c = selected[i];
    log(`[${i + 1}/${selected.length}] ${c.app_id} (${c.selection_basis})`);
    const r = await collectAndTagOne(admin, c);
    if (r.ok) collected++;
    if (r.tagged) tagged++;
    if (r.error) errors.push(`${c.app_id}: ${r.error}`);
  }

  return {
    dry_run: false,
    candidates_before_selection: merged.length,
    selected: selected.length,
    by_basis,
    collected,
    tagged,
    errors,
  };
}
