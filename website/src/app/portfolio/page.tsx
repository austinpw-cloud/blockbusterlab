import Link from "next/link";

export default function PortfolioPage() {
  return (
    <>
      <section className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-accent-light text-sm font-medium tracking-wider uppercase mb-4">
            Portfolio
          </p>
          <h1 className="text-4xl font-bold mb-4">첫 사례를 준비 중입니다</h1>
          <p className="text-muted leading-relaxed">
            블록버스터랩은 이제 막 시작하는 서비스입니다.
            <br />첫 번째 사례 연구는 곧 여기에 공개될 예정입니다.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12">
            <h2 className="text-2xl font-bold mb-3">
              Founding Partner를 모집합니다
            </h2>
            <p className="text-muted leading-relaxed mb-6">
              초기 파트너로 함께하실 인디게임 스튜디오를 개별적으로 모시고
              있습니다. 파운딩 파트너는 사례 연구 공개 협조를 조건으로 특별 혜택을
              제공받습니다.
            </p>

            <ul className="space-y-3 text-sm text-muted mb-8">
              <li className="flex items-start gap-2">
                <span className="text-accent-light">✓</span>
                <span>일반가 대비 특별 할인</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-light">✓</span>
                <span>편집장 1:1 무료 컨설팅 포함</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-light">✓</span>
                <span>적용 후 성과 추적 및 리포트 무상 제공</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-light">✓</span>
                <span>인디게임닷컴 단독 인터뷰 기사 게재 기회</span>
              </li>
            </ul>

            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:bbl@blockbusterlab.com"
                className="inline-block px-5 py-2.5 bg-accent hover:bg-accent-light text-white rounded-lg font-medium text-sm transition"
              >
                이메일로 문의하기
              </a>
              <Link
                href="/apply"
                className="inline-block px-5 py-2.5 border border-border hover:border-accent-light text-foreground rounded-lg font-medium text-sm transition"
              >
                ASO 서비스 신청
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
