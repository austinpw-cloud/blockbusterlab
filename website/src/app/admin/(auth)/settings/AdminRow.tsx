"use client";

import { useState, useTransition } from "react";
import { deleteAdmin, toggleAdminActive, updateAdminRole } from "./actions";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "publisher" | "editor" | "operator";
  is_active: boolean;
  created_at: string;
};

const ROLE_LABEL: Record<string, string> = {
  publisher: "발행인",
  editor: "편집장",
  operator: "운영자",
};

export function AdminRow({
  admin,
  isMe,
}: {
  admin: AdminUser;
  isMe: boolean;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function changeRole(role: string) {
    setErr(null);
    start(async () => {
      const r = await updateAdminRole(admin.id, role);
      if (!r.ok) setErr(r.error ?? "실패");
    });
  }

  function toggle(next: boolean) {
    setErr(null);
    start(async () => {
      const r = await toggleAdminActive(admin.id, next);
      if (!r.ok) setErr(r.error ?? "실패");
    });
  }

  function remove() {
    if (!confirm(`${admin.name} (${admin.email}) 관리자를 삭제하시겠습니까?`)) return;
    setErr(null);
    start(async () => {
      const r = await deleteAdmin(admin.id);
      if (!r.ok) setErr(r.error ?? "실패");
    });
  }

  return (
    <tr className="hover:bg-background/30 transition">
      <td className="px-4 py-3">
        <div className="text-sm">{admin.email}</div>
        {isMe && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent-light">
            본인
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">{admin.name}</td>
      <td className="px-4 py-3">
        <select
          defaultValue={admin.role}
          onChange={(e) => changeRole(e.target.value)}
          disabled={pending}
          className="text-xs px-2 py-1 bg-background border border-border rounded focus:outline-none"
        >
          <option value="publisher">발행인</option>
          <option value="editor">편집장</option>
          <option value="operator">운영자</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => toggle(!admin.is_active)}
          disabled={pending || isMe}
          className={`text-xs px-2 py-1 rounded transition ${
            admin.is_active
              ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
              : "bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isMe ? "자기 자신은 비활성화 불가" : ""}
        >
          {admin.is_active ? "활성" : "비활성"}
        </button>
      </td>
      <td className="px-4 py-3 text-xs text-muted">
        {new Date(admin.created_at).toLocaleDateString("ko-KR")}
      </td>
      <td className="px-4 py-3 text-right">
        {!isMe && (
          <button
            onClick={remove}
            disabled={pending}
            className="text-xs text-red-400 hover:text-red-300 transition disabled:opacity-50"
          >
            삭제
          </button>
        )}
        {err && <p className="text-xs text-red-400 mt-1">{err}</p>}
      </td>
    </tr>
  );
}
