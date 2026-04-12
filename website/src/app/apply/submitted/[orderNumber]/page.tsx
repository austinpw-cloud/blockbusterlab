/**
 * /apply/submitted/[orderNumber]
 *
 * 신청 완료 페이지 — 주문번호를 표시하고 다음 단계를 안내.
 */

import Link from "next/link";

type Params = Promise<{ orderNumber: string }>;

export default async function SubmittedPage({ params }: { params: Params }) {
  const { orderNumber } = await params;

  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
        {/* Check icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 text-accent-light mb-6">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-3">신청이 접수되었습니다</h1>

        <div className="mb-8 p-4 rounded-lg bg-surface border border-border inline-block">
          <div className="text-xs text-muted mb-1">주문 번호</div>
          <div className="text-lg font-mono font-semibold">{orderNumber}</div>
        </div>

        <div className="text-left space-y-4 text-sm">
          <div className="p-5 rounded-lg bg-surface border border-border">
            <h3 className="font-semibold mb-2">다음 단계</h3>
            <ol className="space-y-2 text-muted list-decimal list-inside">
              <li>입력하신 이메일로 접수 확인 메일이 발송됩니다.</li>
              <li>담당 편집자가 자료를 검토하고 분석을 시작합니다.</li>
              <li>5영업일 내에 완성된 결과물이 이메일로 전달됩니다.</li>
              <li>전달 후 14일 이내 2회까지 무료 수정 가능합니다.</li>
              <li>적용 30일 후 무료 후속 점검이 진행됩니다.</li>
            </ol>
          </div>

          <div className="p-5 rounded-lg bg-surface border border-border">
            <h3 className="font-semibold mb-2">문의</h3>
            <p className="text-muted">
              진행 상황이 궁금하시면 주문 번호{" "}
              <span className="font-mono text-foreground">{orderNumber}</span>를
              적어{" "}
              <a
                href="mailto:bbl@blockbusterlab.com"
                className="text-accent-light hover:underline"
              >
                bbl@blockbusterlab.com
              </a>
              로 문의해 주세요.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-block mt-8 text-sm text-muted hover:text-foreground transition"
        >
          ← 홈으로 돌아가기
        </Link>
      </div>
    </section>
  );
}
