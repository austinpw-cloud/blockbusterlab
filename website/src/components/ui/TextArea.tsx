/**
 * 공통 스타일이 적용된 Textarea.
 */

import type { TextareaHTMLAttributes } from "react";

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", rows = 3, ...rest } = props;
  return (
    <textarea
      {...rest}
      rows={rows}
      className={`
        w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm
        focus:outline-none focus:border-accent-light transition resize-none
        ${className}
      `}
    />
  );
}
