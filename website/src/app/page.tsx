"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";

const stats = [
  { label: "전문가 경력", value: "20년+" },
  { label: "매체 네트워크", value: "100+" },
  { label: "지원 언어", value: "10개" },
  { label: "납기", value: "5영업일" },
];

const services = [
  {
    id: "aso",
    status: "active" as const,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "ASO 분석 & 최적화",
    desc: "스토어 링크만으로 장르별 Top 게임과 비교 분석해, 바로 적용 가능한 제목/소개/스크린샷 완성본을 5영업일 내에 전달합니다.",
  },
  {
    id: "press",
    status: "soon" as const,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    title: "보도자료 제작 & 배포",
    desc: "게임의 핵심 매력을 전달하는 보도자료를 작성하고, 국내 게임 매체 20여 곳과 해외 주요 인디게임 매체에 선별 배포합니다.",
  },
  {
    id: "translation",
    status: "soon" as const,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
    title: "게임 콘텐츠 번역",
    desc: "영어 · 일본어 · 중국어를 비롯한 10개 주요 언어로 스토어 페이지, 보도자료, 게임 내 텍스트를 현지화합니다.",
  },
];

const valueProps = [
  {
    title: "인디게임닷컴 공식 파트너",
    desc: "2003년부터 K-인디 생태계를 이끌어 온 인디게임닷컴의 공식 파트너로 운영됩니다.",
  },
  {
    title: "게임 업계 20년 전문가",
    desc: "1세대 게임 개발자(정무식)와 주요 게임 매체 · 퍼블리셔 경력 20년+의 편집장(임재청)이 운영합니다.",
  },
  {
    title: "바로 적용 가능한 완성물",
    desc: "리포트가 아니라 스토어에 그대로 붙여넣을 수 있는 텍스트 · 스크린샷 · 키워드 완성본을 전달합니다.",
  },
  {
    title: "K-인디 특화 + 글로벌",
    desc: "한국 시장의 특수성과 글로벌 트렌드를 모두 반영한 맞춤 최적화를 제공합니다.",
  },
];

function AnimatedCounter({ value }: { value: string }) {
  return (
    <motion.div
      className="text-3xl font-bold text-accent-light"
      initial={{ scale: 0.5, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {value}
    </motion.div>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-accent)_0%,_transparent_50%)] opacity-15" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20 relative">
          <div className="max-w-3xl">
            <FadeIn delay={0.1}>
              <p className="text-accent-light text-sm font-medium tracking-wider uppercase mb-4">
                For Indie Game Studios
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                당신의 게임을
                <br />
                <span className="text-accent-light">세계에 알리세요</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.35}>
              <p className="mt-6 text-lg text-muted max-w-xl leading-relaxed">
                보도자료 제작/배포, 게임 콘텐츠 번역, ASO 최적화까지.
                인디게임사의 글로벌 성장을 위한 원스톱 서비스를 제공합니다.
              </p>
            </FadeIn>
            <FadeIn delay={0.5}>
              <div className="mt-8 flex flex-wrap gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/apply"
                    className="inline-block px-6 py-3 bg-accent hover:bg-accent-light text-white rounded-lg font-medium transition"
                  >
                    무료 상담 신청
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/services"
                    className="inline-block px-6 py-3 border border-border hover:border-accent-light text-foreground rounded-lg font-medium transition"
                  >
                    서비스 알아보기
                  </Link>
                </motion.div>
              </div>
            </FadeIn>
          </div>

          {/* Stats */}
          <StaggerContainer className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <StaggerItem key={s.label}>
                <motion.div
                  className="bg-surface border border-border rounded-xl p-6 text-center"
                  whileHover={{ y: -4, borderColor: "var(--accent)" }}
                  transition={{ duration: 0.2 }}
                >
                  <AnimatedCounter value={s.value} />
                  <div className="mt-1 text-sm text-muted">{s.label}</div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Why Us */}
      <section className="border-y border-border bg-surface/50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-12">
            <p className="text-accent-light text-xs font-medium tracking-wider uppercase mb-3">
              Why blockbusterlab
            </p>
            <h2 className="text-3xl font-bold">인디게임의 진실된 파트너</h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {valueProps.map((v) => (
              <StaggerItem key={v.title}>
                <div className="h-full p-5 rounded-xl border border-border bg-background">
                  <h3 className="font-semibold mb-2 text-accent-light">{v.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{v.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Services */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold">핵심 서비스</h2>
            <p className="mt-3 text-muted">
              인디게임의 성장에 필요한 모든 것을 제공합니다
            </p>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {services.map((s) => (
              <StaggerItem key={s.id}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={`/services#${s.id}`}
                    className="group bg-surface border border-border rounded-2xl p-8 block hover:border-accent/50 transition relative"
                  >
                    {s.status === "active" ? (
                      <span className="absolute top-5 right-5 text-[10px] px-2 py-0.5 rounded bg-accent-light text-white font-medium tracking-wide">
                        NOW
                      </span>
                    ) : (
                      <span className="absolute top-5 right-5 text-[10px] px-2 py-0.5 rounded bg-border text-muted font-medium tracking-wide">
                        준비 중
                      </span>
                    )}
                    <motion.div
                      className="text-accent-light mb-4"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      {s.icon}
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-accent-light transition">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-surface/50 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold">이용 방법</h2>
            <p className="mt-3 text-muted">간단한 4단계로 시작하세요</p>
          </FadeIn>
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", title: "신청서 제출", desc: "서비스 종류와 게임 정보를 간단히 입력합니다." },
              { step: "02", title: "상담 & 견적", desc: "담당 매니저가 요구사항을 파악하고 맞춤 견적을 제안합니다." },
              { step: "03", title: "작업 진행", desc: "전문팀이 작업을 진행하며 실시간으로 진행 상황을 공유합니다." },
              { step: "04", title: "결과 전달", desc: "최종 결과물을 전달하고 후속 지원을 제공합니다." },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="text-center">
                  <motion.div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/20 text-accent-light font-bold text-sm mb-4"
                    whileHover={{ scale: 1.2, backgroundColor: "var(--accent)" }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.step}
                  </motion.div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Founding Partner */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center">
              <p className="text-accent-light text-xs font-medium tracking-wider uppercase mb-3">
                Founding Partner Program
              </p>
              <h2 className="text-3xl font-bold mb-4">
                첫 사례를 함께 만드실 파트너를 찾습니다
              </h2>
              <p className="text-muted leading-relaxed mb-2">
                블록버스터랩은 이제 막 시작하는 서비스입니다.
              </p>
              <p className="text-muted leading-relaxed">
                함께 성장하실 초기 파트너 인디게임사를 개별적으로 모시고 있습니다.
                <br />
                관심 있으신 스튜디오는{" "}
                <a
                  href="mailto:bbl@blockbusterlab.com"
                  className="text-accent-light hover:underline"
                >
                  bbl@blockbusterlab.com
                </a>
                으로 연락 주세요.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-surface border-t border-border">
        <FadeIn className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">지금 시작하세요</h2>
          <p className="text-muted mb-8">
            첫 상담은 무료입니다. 게임 정보를 알려주시면 맞춤 전략을 제안드립니다.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/apply"
              className="inline-block px-8 py-3 bg-accent hover:bg-accent-light text-white rounded-lg font-medium transition"
            >
              무료 상담 신청하기
            </Link>
          </motion.div>
        </FadeIn>
      </section>
    </>
  );
}
