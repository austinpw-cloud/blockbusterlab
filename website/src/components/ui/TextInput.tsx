/**
 * 공통 스타일이 적용된 텍스트 입력.
 * 기본 input과 동일한 props를 받으면서 스타일만 표준화.
 */

import type { InputHTMLAttributes } from "react";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`
        w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm
        focus:outline-none focus:border-accent-light transition
        ${className}
      `}
    />
  );
}
