import Link from "next/link";

type Plan = {
  name: string;
  status: "active" | "soon";
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
  cta: string;
};

const plans: Plan[] = [
  {
    name: "스타트 · Google Play",
    status: "active",
    price: "20만원",
    period: "프로젝트당",
    description: "Google Play 스토어 ASO 분석 & 결과물 완성본",
    features: [
      "제목/서브타이틀/소개문구 완성본 (각 3개 대안)",
      "키워드 리스트 30~50개 (우선순위 포함)",
      "스토어 규격 스크린샷 5~8장",
      "스크린샷 제작 가이드 문서",
      "경쟁 게임 5개 분석",
      "2회 무료 수정 (14일 내)",
      "30일 후 무료 후속 점검",
    ],
    highlight: true,
    cta: "지금 신청하기",
  },
  {
    name: "베이직 · iOS + Android",
    status: "soon",
    price: "35만원",
    period: "프로젝트당",
    description: "양쪽 플랫폼 ASO 통합 최적화",
    features: [
      "Google Play + App Store 양쪽",
      "플랫폼별 최적화된 결과물",
      "스타트 패키지 전체 포함",
    ],
    highlight: false,
    cta: "준비 중",
  },
  {
    name: "글로벌 · 다국어",
    status: "soon",
    price: "70만원",
    period: "프로젝트당",
    description: "아시아 다국어 지역 최적화",
    features: [
      "iOS + Android 양쪽",
      "2개 언어 지역 최적화 (영/일/중 중 선택)",
      "지역별 스토어 페이지 번역",
      "베이직 패키지 전체 포함",
    ],
    highlight: false,
    cta: "준비 중",
  },
];

const futureServices = [
  {
    name: "보도자료 제작 & 배포",
    range: "30만원~ / 건",
    note: "국내 게임 매체 20곳 + 해외 인디 매체 선별 배포",
  },
  {
    name: "게임 콘텐츠 번역",
    range: "8만원~ / 언어",
    note: "스토어 설명 500단어 기준, Tier 1 주요 10개 언어 지원",
  },
  {
    name: "런칭 번들 (ASO + PR + 번역)",
    range: "80만원~",
    note: "3개 서비스 통합 할인가",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-accent-light text-sm font-medium tracking-wider uppercase mb-4">
            Pricing
          </p>
          <h1 className="text-4xl font-bold mb-4">투명한 가격 정책</h1>
          <p className="text-muted max-w-2xl mx-auto leading-relaxed">
            문의 없이 바로 확인할 수 있는 정직한 가격입니다.
            <br />
            Phase 1은 <span className="text-accent-light font-medium">
              ASO 서비스
            </span>
            만 이용 가능하며, 보도자료 · 번역 서비스는 순차 오픈됩니다.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 flex flex-col relative ${
                  plan.highlight
                    ? "bg-accent/10 border-2 border-accent"
                    : "bg-surface border border-border"
                } ${plan.status === "soon" ? "opacity-70" : ""}`}
              >
                {plan.highlight && plan.status === "active" && (
                  <span className="self-start px-3 py-1 bg-accent text-white text-xs font-medium rounded-full mb-4">
                    이용 가능
                  </span>
                )}
                {plan.status === "soon" && (
                  <span className="self-start px-3 py-1 bg-border text-muted text-xs font-medium rounded-full mb-4">
                    준비 중
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted ml-2">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-accent-light mt-0.5 shrink-0"
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
                      <span className="text-muted">{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.status === "active" ? (
                  <Link
                    href="/apply"
                    className={`block text-center py-3 rounded-lg font-medium transition ${
                      plan.highlight
                        ? "bg-accent hover:bg-accent-light text-white"
                        : "border border-border hover:border-accent-light text-foreground"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <div className="block text-center py-3 rounded-lg font-medium bg-border/30 text-muted cursor-not-allowed">
                    {plan.cta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future services */}
      <section className="py-16 bg-surface/50 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-3">오픈 예정 서비스</h2>
          <p className="text-sm text-muted text-center mb-10">
            순차 오픈됩니다. 미리 안내받고 싶으시면{" "}
            <a
              href="mailto:bbl@blockbusterlab.com"
              className="text-accent-light hover:underline"
            >
              bbl@blockbusterlab.com
            </a>
            으로 문의해 주세요.
          </p>
          <div className="space-y-3">
            {futureServices.map((s) => (
              <div
                key={s.name}
                className="bg-surface border border-border rounded-xl p-5 flex justify-between items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted">{s.note}</div>
                </div>
                <div className="text-accent-light font-semibold text-sm whitespace-nowrap">
                  {s.range}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-10">자주 묻는 질문</h2>
          <div className="space-y-4">
            {[
              {
                q: "스토어에 출시 안 된 게임도 가능한가요?",
                a: "가능합니다. 다만 이 경우 원본 스크린샷 5장 이상과 게임 로고를 직접 업로드해 주셔야 합니다. 이미 출시된 게임은 Google Play 또는 Apple App Store URL만 있으면 자동으로 자료를 수집합니다.",
              },
              {
                q: "작업 기간은 얼마나 걸리나요?",
                a: "ASO 서비스는 접수일 기준 5영업일 내 결과물을 전달합니다. 납기일은 접수 직후 확인 페이지와 담당자 연락을 통해 안내드립니다.",
              },
              {
                q: "결과물에 불만족이면 수정 가능한가요?",
                a: "결과물 전달 후 14일 이내에 2회까지 무료 수정이 가능합니다. 3회차 이상 수정이나 전면 재작업은 별도 비용이 발생합니다.",
              },
              {
                q: "iOS ASO도 가능한가요?",
                a: "가능합니다. Apple App Store URL 을 입력하시면 메타데이터·스크린샷을 자동 수집해 Apple 필드 구조(subtitle 30자, promotional text 170자 등)에 맞춰 설계합니다. Google Play 와 함께 제출하시면 양 스토어 결과물을 각각 별도로 제공합니다.",
              },
              {
                q: "결제는 어떻게 하나요?",
                a: "초기에는 무통장 입금으로 진행합니다. 신청 접수 후 담당자가 1영업일 내 입력하신 연락처로 결제 안내를 드립니다. 세금계산서 발행 가능합니다.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="bg-surface border border-border rounded-xl p-6"
              >
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
