"use client";

/**
 * 스토어 스크린샷 제작 트리거 — 평가 → 분기(가이드 | 제작) 오케스트레이션 호출.
 *
 * 판정 결과에 따라 자동으로:
 *   - insufficient → 업로드 가이드 마크다운 생성
 *   - partial/sufficient → Overlay 디자인 + composite PNG 세트 생성
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateStoreScreenshots } from "@/app/admin/(auth)/orders/[orderId]/actions";

type Props = {
  orderId: string;
  hasAnalysis: boolean;
  hasExistingScreenshots: boolean;
  hasExistingGuide: boolean;
};

export function GenerateScreenshotsButton({
  orderId,
  hasAnalysis,
  hasExistingScreenshots,
  hasExistingGuide,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const hasAnyResult = hasExistingScreenshots || hasExistingGuide;

  function handleClick() {
    if (!hasAnalysis) {
      setError("먼저 ASO 분석을 실행해야 합니다.");
      return;
    }
    if (hasAnyResult) {
      if (
        !confirm(
          "기존 결과물(가이드 또는 스크린샷)이 있습니다. 자료를 다시 평가하고 결과를 갱신할까요?"
        )
      )
        return;
    } else {
      if (
        !confirm(
          "업로드 자료를 평가한 뒤 스크린샷 제작 또는 보완 가이드를 생성합니다. 2~5분 소요됩니다."
        )
      )
        return;
    }

    setError(null);
    setInfo("평가 중... (Library 확인 → 자료 평가 → 분기 실행)");

    startTransition(async () => {
      const res = await generateStoreScreenshots(orderId);
      if (!res.ok) {
        setError(res.error ?? "생성 실패");
        setInfo(null);
      } else {
        if (res.mode === "aso_screenshots") {
          setInfo(
            `스크린샷 ${res.count}장 제작 완료 (판정: ${res.verdict ?? "?"}).`
          );
        } else {
          setInfo(
            `자료가 부족해 보완 가이드를 생성했습니다 (판정: ${res.verdict ?? "?"}). 개발자에게 전달 후 재업로드를 받으세요.`
          );
        }
        router.refresh();
      }
    });
  }

  const label = isPending
    ? "평가·생성 중..."
    : hasAnyResult
      ? "평가·제작 재실행"
      : "자료 평가 및 제작";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || !hasAnalysis}
        className="w-full py-2.5 px-4 bg-accent hover:bg-accent-light text-white rounded-lg font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {label}
      </button>

      {!hasAnalysis && (
        <div className="text-xs text-muted">
          먼저 ASO 분석을 실행하세요.
        </div>
      )}
      {info && <div className="text-xs text-accent-light">{info}</div>}
      {error && (
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
