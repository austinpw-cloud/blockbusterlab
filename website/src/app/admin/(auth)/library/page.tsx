/**
 * /admin/library — Reference Library 현황.
 *
 * 수집된 게임 / 분석 진행 / 합성된 패턴(axis별) / 커버리지 갭 한눈에.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { GAME_GENRES } from "@/lib/aso/constants";

const GENRE_LABEL = Object.fromEntries(GAME_GENRES.map((g) => [g.id, g.label]));

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "bg-emerald-500/15 text-emerald-300",
  medium: "bg-amber-500/15 text-amber-300",
  low: "bg-zinc-500/15 text-zinc-300",
};

type GameRow = {
  genre: string;
  country: string;
  target_markets: string[] | null;
  selection_basis: string | null;
  studio_size: string | null;
  icon_analyzed_at: string | null;
  text_analyzed_at: string | null;
  aso_analyzed_at: string | null;
};

type PatternRow = {
  axis_key: string;
  genre: string;
  market: string | null;
  monetization_model: string | null;
  studio_size: string | null;
  sample_size: number;
  confidence: "high" | "medium" | "low";
  synthesized_at: string;
};

export default async function LibraryPage() {
  const admin = createAdminClient();

  const [{ data: games }, { data: patterns }, { count: screenshotCount }] =
    await Promise.all([
      admin
        .from("reference_games")
        .select(
          "genre, country, target_markets, selection_basis, studio_size, icon_analyzed_at, text_analyzed_at, aso_analyzed_at"
        ),
      admin
        .from("library_patterns")
        .select("*")
        .order("sample_size", { ascending: false }),
      admin
        .from("reference_screenshots")
        .select("*", { count: "exact", head: true }),
    ]);

  const gameRows = (games ?? []) as GameRow[];
  const patternRows = (patterns ?? []) as PatternRow[];

  // 장르별 집계
  const byGenre: Record<string, number> = {};
  const iconDone = gameRows.filter((g) => g.icon_analyzed_at).length;
  const textDone = gameRows.filter((g) => g.text_analyzed_at).length;
  const asoDone = gameRows.filter((g) => g.aso_analyzed_at).length;
  const incompleteTagging = gameRows.filter(
    (g) => !g.target_markets || !g.selection_basis || !g.studio_size
  ).length;

  for (const g of gameRows) {
    byGenre[g.genre] = (byGenre[g.genre] ?? 0) + 1;
  }

  // 선별 근거별 집계
  const byBasis: Record<string, number> = {};
  for (const g of gameRows) {
    const k = g.selection_basis ?? "(미태깅)";
    byBasis[k] = (byBasis[k] ?? 0) + 1;
  }

  // confidence 별 패턴 집계
  const byConfidence: Record<string, number> = { high: 0, medium: 0, low: 0 };
  for (const p of patternRows) {
    byConfidence[p.confidence] = (byConfidence[p.confidence] ?? 0) + 1;
  }

  // 커버리지: 장르가 있는데 axis 패턴이 없는 (genre, market) 조합
  const genreMarketCovered = new Set(
    patternRows
      .filter((p) => p.market)
      .map((p) => `${p.genre}|${p.market}`)
  );
  const genreMarketCounts: Record<string, number> = {};
  for (const g of gameRows) {
    const markets = g.target_markets ?? [];
    for (const m of markets) {
      genreMarketCounts[`${g.genre}|${m}`] =
        (genreMarketCounts[`${g.genre}|${m}`] ?? 0) + 1;
    }
  }
  const gaps = Object.entries(genreMarketCounts)
    .filter(([key]) => !genreMarketCovered.has(key))
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Reference Library 현황</h1>
        <p className="text-sm text-muted">
          수집된 게임 · 분석 진행 · 축 조합별 패턴 · 커버리지 갭 한눈에.
        </p>
      </div>

      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="게임" value={gameRows.length} />
        <SummaryCard
          label="스크린샷"
          value={screenshotCount ?? 0}
        />
        <SummaryCard label="합성 패턴" value={patternRows.length} />
        <SummaryCard
          label="L2 분석 완료"
          value={`${asoDone}/${gameRows.length}`}
          tone={asoDone === gameRows.length ? "ok" : "warn"}
        />
      </div>

      {/* 분석 진행 */}
      <section className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">L1 분석 진행</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <ProgressBar
            label="아이콘 분석"
            done={iconDone}
            total={gameRows.length}
          />
          <ProgressBar
            label="텍스트 분석"
            done={textDone}
            total={gameRows.length}
          />
          <ProgressBar
            label="L2 합성"
            done={asoDone}
            total={gameRows.length}
          />
        </div>
        {incompleteTagging > 0 && (
          <p className="text-xs text-amber-400 mt-3">
            ⚠️ 메타 태깅 미완 게임 {incompleteTagging}건 (target_markets / selection_basis / studio_size 누락)
          </p>
        )}
      </section>

      {/* 합성 패턴 */}
      <section className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">
          합성 패턴 ({patternRows.length})
          <span className="ml-3 text-xs text-muted">
            high {byConfidence.high} · medium {byConfidence.medium} · low {byConfidence.low}
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted">
              <tr className="text-left border-b border-border">
                <th className="px-2 py-2 font-medium">장르</th>
                <th className="px-2 py-2 font-medium">시장</th>
                <th className="px-2 py-2 font-medium">수익</th>
                <th className="px-2 py-2 font-medium">규모</th>
                <th className="px-2 py-2 font-medium">표본</th>
                <th className="px-2 py-2 font-medium">신뢰도</th>
                <th className="px-2 py-2 font-medium">합성일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patternRows.map((p) => (
                <tr key={p.axis_key}>
                  <td className="px-2 py-2 font-medium">
                    {GENRE_LABEL[p.genre] ?? p.genre}
                  </td>
                  <td className="px-2 py-2 text-xs">{p.market ?? "*"}</td>
                  <td className="px-2 py-2 text-xs text-muted">
                    {p.monetization_model ?? "*"}
                  </td>
                  <td className="px-2 py-2 text-xs text-muted">
                    {p.studio_size ?? "*"}
                  </td>
                  <td className="px-2 py-2 text-xs font-mono">
                    n={p.sample_size}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        CONFIDENCE_COLOR[p.confidence]
                      }`}
                    >
                      {p.confidence}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-muted">
                    {new Date(p.synthesized_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 장르 분포 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">장르 분포</h2>
          <div className="space-y-2">
            {Object.entries(byGenre)
              .sort((a, b) => b[1] - a[1])
              .map(([genre, count]) => (
                <div key={genre} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-muted">
                    {GENRE_LABEL[genre] ?? genre}
                  </span>
                  <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{
                        width: `${(count / gameRows.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-xs">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">선별 근거</h2>
          <div className="space-y-2">
            {Object.entries(byBasis)
              .sort((a, b) => b[1] - a[1])
              .map(([basis, count]) => (
                <div key={basis} className="flex items-center gap-3 text-sm">
                  <span className="w-32 text-muted">{basis}</span>
                  <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-light"
                      style={{
                        width: `${(count / gameRows.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-xs">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* 커버리지 갭 */}
      <section className="bg-surface border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-3">
          커버리지 갭 ({gaps.length})
        </h2>
        <p className="text-xs text-muted mb-3">
          게임은 있지만 axis 합성 안 된 (장르 × 시장) 조합. 의뢰 시 fallback 광역 적용.
        </p>
        {gaps.length === 0 ? (
          <p className="text-sm text-muted">갭 없음 — 모든 (장르 × 시장) 조합 커버.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {gaps.map(([key, count]) => {
              const [genre, market] = key.split("|");
              return (
                <div
                  key={key}
                  className="flex items-center justify-between px-3 py-2 bg-background rounded border border-border"
                >
                  <span>
                    {GENRE_LABEL[genre] ?? genre} · {market}
                  </span>
                  <span className="font-mono text-muted">n={count}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "ok" | "warn";
}) {
  const ring =
    tone === "ok"
      ? "border-emerald-500/30"
      : tone === "warn"
        ? "border-amber-500/30"
        : "border-border";
  return (
    <div className={`bg-surface border ${ring} rounded-xl p-4`}>
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ProgressBar({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="font-mono">
          {done}/{total} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 bg-background rounded-full overflow-hidden">
        <div
          className={`h-full ${
            pct === 100
              ? "bg-emerald-500"
              : pct >= 50
                ? "bg-accent"
                : "bg-amber-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
