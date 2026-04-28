/**
 * /admin/settings — 관리자 관리.
 *
 * 관리자 추가/역할 변경/활성·비활성 전환/삭제.
 * 본인 자기 비활성·삭제는 차단.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { AddAdminForm } from "./AddAdminForm";
import { AdminRow } from "./AdminRow";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "publisher" | "editor" | "operator";
  is_active: boolean;
  created_at: string;
};

export default async function SettingsPage() {
  const me = await getCurrentAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("admin_users")
    .select("id, email, name, role, is_active, created_at")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as AdminUser[];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">설정 — 관리자</h1>
        <p className="text-sm text-muted">
          관리자 추가 · 역할 변경 · 활성·비활성 · 삭제.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
          조회 실패: {error.message}
        </div>
      )}

      {/* 추가 폼 */}
      <section className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">관리자 추가</h2>
        <AddAdminForm />
      </section>

      {/* 목록 */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="font-semibold">
            등록 관리자 ({rows.length})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-background/50 text-xs text-muted">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">이메일</th>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">역할</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">등록일</th>
              <th className="px-4 py-3 font-medium text-right">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted text-sm"
                >
                  등록된 관리자가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <AdminRow
                  key={u.id}
                  admin={u}
                  isMe={u.id === me?.id}
                />
              ))
            )}
          </tbody>
        </table>
      </section>

      <div className="mt-6 text-xs text-muted">
        <p>
          <strong className="text-foreground">역할 가이드</strong>: publisher
          (발행인) · editor (편집장) · operator (운영자)
        </p>
        <p className="mt-1">
          신규 관리자는 본인 이메일로 매직 링크 로그인하면 자동 활성화. 자기
          자신은 비활성·삭제 불가.
        </p>
      </div>
    </main>
  );
}
