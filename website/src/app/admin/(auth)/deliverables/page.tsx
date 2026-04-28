/**
 * /admin/deliverables — 결과물 모아보기.
 *
 * 모든 의뢰의 ASO 분석·업로드 가이드·생성 스크린샷을 한 화면에 timeline 으로.
 * 필터: 결과물 종류·장르·기간.
 */

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { GAME_GENRES } from "@/lib/aso/constants";
import { isTestEmail } from "@/lib/admin/test-data";

const GENRE_LABEL = Object.fromEntries(GAME_GENRES.map((g) => [g.id, g.label]));

const TYPE_LABEL: Record<string, string> = {
  aso_text: "ASO 텍스트",
  aso_screenshots: "스크린샷",
  aso_guide: "ASO 가이드",
  aso_analysis_report: "ASO 분석 리포트",
  upload_materials_guide: "업로드 보완 가이드",
  press_release: "보도자료",
  translation: "번역",
  editor_message: "편집장 메시지",
  package_zip: "패키지 ZIP",
};

const TYPE_BADGE_COLOR: Record<string, string> = {
  aso_analysis_report: "bg-violet-500/15 text-violet-300",
  aso_screenshots: "bg-emerald-500/15 text-emerald-300",
  upload_materials_guide: "bg-amber-500/15 text-amber-300",
  aso_text: "bg-sky-500/15 text-sky-300",
  aso_guide: "bg-violet-500/15 text-violet-300",
  press_release: "bg-rose-500/15 text-rose-300",
  translation: "bg-indigo-500/15 text-indigo-300",
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type DeliverableRow = {
  id: string;
  order_id: string;
  type: string;
  status: string | null;
  version: number | null;
  generated_at: string | null;
  content: { _meta?: { model?: string; approx_cost_usd?: number } } | null;
  orders: {
    order_number: string;
    game_title: string;
    game_genre: string | null;
    status: string;
    customers: { name: string; studio_name: string; email: string } | null;
  } | null;
};

type SearchParams = Promise<{
  type?: string;
  genre?: string;
}>;

export default async function DeliverablesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filterType = sp.type ?? "all";
  const filterGenre = sp.genre ?? "all";

  const admin = createAdminClient();

  let query = admin
    .from("deliverables")
    .select(
      `id, order_id, type, status, version, generated_at, content,
       orders(order_number, game_title, game_genre, status,
              customers(name, studio_name, email))`
    )
    .order("generated_at", { ascending: false })
    .limit(100);

  if (filterType !== "all") {
    query = query.eq("type", filterType);
  }

  const { data, error } = await query;
  const rows = (data ?? []) as unknown as DeliverableRow[];

  // Genre 필터는 메모리에서 (deliverables 테이블에 genre 없음, orders 조인 필드)
  const filtered = rows.filter((r) => {
    if (filterGenre === "all") return true;
    return r.orders?.game_genre === filterGenre;
  });

  const typeCounts: Record<string, number> = {};
  for (const r of rows) {
    typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">결과물 모아보기</h1>
        <p className="text-sm text-muted">
          모든 의뢰의 ASO 분석·업로드 가이드·생성 스크린샷을 한 곳에서 확인.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
          조회 실패: {error.message}
        </div>
      )}

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <FilterPill
          href="/admin/deliverables"
          active={filterType === "all" && filterGenre === "all"}
          label={`전체 (${rows.length})`}
        />
        {Object.entries(typeCounts).map(([type, count]) => (
          <FilterPill
            key={type}
            href={`/admin/deliverables?type=${encodeURIComponent(type)}`}
            active={filterType === type}
            label={`${TYPE_LABEL[type] ?? type} (${count})`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6 text-xs">
        <FilterPill
          href={`/admin/deliverables${filterType !== "all" ? `?type=${encodeURIComponent(filterType)}` : ""}`}
          active={filterGenre === "all"}
          label="모든 장르"
        />
        {GAME_GENRES.map((g) => (
          <FilterPill
            key={g.id}
            href={`/admin/deliverables?${new URLSearchParams({
              ...(filterType !== "all" ? { type: filterType } : {}),
              genre: g.id,
            }).toString()}`}
            active={filterGenre === g.id}
            label={g.label}
          />
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background/50 text-xs text-muted">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">생성</th>
              <th className="px-4 py-3 font-medium">주문</th>
              <th className="px-4 py-3 font-medium">게임</th>
              <th className="px-4 py-3 font-medium">결과물</th>
              <th className="px-4 py-3 font-medium">모델</th>
              <th className="px-4 py-3 font-medium">비용</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium text-right">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-muted text-sm"
                >
                  결과물이 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((d) => {
                const order = d.orders;
                const meta = d.content?._meta;
                const typeColor =
                  TYPE_BADGE_COLOR[d.type] ?? "bg-zinc-500/15 text-zinc-300";
                const isTest = isTestEmail(order?.customers?.email);
                return (
                  <tr
                    key={d.id}
                    className={`hover:bg-background/30 transition ${
                      isTest ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {formatDate(d.generated_at)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {order?.order_number ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium flex items-center gap-2">
                        {order?.game_title ?? "-"}
                        {isTest && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-500/20 text-zinc-400 font-mono">
                            TEST
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted">
                        {order?.game_genre
                          ? GENRE_LABEL[order.game_genre] ?? order.game_genre
                          : "-"}
                        {order?.customers?.studio_name &&
                          ` · ${order.customers.studio_name}`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeColor}`}
                      >
                        {TYPE_LABEL[d.type] ?? d.type}
                      </span>
                      {d.version && d.version > 1 && (
                        <span className="ml-2 text-xs text-muted">
                          v{d.version}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {meta?.model ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {meta?.approx_cost_usd != null
                        ? `$${meta.approx_cost_usd.toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {d.status ?? "draft"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${d.order_id}`}
                        className="text-accent-light hover:underline text-xs"
                      >
                        상세 →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted mt-4">
        최근 100건 표시. 더 많은 결과는 주문 상세에서 확인.
      </p>
    </main>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full border transition ${
        active
          ? "bg-accent text-white border-accent"
          : "bg-surface border-border text-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
