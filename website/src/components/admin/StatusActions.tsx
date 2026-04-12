"use client";

/**
 * 주문 상태 변경 버튼 그룹.
 * 현재 상태에 따라 전환 가능한 다음 상태들만 버튼으로 표시.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type OrderStatus, NEXT_STATUSES, STATUS_META } from "@/lib/aso/status";
import {
  updateOrderStatus,
  updatePaymentStatus,
} from "@/app/admin/(auth)/orders/[orderId]/actions";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: string | null;
};

export function StatusActions({
  orderId,
  currentStatus,
  currentPaymentStatus,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextOptions = NEXT_STATUSES[currentStatus] ?? [];

  function handleStatusChange(next: OrderStatus) {
    if (!confirm(`상태를 '${STATUS_META[next].label}'로 변경하시겠습니까?`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (!result.ok) {
        setError(result.error ?? "상태 변경 실패");
      } else {
        router.refresh();
      }
    });
  }

  function handlePaymentChange(next: "pending" | "paid" | "refunded") {
    setError(null);
    startTransition(async () => {
      const result = await updatePaymentStatus(orderId, next);
      if (!result.ok) {
        setError(result.error ?? "결제 상태 변경 실패");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      <div>
        <div className="text-xs text-muted mb-2">다음 상태로</div>
        {nextOptions.length === 0 ? (
          <div className="text-xs text-muted italic">
            이 상태에서는 더 이상 전환 불가
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {nextOptions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange(s)}
                className="text-xs px-3 py-1.5 rounded border border-border hover:border-accent-light hover:bg-accent/10 transition disabled:opacity-50"
              >
                → {STATUS_META[s].label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border">
        <div className="text-xs text-muted mb-2">결제 상태</div>
        <div className="flex flex-wrap gap-2">
          {(["pending", "paid", "refunded"] as const).map((p) => (
            <button
              key={p}
              type="button"
              disabled={isPending || currentPaymentStatus === p}
              onClick={() => handlePaymentChange(p)}
              className={`text-xs px-3 py-1.5 rounded border transition disabled:opacity-50 ${
                currentPaymentStatus === p
                  ? "border-accent-light bg-accent/20 text-accent-light"
                  : "border-border hover:border-accent-light"
              }`}
            >
              {p === "pending" ? "미결제" : p === "paid" ? "결제완료" : "환불"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
