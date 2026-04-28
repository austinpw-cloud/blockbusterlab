/**
 * /admin/customers — 고객 관리.
 *
 * 고객별 의뢰 이력·총 매출·마지막 의뢰일 한눈에.
 */

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

function formatKRW(krw: number | null): string {
  if (krw == null || krw === 0) return "-";
  return new Intl.NumberFormat("ko-KR").format(krw) + "원";
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

type CustomerRow = {
  id: string;
  email: string;
  name: string;
  studio_name: string;
  phone: string | null;
  country: string | null;
  created_at: string;
  orders: Array<{
    id: string;
    order_number: string;
    game_title: string;
    status: string;
    price_krw: number | null;
    created_at: string;
  }> | null;
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-zinc-500/15 text-zinc-300",
  in_progress: "bg-sky-500/15 text-sky-300",
  delivered: "bg-emerald-500/15 text-emerald-300",
  completed: "bg-violet-500/15 text-violet-300",
  cancelled: "bg-red-500/15 text-red-300",
};

export default async function CustomersPage() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("customers")
    .select(
      `id, email, name, studio_name, phone, country, created_at,
       orders(id, order_number, game_title, status, price_krw, created_at)`
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as CustomerRow[];

  // 누적 통계
  const totalCustomers = rows.length;
  const totalOrders = rows.reduce((sum, c) => sum + (c.orders?.length ?? 0), 0);
  const totalRevenue = rows.reduce(
    (sum, c) =>
      sum + (c.orders ?? []).reduce((s, o) => s + (o.price_krw ?? 0), 0),
    0
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">고객 관리</h1>
        <p className="text-sm text-muted">
          고객별 의뢰 이력 · 연락처 · 누적 매출.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
          조회 실패: {error.message}
        </div>
      )}

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="고객" value={totalCustomers} />
        <SummaryCard label="누적 의뢰" value={totalOrders} />
        <SummaryCard label="누적 매출" value={formatKRW(totalRevenue)} />
      </div>

      {/* 고객 목록 */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background/50 text-xs text-muted">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">고객</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">의뢰 수</th>
              <th className="px-4 py-3 font-medium">매출</th>
              <th className="px-4 py-3 font-medium">최근 의뢰</th>
              <th className="px-4 py-3 font-medium">가입</th>
              <th className="px-4 py-3 font-medium text-right">최근 의뢰 게임</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted text-sm"
                >
                  등록된 고객이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((c) => {
                const orders = c.orders ?? [];
                const revenue = orders.reduce(
                  (s, o) => s + (o.price_krw ?? 0),
                  0
                );
                const latest = orders.sort((a, b) =>
                  b.created_at.localeCompare(a.created_at)
                )[0];
                return (
                  <tr key={c.id} className="hover:bg-background/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted">
                        {c.studio_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{c.email}</div>
                      <div className="text-xs text-muted">{c.phone ?? "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {orders.length}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {formatKRW(revenue)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {latest ? formatDate(latest.created_at) : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {latest ? (
                        <Link
                          href={`/admin/orders/${latest.id}`}
                          className="text-accent-light hover:underline text-xs"
                        >
                          {latest.game_title} →
                        </Link>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted mt-4">
        최근 100명 표시.
      </p>
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
