/**
 * 공통 스타일이 적용된 Select.
 */

import type { SelectHTMLAttributes } from "react";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return (
    <select
      {...rest}
      className={`
        w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm
        focus:outline-none focus:border-accent-light transition
        ${className}
      `}
    />
  );
}
