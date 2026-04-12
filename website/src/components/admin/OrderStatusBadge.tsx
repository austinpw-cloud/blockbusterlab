/**
 * 주문 상태를 색상 뱃지로 표시.
 */

import { STATUS_META, type OrderStatus } from "@/lib/aso/status";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs rounded border font-medium ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}
