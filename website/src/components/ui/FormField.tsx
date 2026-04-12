/**
 * 폼 필드 공통 래퍼 — 라벨 / 필수 표시 / 도움말 / 에러 메시지
 *
 * 사용 예:
 *   <FormField label="이메일" required helper="자주 확인하는 주소">
 *     <input ... />
 *   </FormField>
 */

import type { ReactNode } from "react";

type Props = {
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
};

export function FormField({ label, required, helper, error, children }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {children}

      {helper && !error && (
        <p className="mt-1.5 text-xs text-muted">{helper}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
