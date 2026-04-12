/**
 * AI 분석 결과 뷰 (v2 — 업그레이드된 스키마 대응).
 *
 * 섹션 순서는 개발자가 "깨달음" 얻는 논리적 흐름으로 배치:
 *   1. Executive Summary (TL;DR + 반전 인사이트)
 *   2. 게임 분석 (당신 게임이 무엇인가)
 *   3. 경쟁 상황 (시장이 무엇인가)
 *   4. 포지셔닝 전략 (당신이 어디에 있어야 하는가)
 *   5. 점수 + 우선순위 액션
 *   6. 제목/서브타이틀 후보
 *   7. 소개문 완성본
 *   8. 키워드 리스트
 *   9. 스크린샷 가이드
 *  10. 비주얼 평가
 */

import type { AsoResult } from "@/lib/ai/aso-analyzer";

type Props = {
  result: AsoResult;
  generatedAt: string;
  version: number;
};

// ─── 유틸 컴포넌트 ───────────────────────────────────────────────

function ScoreBar({ value, label }: { value: number; label: string }) {
  const color =
    value >= 80
      ? "bg-green-500"
      : value >= 60
        ? "bg-yellow-500"
        : value >= 40
          ? "bg-orange-500"
          : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: "must-have" | "should-have" | "nice-to-have" | "high" | "medium" | "low";
}) {
  const high = ["must-have", "high"];
  const mid = ["should-have", "medium"];
  const colorClass = high.includes(priority)
    ? "bg-red-500/20 text-red-400 border-red-500/30"
    : mid.includes(priority)
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-blue-500/20 text-blue-400 border-blue-500/30";
  return (
    <span
      className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium whitespace-nowrap ${colorClass}`}
    >
      {priority}
    </span>
  );
}

function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  const colors = {
    low: "bg-green-500/10 text-green-400",
    medium: "bg-yellow-500/10 text-yellow-400",
    high: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[risk]}`}>
      리스크 {risk}
    </span>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-background border border-border rounded-xl p-5">
      <h3 className="font-semibold mb-1">{title}</h3>
      {subtitle && (
        <p className="text-xs text-muted mb-3 leading-relaxed">{subtitle}</p>
      )}
      <div className={subtitle ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

// ─── 메인 뷰 ────────────────────────────────────────────────────

export function AsoResultView({ result, generatedAt, version }: Props) {
  return (
    <div className="space-y-6">
      {/* 메타 */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>생성 일시: {new Date(generatedAt).toLocaleString("ko-KR")}</span>
        <span>버전: v{version}</span>
      </div>

      {/* 1. Executive Summary */}
      <Section title="핵심 요약" subtitle="개발자가 가장 먼저 볼 부분">
        <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg mb-4">
          <div className="text-xs font-medium text-accent-light mb-1">
            TL;DR
          </div>
          <div className="text-sm font-medium leading-relaxed">
            {result.executive_summary.tldr}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs font-medium text-accent-light mb-2">
              💡 놓치고 있던 핵심 인사이트
            </div>
            <ul className="space-y-1.5 text-sm">
              {result.executive_summary.three_key_insights.map((i, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-accent-light shrink-0">{idx + 1}.</span>
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-medium text-green-400 mb-2">
              ⚡ 1시간 안에 할 수 있는 것
            </div>
            <ul className="space-y-1.5 text-sm">
              {result.executive_summary.quick_wins.map((i, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-green-400 shrink-0">•</span>
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-medium text-blue-400 mb-2">
              🎯 중장기 과제
            </div>
            <ul className="space-y-1.5 text-sm">
              {result.executive_summary.longer_term_moves.map((i, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-blue-400 shrink-0">•</span>
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 2. 게임 분석 */}
      <Section
        title="게임 심층 이해"
        subtitle="이 게임이 무엇인지 — 포지셔닝의 출발점"
      >
        <div className="mb-4 p-3 bg-surface border border-border rounded-lg">
          <div className="text-xs text-muted mb-1">Unique Value Proposition</div>
          <div className="text-sm font-medium">
            {result.game_analysis.unique_value_proposition}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted mb-2">구체적 강점</div>
            <ul className="space-y-1.5 text-sm">
              {result.game_analysis.specific_strengths.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent-light shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs text-muted mb-2">타겟 페르소나</div>
            <dl className="text-sm space-y-1.5">
              <div>
                <dt className="text-xs text-muted">누가</dt>
                <dd>{result.game_analysis.target_persona.who}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">언제</dt>
                <dd>{result.game_analysis.target_persona.when}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">왜</dt>
                <dd>{result.game_analysis.target_persona.why}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted mb-1">첫인상 목표</div>
          <div className="text-sm">
            {result.game_analysis.first_impression_goal}
          </div>
        </div>
      </Section>

      {/* 3. 경쟁 상황 */}
      <Section
        title="경쟁 상황 분석"
        subtitle="실제 Google Play 현재 Top 게임들의 포지셔닝"
      >
        <div className="mb-4 p-3 bg-surface border border-border rounded-lg">
          <div className="text-xs text-muted mb-1">시장 랜드스케이프</div>
          <div className="text-sm leading-relaxed">
            {result.competitive_insight.market_landscape}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {result.competitive_insight.competitors_analyzed.map((c, i) => (
            <div key={i} className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-sm">{c.name}</div>
                <div className="text-xs text-muted">{c.visual_language}</div>
              </div>
              <div className="text-sm text-muted mb-2">{c.positioning}</div>
              <div className="flex flex-wrap gap-1 mb-2">
                {c.owned_keywords.map((kw, kwi) => (
                  <span
                    key={kwi}
                    className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent-light"
                  >
                    {kw}
                  </span>
                ))}
              </div>
              <div className="text-xs text-muted">
                <span className="font-medium text-foreground">놓치는 영역:</span>{" "}
                {c.gap_they_leave}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-xs font-medium text-green-400 mb-2">
            🎯 White Space — 비어있는 포지션
          </div>
          <ul className="space-y-1.5 text-sm">
            {result.competitive_insight.white_space.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-green-400 shrink-0">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 4. 포지셔닝 전략 */}
      <Section
        title="포지셔닝 전략"
        subtitle="어디에 자리 잡을 것인가"
      >
        <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg mb-4">
          <div className="text-xs font-medium text-accent-light mb-1">
            포지셔닝 테제
          </div>
          <div className="text-base font-semibold leading-relaxed">
            {result.positioning_strategy.thesis}
          </div>
          <div className="mt-3 text-xs text-muted leading-relaxed">
            {result.positioning_strategy.rationale}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-yellow-400 mb-2">
            🔄 반전 인사이트 (놓치고 있는 관점)
          </div>
          <ul className="space-y-2 text-sm">
            {result.positioning_strategy.contrarian_insights.map((ci, i) => (
              <li
                key={i}
                className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
              >
                {ci}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 5. 점수 + 우선순위 액션 */}
      <Section title="ASO 점수 & 우선순위 액션">
        <div className="grid md:grid-cols-3 gap-4 mb-5">
          <div className="md:col-span-1 bg-surface border border-border rounded-lg p-4">
            <div className="text-xs text-muted mb-1">Overall Score</div>
            <div className="text-4xl font-bold text-accent-light mb-3">
              {result.aso_score.overall}
              <span className="text-sm text-muted font-normal">/100</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {result.aso_score.scoring_notes}
            </p>
          </div>
          <div className="md:col-span-2 space-y-2">
            <ScoreBar
              value={result.aso_score.breakdown.title}
              label="제목"
            />
            <ScoreBar
              value={result.aso_score.breakdown.subtitle}
              label="서브타이틀"
            />
            <ScoreBar
              value={result.aso_score.breakdown.description}
              label="소개문구"
            />
            <ScoreBar
              value={result.aso_score.breakdown.keywords}
              label="키워드"
            />
            <ScoreBar
              value={result.aso_score.breakdown.visual}
              label="비주얼"
            />
          </div>
        </div>

        <div className="space-y-2">
          {result.priority_actions.map((a) => (
            <div
              key={a.priority}
              className="p-3 border border-border rounded-lg"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-accent/20 text-accent-light text-sm font-bold flex items-center justify-center">
                  {a.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-border text-muted">
                      {a.category}
                    </span>
                    <RiskBadge risk={a.risk_level} />
                    <span className="text-xs text-muted">
                      {a.effort_hours}h
                    </span>
                  </div>
                  <div className="text-sm font-medium mb-2">{a.action}</div>
                  <div className="text-xs text-muted space-y-1">
                    <div>
                      <span className="text-red-400">현재:</span>{" "}
                      {a.current_state}
                    </div>
                    <div>
                      <span className="text-green-400">제안:</span>{" "}
                      {a.proposed_state}
                    </div>
                    <div className="pt-1 text-foreground">
                      <span className="text-muted">왜 중요:</span>{" "}
                      {a.why_this_matters}
                    </div>
                    <div className="text-muted italic">
                      예상 효과: {a.expected_outcome}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. 제목 후보 */}
      <Section title="제목 후보 (3)">
        <div className="space-y-3">
          {result.title_candidates.map((t, i) => (
            <div
              key={i}
              className={`p-4 border rounded-lg ${
                t.recommended
                  ? "border-accent bg-accent/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-mono text-base font-semibold">
                  {t.title}
                </div>
                {t.recommended && (
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-accent-light text-white font-bold">
                    RECOMMENDED
                  </span>
                )}
              </div>
              <div className="text-xs text-muted space-y-1">
                <div>
                  <span className="text-foreground font-medium">전략:</span>{" "}
                  {t.strategy}
                </div>
                <div>
                  <span className="text-foreground font-medium">경쟁작 근거:</span>{" "}
                  {t.competitor_reference}
                </div>
                <div>
                  <span className="text-foreground font-medium">예상 효과:</span>{" "}
                  {t.expected_effect}
                </div>
                <div>
                  <span className="text-foreground font-medium">리스크:</span>{" "}
                  {t.risks}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 7. 서브타이틀 후보 */}
      <Section title="서브타이틀 후보 (3)">
        <div className="space-y-3">
          {result.subtitle_candidates.map((s, i) => (
            <div
              key={i}
              className={`p-4 border rounded-lg ${
                s.recommended
                  ? "border-accent bg-accent/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-mono text-sm font-semibold">
                  {s.subtitle}
                </div>
                {s.recommended && (
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-accent-light text-white font-bold">
                    RECOMMENDED
                  </span>
                )}
              </div>
              <div className="text-xs text-muted space-y-1">
                <div>
                  <span className="text-foreground font-medium">전략:</span>{" "}
                  {s.strategy}
                </div>
                <div>
                  <span className="text-foreground font-medium">경쟁작 근거:</span>{" "}
                  {s.competitor_reference}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 8. 소개문 */}
      <Section title="스토어 소개문구 완성본">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted">
              첫 252자 (검색 결과 노출 — 가장 중요)
            </div>
            <div className="text-xs text-muted font-mono">
              {result.description.first_252_chars.length}자
            </div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 text-sm whitespace-pre-wrap font-medium">
            {result.description.first_252_chars}
          </div>
          <div className="mt-2 text-xs text-muted">
            <span className="font-medium text-foreground">훅 전략:</span>{" "}
            {result.description.hook_strategy}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs text-muted mb-2">전체 소개문</div>
          <div className="bg-surface border border-border rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">
            {result.description.full_description}
          </div>
          <div className="mt-2 text-xs text-muted">
            <span className="font-medium text-foreground">구조 근거:</span>{" "}
            {result.description.structure_rationale}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted mb-2">본문에 녹인 키워드</div>
          <div className="flex flex-wrap gap-1">
            {result.description.embedded_keywords.map((k, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent-light"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* 9. 키워드 */}
      <Section
        title={`키워드 리스트 (${result.keywords.length}개)`}
        subtitle="must-have 우선 배치. placement에 따라 제목/서브/본문에 분산 적용"
      >
        <div className="space-y-1">
          {result.keywords.map((k, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 border-b border-border/50 last:border-0"
            >
              <PriorityBadge priority={k.priority} />
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ${
                  k.competition_level === "low"
                    ? "bg-green-500/10 text-green-400"
                    : k.competition_level === "high"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-yellow-500/10 text-yellow-400"
                }`}
              >
                경쟁 {k.competition_level}
              </span>
              <span className="font-mono text-sm">{k.keyword}</span>
              <span className="text-xs text-muted text-right ml-auto shrink-0">
                {k.placement}
              </span>
              <span className="text-xs text-muted hidden md:block max-w-md truncate">
                {k.rationale}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* 10. 스크린샷 가이드 */}
      <Section
        title="스크린샷 슬롯별 제작 가이드"
        subtitle={result.screenshot_guide.overall_strategy}
      >
        <div className="space-y-4">
          {result.screenshot_guide.slots.map((s) => (
            <div key={s.slot} className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 rounded-full bg-accent/20 text-accent-light text-sm font-bold flex items-center justify-center">
                  {s.slot}
                </span>
                <div>
                  <div className="font-medium text-sm">{s.purpose}</div>
                </div>
              </div>

              <div className="space-y-3 text-sm ml-10">
                <div className="p-3 bg-surface rounded border border-border">
                  <div className="text-xs text-muted mb-1">오버레이 카피</div>
                  <div className="font-mono font-semibold">
                    &ldquo;{s.caption_main}&rdquo;
                  </div>
                  {s.caption_sub && (
                    <div className="font-mono text-sm text-muted mt-1">
                      보조: &ldquo;{s.caption_sub}&rdquo;
                    </div>
                  )}
                  <div className="text-xs text-muted mt-2">
                    {s.caption_rationale}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted mb-0.5">구도</div>
                    <div>{s.visual_direction.composition}</div>
                  </div>
                  <div>
                    <div className="text-muted mb-0.5">타이포그래피</div>
                    <div>{s.visual_direction.typography_hint}</div>
                  </div>
                  <div>
                    <div className="text-muted mb-0.5">색상</div>
                    <div className="flex gap-1 flex-wrap">
                      {s.visual_direction.dominant_colors.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1"
                        >
                          <span
                            className="w-3 h-3 rounded border border-border inline-block"
                            style={{ backgroundColor: c }}
                          />
                          <span className="font-mono">{c}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted mb-0.5">분위기</div>
                    <div>{s.visual_direction.mood}</div>
                  </div>
                </div>

                <div className="text-xs">
                  <div className="text-muted mb-0.5">사용할 소스</div>
                  <div>{s.source_material_suggestion}</div>
                </div>
                <div className="text-xs">
                  <div className="text-muted mb-0.5">
                    경쟁작 대비 차별화
                  </div>
                  <div>{s.differentiation_from_competitor}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 11. 비주얼 평가 */}
      <Section
        title="비주얼 평가"
        subtitle={
          result.visual_assessment.uploaded_images_observed
            ? "업로드된 이미지를 실제로 분석한 결과"
            : "(업로드된 이미지 없음 — 장르 일반론 기준)"
        }
      >
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted mb-1">스크린샷 평가</div>
            <div className="leading-relaxed">
              {result.visual_assessment.screenshots_assessment}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">아이콘 평가</div>
            <div className="leading-relaxed">
              {result.visual_assessment.icon_assessment}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">색상 방향</div>
            <div className="leading-relaxed">
              {result.visual_assessment.color_direction}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">구도 방향</div>
            <div className="leading-relaxed">
              {result.visual_assessment.composition_direction}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
