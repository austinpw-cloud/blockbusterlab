"use client";

/**
 * 관리자 로그인 페이지.
 * 이메일 입력 → /api/admin/auth/signin 호출 → 매직 링크 발송.
 */

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const search = useSearchParams();
  const initialError = search.get("error");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? "로그인에 실패했습니다. 다시 시도해 주세요." : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "로그인 링크 발송 실패");
      }
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <section className="py-32">
        <div className="max-w-sm mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/20 text-accent-light mb-5">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">로그인 링크 발송</h1>
          <p className="text-sm text-muted leading-relaxed">
            입력하신 이메일이 관리자로 등록되어 있다면,
            <br />
            로그인 링크를 발송했습니다.
            <br />
            <br />
            이메일을 확인하고 링크를 클릭해 주세요.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-sm mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <p className="text-accent-light text-xs font-medium tracking-wider uppercase mb-2">
            Admin
          </p>
          <h1 className="text-2xl font-bold">관리자 로그인</h1>
          <p className="mt-2 text-sm text-muted">
            등록된 이메일로 로그인 링크를 발송합니다.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-2">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bbl@blockbusterlab.com"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-accent-light transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent hover:bg-accent-light text-white rounded-lg font-medium text-sm transition disabled:opacity-50"
          >
            {loading ? "발송 중..." : "로그인 링크 받기"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <section className="py-32 text-center text-sm text-muted">
          로딩 중...
        </section>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
