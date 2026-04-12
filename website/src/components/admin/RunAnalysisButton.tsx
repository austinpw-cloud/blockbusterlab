"use client";

/**
 * [ASO 분석 실행] 버튼.
 * 클릭 시 Server Action 호출 → Opus 분석 → 결과 저장.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runAsoAnalysis } from "@/app/admin/(auth)/orders/[orderId]/actions";

type Props = {
  orderId: string;
  hasExistingResult: boolean;
};

export function RunAnalysisButton({ orderId, hasExistingResult }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function handleClick() {
    if (hasExistingResult) {
      if (
        !confirm(
          "이미 분석 결과가 있습니다. 다시 실행하면 새 버전으로 생성됩니다. 계속하시겠습니까?"
        )
      ) {
        return;
      }
    } else {
      if (!confirm("ASO 분석을 실행하시겠습니까? Opus 4.6 호출 (~$0.30)")) {
        return;
      }
    }

    setError(null);
    setInfo("분석 진행 중... 20~40초 소요됩니다.");

    startTransition(async () => {
      const result = await runAsoAnalysis(orderId);
      if (!result.ok) {
        setError(result.error ?? "분석 실패");
        setInfo(null);
      } else {
        setInfo(
          `분석 완료 (비용: $${result.cost_usd?.toFixed(4) ?? "-"})`
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full py-2.5 px-4 bg-accent hover:bg-accent-light text-white rounded-lg font-medium text-sm transition disabled:opacity-50 disabled:cursor-wait"
      >
        {isPending
          ? "분석 중..."
          : hasExistingResult
            ? "재분석 실행"
            : "ASO 분석 실행"}
      </button>

      {info && (
        <div className="text-xs text-accent-light">{info}</div>
      )}
      {error && (
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
