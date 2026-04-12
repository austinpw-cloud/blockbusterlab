/**
 * Library Coverage — 의뢰 게임에 대한 Reference Library 커버리지 판정 및 엄선 보완.
 *
 * 핵심 설계 (사용자 확정, 2026-04-13):
 *   - Library는 장르별 Top 10 게임 분석이 기본 규모 (Supabase Free 용량 한계).
 *   - 의뢰 게임 처리 시:
 *     1. Library의 해당 장르 분석 데이터 로드.
 *     2. Opus가 "이 의뢰 게임의 ASO 품질을 커버할 수 있는가" 판단.
 *     3. 부족하면 의뢰 게임의 성격·경쟁력 부각 관점에서 **엄선한** 추가
 *        벤치마크 게임 2~3개를 지정 (단순 Top 스크래핑 금지).
 *     4. 수집·Vision 분석 후 reference_games / reference_screenshots 에 영구 upsert.
 *     5. 보강된 데이터를 반환.
 *   - 결과: Library는 의뢰를 처리할수록 유기적으로 풍부해진다.
 *
 * 이 모듈은 Judge(평가)와 Overlay-Design(제작) 모듈이 공통으로 사용하는
 * "장르 품질 기준 데이터"를 제공한다.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { complete, parseJsonResponse } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import { collectSpecificGames } from "@/lib/reference-library/collect";
import { analyzeUnanalyzedScreenshots } from "@/lib/reference-library/analyze";
import type { AsoResult } from "@/lib/ai/aso-analyzer";

const BUCKET = "reference-library";
const MIN_REFERENCE_SCREENSHOTS = 20; // 이 미만이면 자동으로 커버리지 판단 "부족"

/** Opus 4.6 단가 */
function estimateOpusCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 15 + (outputTokens / 1_000_000) * 75;
}

export type ReferenceGameSummary = {
  id: string;
  app_id: string;
  title: string;
  developer: string | null;
  rating: number | null;
  installs: string | null;
  rank_position: number | null;
  short_description: string | null;
};

export type ReferenceScreenshotSummary = {
  id: string;
  game_id: string;
  game_title: string;
  slot_number: number;
  storage_path: string;
  signed_url?: string;
  analysis: Record<string, unknown> | null;
};

export type LibraryCoverage = {
  genre: string;
  games: ReferenceGameSummary[];
  screenshots: ReferenceScreenshotSummary[];
  augmentation?: {
    selected_references: Array<{
      app_id: string;
      title: string;
      why_selected: string;
    }>;
    reason: string;
    cost_usd: number;
  };
};

/**
 * 주어진 장르의 현재 Library 데이터 조회.
 * signed URL 은 별도 함수로 분리 (Vision 입력용).
 */
async function loadLibraryForGenre(
  admin: ReturnType<typeof createAdminClient>,
  genre: string,
  country: string
): Promise<{
  games: ReferenceGameSummary[];
  screenshots: ReferenceScreenshotSummary[];
}> {
  const { data: games, error: gameErr } = await admin
    .from("reference_games")
    .select(
      "id, app_id, title, developer, rating, installs, rank_position, short_description"
    )
    .eq("genre", genre)
    .eq("country", country)
    .order("rank_position", { ascending: true });

  if (gameErr) {
    throw new Error(`reference_games 조회 실패: ${gameErr.message}`);
  }

  const gameRows = (games ?? []) as ReferenceGameSummary[];
  if (gameRows.length === 0) {
    return { games: [], screenshots: [] };
  }

  const gameIds = gameRows.map((g) => g.id);
  const titleById = new Map(gameRows.map((g) => [g.id, g.title]));

  const { data: shots, error: shotErr } = await admin
    .from("reference_screenshots")
    .select("id, game_id, slot_number, storage_path, analysis")
    .in("game_id", gameIds)
    .not("analysis", "is", null)
    .order("game_id")
    .order("slot_number");

  if (shotErr) {
    throw new Error(`reference_screenshots 조회 실패: ${shotErr.message}`);
  }

  const screenshots: ReferenceScreenshotSummary[] = (shots ?? []).map(
    (s) =>
      ({
        id: s.id,
        game_id: s.game_id,
        game_title: titleById.get(s.game_id) ?? "(unknown)",
        slot_number: s.slot_number,
        storage_path: s.storage_path,
        analysis: s.analysis as Record<string, unknown> | null,
      }) satisfies ReferenceScreenshotSummary
  );

  return { games: gameRows, screenshots };
}

/**
 * 레퍼런스 스크린샷에 signed URL 붙이기 (Vision 입력용).
 * 호출부가 필요할 때만 씀.
 */
export async function attachSignedUrls(
  admin: ReturnType<typeof createAdminClient>,
  screenshots: ReferenceScreenshotSummary[],
  maxCount = 12
): Promise<ReferenceScreenshotSummary[]> {
  const limited = screenshots.slice(0, maxCount);
  return Promise.all(
    limited.map(async (s) => {
      const { data } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(s.storage_path, 3600);
      return { ...s, signed_url: data?.signedUrl };
    })
  );
}

type CoverageJudgment = {
  verdict: "sufficient" | "insufficient";
  reasoning: string;
  needs_augmentation: boolean;
  augmentation_targets?: Array<{
    app_id?: string; // Google Play package id (알고 있으면)
    search_query?: string; // 또는 Google Play 검색어
    game_name_hint: string;
    why_selected: string;
  }>;
};

const COVERAGE_SYSTEM_PROMPT = `당신은 블록버스터랩의 ASO 수석 전략가입니다.
의뢰받은 인디 게임의 ASO 스크린샷 품질 기준을 설계하기 위해,
현재 Reference Library가 충분한지 판단합니다.

## 판단 원칙

1. Library는 장르별 Top 차트를 근간으로 구축된 품질 기준입니다.
2. 하지만 의뢰 게임마다 고유 경쟁력이 있습니다.
   - 레트로 픽셀 감성, 힐링/감성 내러티브, 오프라인 싱글플레이 등.
3. Library의 장르 Top이 "이 의뢰 게임을 돋보이게 하는 레퍼런스"로
   충분하지 않다면, 의뢰 게임의 성격·차별점에 매칭되는 추가 벤치마크가 필요합니다.
4. 추가 벤치마크는 **엄선**되어야 합니다 — 단순 Top 차트 확장 금지.
   구체적 이유를 들어 지정하세요. (예: "이 게임이 도트 감성이므로
   Dead Cells의 스크린샷 카피 설계가 레퍼런스로 필요")
5. 최신 트렌드나 잘하는 게임을 팔로우업해야 합니다. ASO 문서의 권장은
   일반 가이드일 뿐, 이 의뢰 게임에 맞는 레퍼런스를 선정하세요.

## 출력 형식

반드시 아래 JSON만 출력. 코드 블록 없이 순수 JSON.

{
  "verdict": "sufficient" | "insufficient",
  "reasoning": "2-4문장으로 판단 근거",
  "needs_augmentation": boolean,
  "augmentation_targets": [
    {
      "app_id": "com.example.app (알고 있을 때만)",
      "search_query": "또는 Google Play 검색어",
      "game_name_hint": "게임 이름",
      "why_selected": "이 의뢰 게임과 매칭되는 구체적 이유 1-2문장"
    }
  ]
}

augmentation_targets는 필요 없으면 빈 배열. 있다면 최대 3개까지.`;

function buildCoveragePrompt(opts: {
  analysis: AsoResult;
  game_title: string;
  game_genre: string;
  current_games: ReferenceGameSummary[];
  current_screenshot_count: number;
}): string {
  const a = opts.analysis;
  const currentList = opts.current_games
    .slice(0, 15)
    .map(
      (g, i) =>
        `${i + 1}. ${g.title} (${g.app_id}) — rank ${g.rank_position ?? "?"}`
    )
    .join("\n");

  return `## 의뢰 게임

- 제목: ${opts.game_title}
- 장르 ID: ${opts.game_genre}

### ASO 분석 요약
- Unique Value Proposition: ${a.game_analysis.unique_value_proposition}
- 강점: ${a.game_analysis.specific_strengths.slice(0, 4).join(" / ")}
- 타겟 페르소나: ${a.game_analysis.target_persona.who}
- 첫인상 목표: ${a.game_analysis.first_impression_goal}
- 포지셔닝 thesis: ${a.positioning_strategy.thesis}

---

## 현재 Reference Library ("${opts.game_genre}" 장르)

- 분석된 게임: ${opts.current_games.length}개
- 분석된 스크린샷: ${opts.current_screenshot_count}장

### 현재 라이브러리 게임 목록
${currentList || "(없음)"}

---

## 질문

현재 Library로 이 의뢰 게임의 ASO 스크린샷 품질 기준을 설계할 수 있습니까?
- 장르 Top 중심의 Library가 이 게임의 고유 경쟁력을 돋보이게 할 수 있는가?
- 이 게임의 성격(예: 도트/힐링/내러티브/콘솔 이식 등)을 잘 보여주려면
  추가로 어떤 게임을 벤치마크해야 하는가?

JSON 스키마대로만 출력.`;
}

/**
 * Opus로 커버리지 판정 + 보완 대상 선정.
 */
async function judgeCoverageAndSelect(opts: {
  analysis: AsoResult;
  game_title: string;
  game_genre: string;
  current_games: ReferenceGameSummary[];
  current_screenshot_count: number;
}): Promise<{ judgment: CoverageJudgment; cost_usd: number }> {
  const completion = await complete({
    model: MODELS.OPUS,
    system: COVERAGE_SYSTEM_PROMPT,
    userMessage: buildCoveragePrompt(opts),
    maxTokens: 4000,
    temperature: 0.4,
  });

  const judgment = parseJsonResponse<CoverageJudgment>(completion.text);
  const cost = estimateOpusCost(
    completion.input_tokens,
    completion.output_tokens
  );

  return { judgment, cost_usd: cost };
}

/**
 * Google Play 검색어로 app_id 후보 추출.
 */
async function resolveSearchQueryToAppId(
  query: string,
  country = "kr",
  lang?: string
): Promise<string | null> {
  const { default: gplay } = await import("google-play-scraper");
  const { getLangForCountry } = await import("@/lib/scraper/competitor-fetch");
  try {
    const results = await gplay.search({
      term: query,
      num: 1,
      country,
      lang: lang ?? getLangForCountry(country),
      fullDetail: false,
    });
    return results[0]?.appId ?? null;
  } catch {
    return null;
  }
}

/**
 * 커버리지 판정 + (필요 시) 엄선 보완 + Library 업데이트 후 최신 데이터 반환.
 *
 * 주의: 보완 단계에서 collect + analyze 가 동기적으로 돌아가므로
 * 시간이 걸림 (~게임당 30초). 주문 파이프라인에서는 백그라운드 잡으로
 * 돌리거나, 분석 단계에서 미리 호출해두는 방식이 바람직.
 */
/**
 * Library 가 충분히 구축되지 않은 (country, genre) 로 주문이 들어왔을 때 throw.
 *
 * 원칙: Reference Library 는 의뢰 처리 전에 관리자가 미리 구축해둬야 하는 자산.
 * 단순 Top 차트 자동 수집 fallback 은 "단순 Top 스크래핑 금지, 엄선 원칙"에 위배되므로 허용 안 함.
 */
export class LibraryNotReadyError extends Error {
  constructor(
    public genre: string,
    public country: string,
    public detail: string
  ) {
    super(
      `[${country}/${genre}] Reference Library가 아직 충분히 구축되지 않았습니다. ${detail} ` +
        `Supabase 관리자 도구로 해당 (country, genre) Library 를 먼저 수집·분석하세요.`
    );
    this.name = "LibraryNotReadyError";
  }
}

export async function getLibraryCoverage(opts: {
  analysis: AsoResult;
  game_title: string;
  game_genre: string;
  country?: string; // 기본 'kr'. 타겟 시장에 따라 'us', 'jp' 등
  skip_augmentation?: boolean; // 테스트·빠른 경로용
}): Promise<LibraryCoverage & { judgment_cost_usd: number }> {
  const admin = createAdminClient();
  const country = opts.country ?? "kr";

  // 1. 현재 Library 로드 (해당 국가·장르)
  let { games, screenshots } = await loadLibraryForGenre(
    admin,
    opts.game_genre,
    country
  );

  // 2. Library 구축 상태 검증 — 부족하면 즉시 에러
  //    의도적으로 자동 Top 3 fallback 을 두지 않는다. Library 는 사전에 엄선 수집돼야 함.
  if (games.length === 0) {
    throw new LibraryNotReadyError(
      opts.game_genre,
      country,
      `해당 장르×국가의 게임이 0개입니다.`
    );
  }
  if (screenshots.length < MIN_REFERENCE_SCREENSHOTS) {
    throw new LibraryNotReadyError(
      opts.game_genre,
      country,
      `분석된 스크린샷이 ${screenshots.length}장 (최소 ${MIN_REFERENCE_SCREENSHOTS}장 필요). ` +
        `게임 ${games.length}개는 수집됐지만 Vision 분석이 완료되지 않았습니다.`
    );
  }

  let augmentation: LibraryCoverage["augmentation"] | undefined;
  let judgmentCost = 0;

  if (!opts.skip_augmentation) {
    // 3. Opus 판정 — 기존 Library 가 이 의뢰 게임에 충분한지
    const r = await judgeCoverageAndSelect({
      analysis: opts.analysis,
      game_title: opts.game_title,
      game_genre: opts.game_genre,
      current_games: games,
      current_screenshot_count: screenshots.length,
    });
    const judgment = r.judgment;
    judgmentCost = r.cost_usd;

    // 4. 엄선 보완 실행 (AI 가 지정한 타겟만 — 자동 Top 3 없음)
    if (judgment.needs_augmentation) {
      const targets = judgment.augmentation_targets ?? [];
      const selected: Array<{
        app_id: string;
        title: string;
        why_selected: string;
      }> = [];

      const appIds: string[] = [];

      // AI가 지정한 타겟 resolve
      for (const t of targets) {
        let appId = t.app_id ?? null;
        if (!appId && t.search_query) {
          appId = await resolveSearchQueryToAppId(t.search_query, country);
        }
        if (!appId) continue;
        if (appIds.includes(appId)) continue;
        appIds.push(appId);
        selected.push({
          app_id: appId,
          title: t.game_name_hint,
          why_selected: t.why_selected,
        });
      }

      if (appIds.length > 0) {
        console.log(
          `[library-coverage] 보완 수집 시작 — ${appIds.length}개 (${appIds.join(", ")})`
        );

        // 5. 수집 (기존 게임은 collect 내부에서 스킵됨)
        await collectSpecificGames({
          genre: opts.game_genre,
          appIds,
          country,
        });

        // 6. 신규 스크린샷 분석 (이 country 범위만)
        const analyzeRes = await analyzeUnanalyzedScreenshots(
          null,
          opts.game_genre,
          country
        );

        console.log(
          `[library-coverage] 보완 분석 완료 — ${analyzeRes.analyzed}장, $${analyzeRes.total_cost_usd.toFixed(4)}`
        );

        // 7. Library 다시 로드
        const reloaded = await loadLibraryForGenre(
          admin,
          opts.game_genre,
          country
        );
        games = reloaded.games;
        screenshots = reloaded.screenshots;

        augmentation = {
          selected_references: selected,
          reason: judgment.reasoning,
          cost_usd: analyzeRes.total_cost_usd,
        };
      }
    }
  }

  return {
    genre: opts.game_genre,
    games,
    screenshots,
    augmentation,
    judgment_cost_usd: judgmentCost,
  };
}
