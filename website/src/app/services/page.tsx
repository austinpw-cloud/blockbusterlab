import Link from "next/link";

type ServiceStatus = "active" | "soon";

type Service = {
  id: string;
  status: ServiceStatus;
  title: string;
  subtitle: string;
  description: string;
  features: { title: string; desc: string }[];
  useCases: string[];
};

const services: Service[] = [
  {
    id: "aso",
    status: "active",
    title: "ASO 분석 & 최적화",
    subtitle: "App Store Optimization",
    description:
      "Google Play 또는 Apple App Store 링크만 전달하면, 장르별 Top 게임 벤치마크와 비교 분석해 바로 적용 가능한 제목 · 서브타이틀 · 소개문구 · 키워드 · 스크린샷 완성본을 5영업일 내에 전달합니다. 양 스토어 모두 출시된 경우 각 스토어 필드 구조에 맞춰 별도 설계합니다.",
    features: [
      {
        title: "스토어 URL만으로 자동 수집",
        desc: "이미 출시된 게임이라면 스토어 주소만 전달하시면 기존 자료를 자동으로 수집해 분석합니다.",
      },
      {
        title: "장르별 Top 게임 벤치마크 기반",
        desc: "9개 장르 80+ 상위 게임의 제목 · 스크린샷 · 메타데이터 패턴을 반영한 맞춤 최적화.",
      },
      {
        title: "바로 적용 가능한 완성물 전달",
        desc: "리포트가 아닌, 스토어에 그대로 붙여넣을 수 있는 텍스트와 스크린샷 이미지 세트를 드립니다.",
      },
      {
        title: "5영업일 납기 · 2회 무료 수정",
        desc: "전달 후 14일 내 2회까지 무료 수정, 30일 후 무료 후속 점검까지 포함.",
      },
    ],
    useCases: [
      "신규 출시 스토어 세팅",
      "오가닉 다운로드 개선",
      "스토어 페이지 리뉴얼",
      "장르 전환 / 포지셔닝 변경",
    ],
  },
  {
    id: "press",
    status: "soon",
    title: "보도자료 제작 & 배포",
    subtitle: "Press Release Service",
    description:
      "인디게임닷컴 편집장이 직접 검수한 보도자료를 국내 게임 전문 매체와 해외 인디게임 미디어에 선별 배포합니다. 허수 대량 배포가 아닌 실제 노출 가능한 매체만을 타겟팅합니다.",
    features: [
      {
        title: "편집장 검수 · 편집",
        desc: "게임메카 기자 출신, 반다이남코 10년+ 경력의 편집장이 직접 검수합니다.",
      },
      {
        title: "국내외 주요 매체 선별 배포",
        desc: "국내 게임 전문 매체 20여 곳, 해외 주요 인디게임 매체 30~50곳에 타겟팅 배포.",
      },
      {
        title: "한/영 이중 언어 지원",
        desc: "한국어 + 영어 편집 번역을 기본 포함. 일본어/중국어는 추가 옵션.",
      },
      {
        title: "배포 결과 리포트",
        desc: "게재 매체 목록과 커버리지 정리를 2주 이내 전달합니다.",
      },
    ],
    useCases: [
      "신작 출시 발표",
      "대규모 업데이트 공지",
      "수상 · 마일스톤 달성",
      "이벤트 · 프로모션 홍보",
    ],
  },
  {
    id: "translation",
    status: "soon",
    title: "게임 콘텐츠 번역",
    subtitle: "Game Localization",
    description:
      "영어 · 일본어 · 중국어를 포함한 10개 Tier 1 언어로 스토어 페이지, 보도자료, 게임 내 텍스트를 현지화합니다. 게임 장르 · 어체 · 용어 일관성을 반영한 편집 번역.",
    features: [
      {
        title: "10개 주요 언어 지원",
        desc: "영어, 일본어, 중국어(간/번), 독일어, 프랑스어, 스페인어, 이탈리아어, 포르투갈어, 러시아어.",
      },
      {
        title: "장르 · 어체 반영",
        desc: "RPG · 캐주얼 · 스포츠 등 장르별 관용 표현, 한국어 존댓말 체계까지 반영합니다.",
      },
      {
        title: "ASO 키워드 연계",
        desc: "스토어 페이지 번역 시 현지 ASO 키워드를 자연스럽게 반영합니다.",
      },
      {
        title: "최소 주문 제한 없음",
        desc: "500단어 단위 소규모 번역도 지원. 대형 에이전시의 €100+ 최소 주문 부담 없음.",
      },
    ],
    useCases: [
      "스토어 페이지 번역",
      "보도자료 번역",
      "게임 내 UI/스토리 번역",
      "마케팅 소재 현지화",
    ],
  },
];

function StatusBadge({ status }: { status: ServiceStatus }) {
  if (status === "active") {
    return (
      <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-accent-light text-white font-medium tracking-wide mr-2">
        NOW
      </span>
    );
  }
  return (
    <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-border text-muted font-medium tracking-wide mr-2">
      준비 중
    </span>
  );
}

export default function ServicesPage() {
  return (
    <>
      <section className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-accent-light text-sm font-medium tracking-wider uppercase mb-4">
            Our Services
          </p>
          <h1 className="text-4xl font-bold mb-4">
            인디게임의 글로벌 성장을 위한 3가지 서비스
          </h1>
          <p className="text-muted max-w-2xl mx-auto leading-relaxed">
            각 서비스는 독립적으로 이용하거나 번들로 묶을 수 있습니다.
            <br />
            현재{" "}
            <span className="text-accent-light font-medium">ASO 분석 & 최적화</span>가
            바로 이용 가능하며, 나머지 서비스는 순차적으로 오픈 예정입니다.
          </p>
        </div>
      </section>

      {services.map((s, idx) => (
        <section
          key={s.id}
          id={s.id}
          className={`py-20 ${idx % 2 === 1 ? "bg-surface/50 border-y border-border" : ""}`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <p className="text-accent-light text-xs font-medium tracking-wider uppercase mb-2">
                {s.subtitle}
              </p>
              <h2 className="text-3xl font-bold mb-4">
                <StatusBadge status={s.status} />
                {s.title}
              </h2>
              <p className="text-muted leading-relaxed mb-10">{s.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {s.features.map((f) => (
                <div
                  key={f.title}
                  className="bg-surface border border-border rounded-xl p-6"
                >
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-3">활용 사례</h3>
              <div className="flex flex-wrap gap-2">
                {s.useCases.map((u) => (
                  <span
                    key={u}
                    className="px-3 py-1 bg-accent/10 text-accent-light text-sm rounded-full"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="py-20 bg-surface border-t border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">지금 바로 시작할 수 있습니다</h2>
          <p className="text-muted mb-8">
            ASO 서비스는 이미 이용 가능합니다. 게임 스토어 링크만 있으면 5영업일 내
            결과물을 받아보실 수 있어요.
          </p>
          <Link
            href="/apply"
            className="inline-block px-8 py-3 bg-accent hover:bg-accent-light text-white rounded-lg font-medium transition"
          >
            ASO 서비스 신청하기
          </Link>
        </div>
      </section>
    </>
  );
}
