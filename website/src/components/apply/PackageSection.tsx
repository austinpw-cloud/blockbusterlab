/**
 * 신청 폼 — 패키지 선택 섹션.
 *
 * Phase 1은 Google Play only 패키지만 활성.
 * 나머지는 "준비 중" 표시.
 */

import { ASO_PACKAGES } from "@/lib/aso/constants";

type Props = {
  value: string;
  onChange: (id: string) => void;
};

function formatKRW(krw: number) {
  return new Intl.NumberFormat("ko-KR").format(krw) + "원";
}

export function PackageSection({ value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold">⑥ 패키지 선택</h3>

      <div className="space-y-3">
        {ASO_PACKAGES.map((pkg) => {
          const isSelected = value === pkg.id;
          const isActive = pkg.active;

          return (
            <button
              key={pkg.id}
              type="button"
              disabled={!isActive}
              onClick={() => isActive && onChange(pkg.id)}
              className={`
                w-full text-left p-5 rounded-lg border transition
                ${isSelected && isActive
                  ? "border-accent bg-accent/10"
                  : isActive
                    ? "border-border hover:border-accent-light cursor-pointer"
                    : "border-border opacity-50 cursor-not-allowed"}
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{pkg.label}</h4>
                    {!isActive && (
                      <span className="text-xs px-2 py-0.5 rounded bg-border text-muted">
                        준비 중
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted mb-2">{pkg.description}</p>
                  <ul className="text-xs text-muted space-y-0.5">
                    {pkg.features.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold">
                    {formatKRW(pkg.price_krw)}
                  </div>
                  <div className="text-xs text-muted">프로젝트당</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
