/**
 * /admin — 주문 목록.
 *
 * Server Component로 DB에서 직접 읽음.
 * 관리자 인증은 parent (auth) layout에서 확인됨.
 */

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import type { OrderStatus } from "@/lib/aso/status";
import { GAME_GENRES } from "@/lib/aso/constants";

const GENRE_LABEL = Object.fromEntries(GAME_GENRES.map((g) => [g.id, g.label]));

function formatKRW(krw: number | null) {
  if (krw == null) return "-";
  return new Intl.NumberFormat("ko-KR").format(krw) + "원";
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Customer = {
  name: string;
  email: string;
  studio_name: string;
};

type Order = {
  id: string;
  order_number: string;
  game_title: string;
  game_genre: string | null;
  status: OrderStatus;
  package_tier: string | null;
  price_krw: number | null;
  payment_status: string | null;
  due_date: string | null;
  created_at: string;
  customers: Customer | Customer[] | null;
};

export default async function AdminOrdersPage() {
  const admin = createAdminClient();
  const { data: orders, error } = await admin
    .from("orders")
    .select(
      `
      id, order_number, game_title, game_genre, status, package_tier,
      price_krw, payment_status, due_date, created_at,
      customers(name, email, studio_name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<Order[]>();

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">주문 관리</h1>
          <p className="mt-1 text-sm text-muted">
            접수된 ASO 주문 목록입니다. 최신순으로 100건까지 표시됩니다.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 mb-6">
            주문 조회 실패: {error.message}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-3 px-3 font-medium text-xs text-muted uppercase tracking-wide">
                  주문번호
                </th>
                <th className="py-3 px-3 font-medium text-xs text-muted uppercase tracking-wide">
                  게임
                </th>
                <th className="py-3 px-3 font-medium text-xs text-muted uppercase tracking-wide">
                  스튜디오
                </th>
                <th className="py-3 px-3 font-medium text-xs text-muted uppercase tracking-wide">
                  상태
                </th>
                <th className="py-3 px-3 font-medium text-xs text-muted uppercase tracking-wide">
                  금액
                </th>
                <th className="py-3 px-3 font-medium text-xs text-muted uppercase tracking-wide">
                  납기
                </th>
                <th className="py-3 px-3 font-medium text-xs text-muted uppercase tracking-wide">
                  접수일
                </th>
              </tr>
            </thead>
            <tbody>
              {orders?.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted text-sm"
                  >
                    아직 주문이 없습니다.
                  </td>
                </tr>
              )}
              {orders?.map((o) => {
                const customer = Array.isArray(o.customers)
                  ? o.customers[0]
                  : o.customers;
                return (
                  <tr
                    key={o.id}
                    className="border-b border-border hover:bg-surface/50 transition"
                  >
                    <td className="py-3 px-3 font-mono text-xs">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-accent-light hover:underline"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium">{o.game_title}</div>
                      <div className="text-xs text-muted">
                        {GENRE_LABEL[o.game_genre ?? ""] ?? o.game_genre ?? "-"}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-sm">{customer?.studio_name ?? "-"}</div>
                      <div className="text-xs text-muted">
                        {customer?.name ?? ""} · {customer?.email ?? ""}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <OrderStatusBadge status={o.status} />
                      {o.payment_status !== "paid" && (
                        <div className="text-[10px] text-yellow-400 mt-1">
                          결제: {o.payment_status}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-sm">{formatKRW(o.price_krw)}</td>
                    <td className="py-3 px-3 text-xs text-muted">
                      {formatDate(o.due_date)}
                    </td>
                    <td className="py-3 px-3 text-xs text-muted">
                      {formatDate(o.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
