/**
 * 관리자 인증이 필요한 라우트 그룹의 레이아웃.
 *
 * 이 폴더 아래에 있는 모든 페이지는:
 *   - getCurrentAdmin() 체크
 *   - 실패 시 /admin/login 리다이렉트
 *
 * /admin/login 은 이 그룹 밖에 있어서 인증 체크 안 받음.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { AdminSignOutButton } from "@/components/admin/SignOutButton";

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen">
      {/* 관리자 상단 바 */}
      <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <nav className="flex items-center gap-6 text-sm">
              <span className="text-xs px-2 py-0.5 rounded bg-accent-light text-white font-medium">
                ADMIN
              </span>
              <Link
                href="/admin"
                className="text-muted hover:text-foreground transition"
              >
                주문 관리
              </Link>
            </nav>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted">
                {admin.name}{" "}
                <span className="text-muted/60">({admin.role})</span>
              </span>
              <AdminSignOutButton />
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
