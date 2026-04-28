/**
 * /admin/stats — 통계 대시보드.
 *
 * 누적 의뢰 / 매출 / 처리시간 / 모델별 비용 / Library 활용도.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { GAME_GENRES } from "@/lib/aso/constants";
import { isTestEmail } from "@/lib/admin/test-data";

const GENRE_LABEL = Object.fromEntries(GAME_GENRES.map((g) => [g.id, g.label]));

function formatKRW(krw: number): string {
  return new Intl.NumberFormat("ko-KR").format(krw) + "원";
}

type OrderRow = {
  id: string;
  status: string;
  game_genre: string | null;
  package_tier: string | null;
  price_krw: number | null;
  created_at: string;
  delivered_at: string | null;
  completed_at: string | null;
  customers: { email: string } | null;
};

type DeliverableRow = {
  type: string;
  generated_at: string | null;
  content: { _meta?: { model?: string; approx_cost_usd?: number } } | null;
  orders: { customers: { email: string } | null } | null;
};

export default async function StatsPage() {
  const admin = createAdminClient();

  const [{ data: orders }, { data: deliverables }] = await Promise.all([
    admin
      .from("orders")
      .select(
        `id, status, game_genre, package_tier, price_krw, created_at, delivered_at, completed_at,
         customers(email)`
      ),
    admin
      .from("deliverables")
      .select(`type, generated_at, content,
               orders(customers(email))`),
  ]);

  // 테스트 고객 필터 — 운영 통계만
  const allOrders = (orders ?? []) as unknown as OrderRow[];
  const allDeliverables = (deliverables ?? []) as unknown as DeliverableRow[];
  const orderRows = allOrders.filter(
    (o) => !isTestEmail(o.customers?.email)
  );
  const deliverableRows = allDeliverables.filter(
    (d) => !isTestEmail(d.orders?.customers?.email)
  );
  const testOrderCount = allOrders.length - orderRows.length;
  const testDeliverableCount = allDeliverables.length - deliverableRows.length;

  // 의뢰 통계
  const totalOrders = orderRows.length;
  const byStatus: Record<string, number> = {};
  for (const o of orderRows) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

  const totalRevenue = orderRows.reduce(
    (s, o) => s + (o.price_krw ?? 0),
    0
  );
  const completedRevenue = orderRows
    .filter((o) => o.status === "completed" || o.status === "delivered")
    .reduce((s, o) => s + (o.price_krw ?? 0), 0);

  // 처리시간 평균 (delivered 기준)
  const deliveredOrders = orderRows.filter((o) => o.delivered_at);
  const avgHours =
    deliveredOrders.length === 0
      ? 0
      : deliveredOrders.reduce((sum, o) => {
          const start = new Date(o.created_at).getTime();
          const end = new Date(o.delivered_at!).getTime();
          return sum + (end - start) / (1000 * 60 * 60);
        }, 0) / deliveredOrders.length;

  // 장르 분포
  const byGenre: Record<string, number> = {};
  for (const o of orderRows) {
    const g = o.game_genre ?? "unknown";
    byGenre[g] = (byGenre[g] ?? 0) + 1;
  }

  // 결과물 통계
  const totalDeliverables = deliverableRows.length;
  const byType: Record<string, number> = {};
  for (const d of deliverableRows) {
    byType[d.type] = (byType[d.type] ?? 0) + 1;
  }

  // 모델별 비용
  const modelCosts: Record<string, { count: number; cost: number }> = {};
  for (const d of deliverableRows) {
    const meta = d.content?._meta;
    if (!meta?.model) continue;
    const k = meta.model;
    if (!modelCosts[k]) modelCosts[k] = { count: 0, cost: 0 };
    modelCosts[k].count++;
    modelCosts[k].cost += meta.approx_cost_usd ?? 0;
  }
  const totalCostUsd = Object.values(modelCosts).reduce(
    (s, v) => s + v.cost,
    0
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">통계 대시보드</h1>
        <p className="text-sm text-muted">
          운영 누적 의뢰 · 매출 · 처리시간 · 모델별 비용.
          {(testOrderCount > 0 || testDeliverableCount > 0) && (
            <span className="ml-2 text-zinc-500">
              (테스트 의뢰 {testOrderCount}건 · 결과물 {testDeliverableCount}건 제외)
            </span>
          )}
        </p>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="누적 의뢰" value={totalOrders} />
        <SummaryCard label="확정 매출" value={formatKRW(completedRevenue)} />
        <SummaryCard
          label="평균 처리시간"
          value={
            avgHours === 0 ? "-" : `${avgHours.toFixed(1)}h`
          }
        />
        <SummaryCard label="결과물" value={totalDeliverables} />
      </div>

      {/* 의뢰 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <section className="bg-surface border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">의뢰 상태</h2>
          {Object.keys(byStatus).length === 0 ? (
            <p className="text-sm text-muted">의뢰 없음</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(byStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3 text-sm">
                    <span className="w-28 text-muted">{status}</span>
                    <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{
                          width: `${(count / totalOrders) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-xs">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>

        <section className="bg-surface border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">장르별 의뢰</h2>
          {Object.keys(byGenre).length === 0 ? (
            <p className="text-sm text-muted">의뢰 없음</p>
          ) : (
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
                        className="h-full bg-accent-light"
                        style={{
                          width: `${(count / totalOrders) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-xs">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>

      {/* 모델별 비용 */}
      <section className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">
          모델별 비용
          <span className="ml-3 text-xs text-muted">
            누적 ${totalCostUsd.toFixed(2)}
          </span>
        </h2>
        {Object.keys(modelCosts).length === 0 ? (
          <p className="text-sm text-muted">분석 결과물 없음</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-muted">
              <tr className="text-left border-b border-border">
                <th className="px-2 py-2 font-medium">모델</th>
                <th className="px-2 py-2 font-medium">호출 수</th>
                <th className="px-2 py-2 font-medium">누적 비용</th>
                <th className="px-2 py-2 font-medium">호출당 평균</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(modelCosts)
                .sort((a, b) => b[1].cost - a[1].cost)
                .map(([model, v]) => (
                  <tr key={model}>
                    <td className="px-2 py-2 text-xs">{model}</td>
                    <td className="px-2 py-2 text-xs font-mono">{v.count}</td>
                    <td className="px-2 py-2 text-xs font-mono">
                      ${v.cost.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-xs font-mono">
                      ${(v.cost / v.count).toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 결과물 종류 */}
      <section className="bg-surface border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-3">결과물 종류</h2>
        {Object.keys(byType).length === 0 ? (
          <p className="text-sm text-muted">결과물 없음</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {Object.entries(byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between px-3 py-2 bg-background rounded border border-border text-xs"
                >
                  <span>{type}</span>
                  <span className="font-mono text-muted">{count}</span>
                </div>
              ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
