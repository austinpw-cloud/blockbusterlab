"use client";

import { useState, useTransition } from "react";
import { addAdmin } from "./actions";

export function AddAdminForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    start(async () => {
      const r = await addAdmin(formData);
      if (r.ok) {
        setSuccess(true);
        // 폼 초기화는 reload 으로 단순 처리
        setTimeout(() => location.reload(), 600);
      } else {
        setError(r.error ?? "실패");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <input
        name="email"
        type="email"
        required
        placeholder="이메일"
        className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-accent-light"
      />
      <input
        name="name"
        required
        placeholder="이름"
        className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-accent-light"
      />
      <select
        name="role"
        defaultValue="operator"
        className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-accent-light"
      >
        <option value="publisher">publisher (발행인)</option>
        <option value="editor">editor (편집장)</option>
        <option value="operator">operator (운영자)</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
      >
        {pending ? "추가 중..." : "추가"}
      </button>
      {error && (
        <p className="md:col-span-4 text-xs text-red-400">{error}</p>
      )}
      {success && (
        <p className="md:col-span-4 text-xs text-emerald-400">추가됨</p>
      )}
    </form>
  );
}
