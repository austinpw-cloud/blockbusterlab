"use client";

/**
 * 관리자 로그아웃 버튼.
 * POST /api/admin/auth/signout 호출 후 로그인 페이지로 이동.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminSignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/api/admin/auth/signout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-muted hover:text-foreground transition disabled:opacity-50"
    >
      {loading ? "..." : "로그아웃"}
    </button>
  );
}
