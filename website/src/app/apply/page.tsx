"use client";

/**
 * ASO 서비스 신청 폼 페이지.
 *
 * 각 섹션은 @/components/apply/*Section.tsx 로 분리되어 있음.
 * 이 페이지는 전체 상태를 소유하고, 제출 시 /api/orders 로 FormData 전송.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CustomerSection } from "@/components/apply/CustomerSection";
import { GameInfoSection } from "@/components/apply/GameInfoSection";
import { FeaturesSection } from "@/components/apply/FeaturesSection";
import { FilesSection } from "@/components/apply/FilesSection";
import { NotesSection } from "@/components/apply/NotesSection";
import { PackageSection } from "@/components/apply/PackageSection";
import { MIN_SCREENSHOT_COUNT } from "@/lib/aso/schema";

type FormState = {
  // 고객
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  studio_name: string;
  // 게임
  game_title: string;
  game_genre: string;
  store_url_android: string;
  store_url_apple: string;
  target_markets: string[];
  // 특징
  feature_1: string;
  feature_2: string;
  feature_3: string;
  // 메모
  emphasis_notes: string;
  avoid_notes: string;
  // 패키지
  package_id: string;
};

type FilesState = {
  screenshots: File[];
  logo: File[];
  other: File[];
};

const initialForm: FormState = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  studio_name: "",
  game_title: "",
  game_genre: "",
  store_url_android: "",
  store_url_apple: "",
  target_markets: [],
  feature_1: "",
  feature_2: "",
  feature_3: "",
  emphasis_notes: "",
  avoid_notes: "",
  package_id: "start_google_play",
};

const initialFiles: FilesState = {
  screenshots: [],
  logo: [],
  other: [],
};

export default function ApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [files, setFiles] = useState<FilesState>(initialFiles);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateForm(changes: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...changes }));
  }

  function updateFiles(changes: Partial<FilesState>) {
    setFiles((prev) => ({ ...prev, ...changes }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const hasStoreUrl =
      !!form.store_url_android.trim() || !!form.store_url_apple.trim();

    // 클라이언트 사이드 검증 (서버에서도 재검증됨)
    // 스토어 URL이 있으면 파일은 선택, 없으면 필수
    if (!hasStoreUrl) {
      if (files.screenshots.length < MIN_SCREENSHOT_COUNT) {
        setError(
          `스토어 URL이 없는 경우 스크린샷 최소 ${MIN_SCREENSHOT_COUNT}장 필요합니다.`
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (files.logo.length < 1) {
        setError("스토어 URL이 없는 경우 게임 로고를 업로드해 주세요.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (form.target_markets.length < 1) {
      setError("타겟 시장을 최소 1개 선택해 주세요.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // 단순 필드
      for (const [key, value] of Object.entries(form)) {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v));
        } else {
          formData.append(key, value ?? "");
        }
      }

      // 파일들
      files.screenshots.forEach((f) => formData.append("screenshots", f));
      files.logo.forEach((f) => formData.append("logo", f));
      files.other.forEach((f) => formData.append("other", f));

      const res = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error ?? "신청 중 오류가 발생했습니다.");
      }

      router.push(`/apply/submitted/${result.order_number}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-accent-light text-sm font-medium tracking-wider uppercase mb-4">
            ASO Service
          </p>
          <h1 className="text-4xl font-bold mb-4">ASO 분석 & 결과물 신청</h1>
          <p className="text-muted leading-relaxed">
            게임 정보와 원본 자료를 전달하시면,
            <br />
            5영업일 내 스토어에 바로 적용 가능한 완성물을 제작해 드립니다.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-10"
          >
            <CustomerSection values={form} onChange={updateForm} />
            <div className="border-t border-border" />

            <GameInfoSection values={form} onChange={updateForm} />
            <div className="border-t border-border" />

            <FeaturesSection
              values={form}
              onChange={updateForm}
              storeUrlProvided={
                !!form.store_url_android.trim() ||
                !!form.store_url_apple.trim()
              }
            />
            <div className="border-t border-border" />

            <FilesSection
              values={files}
              onChange={updateFiles}
              storeUrlProvided={
                !!form.store_url_android.trim() ||
                !!form.store_url_apple.trim()
              }
            />
            <div className="border-t border-border" />

            <NotesSection values={form} onChange={updateForm} />
            <div className="border-t border-border" />

            <PackageSection
              value={form.package_id}
              onChange={(id) => updateForm({ package_id: id })}
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-accent hover:bg-accent-light text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "전송 중..." : "신청하기"}
              </button>
              <p className="text-xs text-muted text-center mt-3">
                제출 후 주문번호와 다음 단계 안내가 표시됩니다.
                <br />
                담당자가 1영업일 내에 직접 연락드리며, 5영업일 내에 결과물을 전달합니다.
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
