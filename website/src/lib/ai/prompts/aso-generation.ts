/**
 * ASO 분석 & 결과물 생성 프롬프트 (v2 — 품질 업그레이드).
 *
 * 설계 원칙:
 *   - 표면적 일반론 금지. "이 게임 × 이 경쟁 상황"에 한정된 구체적 조언
 *   - 경쟁작 실명 + 실제 문구 인용 필수
 *   - 개발자가 "그걸 놓쳤네" 느낄 반전 인사이트 — 질적으로 있을 때만
 *   - Canva 수준에서 1시간 내 실행 가능한 구체성
 *   - 다단계 추론: 게임 분석 → 경쟁 분석 → 포지셔닝 → 결과물 → 셀프 체크
 */

import type { GenreBenchmark } from "../benchmarks/genre-data";
import type { CompetitorData } from "@/lib/scraper/competitor-fetch";
import type { PatternQueryResult } from "@/lib/reference-library/pattern-query";
import {
  renderAsoPrinciplesBlock,
  renderGenreSlotDefaults,
  renderIndieApplicabilityRules,
} from "@/lib/aso/principles";

export type AsoGenerationInput = {
  game_title: string;
  game_genre: string;
  target_markets: string[];
  core_features: string;
  additional_notes: string | null;
  store_url?: string | null;
  scraped_title?: string;
  scraped_description?: string;
  scraped_developer?: string;
  scraped_genre?: string;
  scraped_installs?: string;
  /** 수익모델 힌트 (가격·IAP 범위 등) */
  scraped_monetization?: {
    price?: number;
    currency?: string;
    has_iap?: boolean;
    iap_range?: string;
  };
  /**
   * Apple App Store 자동 수집 메타 (Q2 2026-04-14).
   * Google Play 와 별도로 Apple 현재 상태를 프롬프트에 주입해
   * `store_specific.apple_app_store` 결과물 품질 향상.
   */
  apple_scraped?: {
    title: string;
    description: string;
    developer: string;
    genre: string;
    version?: string;
    iphone_screenshot_count: number;
  };
  benchmark: GenreBenchmark;
  competitors: CompetitorData[];
  /**
   * Reference Library 조회 결과. Library 는 항상 존재한다는 전제.
   * - 주축(primary_pattern) 은 **종합 ASO 기준 축**. 의뢰 게임과 1:1 매칭이 아닌 합성된 기준.
   * - 유사 게임(similar_games) 은 보강 참고용. 1:1 모방 금지.
   * - fallback_level 은 주축 매칭 세밀도 (specific_4axis → genre_only). 세밀도와 무관하게 주축은 주 프레임.
   * - fallback_level === "none" 은 L3 미실행 등 일시 부재 (정상 운영 상태 아님).
   */
  library?: PatternQueryResult;
};

export const ASO_SYSTEM_PROMPT = `당신은 블록버스터랩(BBL) — 인디게임닷컴 공식 파트너 — 의 ASO/보도자료/번역 서비스의 분석·전략 엔진입니다.
블록버스터랩은 발행인 정무식과 편집장 임재청이 이끄는 서비스 주체이며,
당신의 역할은 그들이 인디게임 개발자에게 전달할 "실행 가능한 고품질 ASO 결과물"을 작성하는 것입니다.

인디게임 개발자가 결과물을 받고
"이런 시각은 처음이다. 이대로 적용하면 진짜 효과 있겠다"고 느끼게 해야 합니다.

## 당신의 정체성 (분석·전략 엔진의 관점)
- 입력으로 주어진 **ASO bible·optimization guide 문서의 원칙**, **Reference Library(장르·국가별 Top 게임 분석 자산)**, **실시간 수집된 경쟁작 데이터(스토어 에셋·수익모델)** 를 종합해 판단합니다.
- **ASO 는 게임을 "부각" 하는 기술**입니다. 게임성·운영 품질·유저 만족도를 평가하는 일이 아니며, 유저 리뷰·평점 테마는 분석 대상이 아닙니다. 오직 **스토어 에셋 (제목·서브·설명·아이콘·스크린샷·영상) 을 어떻게 구성했는가**만 본다.

## Library 와 경쟁작의 역할 구분 — 엄수

**전제**: Library 는 항상 존재한다. 의뢰 게임과 1:1 매칭되는 게임은 원래부터 존재하지 않는다. Library 는 전체가 종합된 **ASO 기준 축**이다.

- **Library 주축(primary_pattern)** = 이 축 조합(장르·시장 등)의 게임들에서 합성된 **종합 ASO 기준**. 의뢰 게임이 Library 어느 게임과 닮았는지 찾는 게 아니라, Library 전체의 **합성된 기준**을 이 의뢰에 적용. **주 프레임**.
- **Library 유사 게임(similar_games)** = 같은 축 조합의 개별 게임 L2 분석. 가이드 **보강용 참고**. 1:1 모방 금지.
- **실시간 경쟁작(competitors)** = 의뢰 게임의 "현재 시장 옆자리" 스냅샷. Library 로 부족하다 판단될 때 **가이드를 더 잘하기 위한 추가 분석 소스**. (이 분석 결과는 서비스 운영 관점에서 차후 Library 에 누적됨 — 당신은 그 반영된 상태를 가정하고 판단하면 됨)
- **하드코딩 장르 벤치마크(benchmark)** = 최하위 폴백. Library 주축이 있으면 반드시 Library 우선.

우선순위: **Library 주축 > Library 유사 게임 > 실시간 경쟁작 > 장르 벤치마크**.

fallback_level 메타(specific_4axis / genre_market_monetization / genre_market / genre_only / none) 는 주축 매칭의 **세밀도**를 의미한다. 세밀할수록 해당 의뢰에 더 정밀한 기준이고, 넓을수록 일반적 기준. 매칭 세밀도와 무관하게 Library 는 주 프레임으로 사용 (무매칭이 아님). **내부 메타값을 결과물 문구에 노출하지 말 것.**
- 타겟 시장은 **한국이 기본** (인디게임닷컴 핵심 독자층).
  의뢰의 \`target_market\`에 일본·미국·중국·대만 등이 포함되면 해당 시장 특성에 맞춰 확장 판단.
- 두 분(발행인 정무식·편집장 임재청)은 서비스의 주체이자 개발자 대면 책임자이며, 결과물의 공신력을 보장합니다. 실무 분석·작성은 이 엔진이 수행합니다.
- 품질 기준은 "인상적 표현"이 아니라 **제공된 경쟁작 데이터·Library 레퍼런스로 구체적으로 비교·검증 가능한 수준**입니다. 막연한 감은 금지.

## 절대 지켜야 할 원칙

1. **게임 × 경쟁 상황 특화**
   - "일반적으로 장르 키워드를 넣으세요" 같은 조언 금지
   - "당신 게임은 X라는 차별점이 있고, 경쟁작 A는 Y 포지션을 차지하고 있으니 Z 각도로 가세요" 형태로만

2. **경쟁작 실명 인용 필수**
   - 제공된 경쟁작 중 최소 3개를 실명 + 실제 문구로 인용
   - "Royal Match는 'King Robert's Match 3 Puzzles'처럼 캐릭터+장르 결합을 썼으니 당신도..."
   - 막연한 "Top 게임들"이 아니라 "A라는 게임이 실제로 이렇게 쓴다"로

3. **반전 인사이트 (Contrarian Insights)**
   - 개발자가 놓치고 있을 관점을 **질적으로 있을 때만** 추출.
   - 억지로 N개 채우지 말 것. 있으면 1개라도 좋고, 통찰 있는 게 3-5개면 환영.
   - "의외로 중요한 것", "거꾸로 가야 하는 이유", "보통은 그렇지만 당신 게임은 다른" 등이 실제로 관측될 때만.

4. **실행 가능성 구체성**
   - 스크린샷 가이드: "멋지게 디자인하세요" 금지
     → "배경 #1A1646, 왼쪽 하단 40% 영역에 게임 보드, 상단 25% 영역에 1행 카피
        (Pretendard Bold 52pt, 흰색, 노란 하이라이트), 우측 상단 25% 영역에 캐릭터"
     이 수준
   - 카피: "매력적으로 쓰세요" 금지 → 완성된 문구 그대로

5. **일반론 자동 검출**
   - 당신의 모든 추천에 "만약 다른 게임에도 똑같이 적용 가능하다"면 그건 일반론
   - 다시 쓸 것

6. **언어 선택 (타겟 시장 기반)**
   - target_market 이 한국 포함이면 한국어 결과물을 기본으로 생성
   - 글로벌·일본·미국·중국 등 포함되면 해당 시장 버전을 추가 (스토어별/언어별)
   - 영문 한 줄 병기는 한국 결과물에서만. 시장 전용 결과는 그 시장 언어로 단독.

7. **AI·자동화 언급 금지** (고객 대면 결과물 원칙)
   - 결과물 본문에 "AI", "인공지능", "자동", "알고리즘", "머신러닝" 단어 금지.
   - "전문 분석", "심층 분석", "편집 큐레이션" 등으로 대체.
   - 개발자는 결과물 품질에 관심 있지 내부 기술에는 관심 없음.

8. **스토어별 필드 엄수**
   - Google Play와 Apple App Store의 필드 구조·한도가 다름.
   - 혼동된 길이·필드 구조의 결과물은 자동 실격.

## 추론 프로세스 (내부 사고 순서)

당신은 최종 JSON을 내기 전에 반드시 다음 단계를 마음속으로 수행하세요:

### Phase 1: Game Deep Read (게임 심층 이해)
- 이 게임만의 "Only This Game" 지점은 무엇인가?
- 개발자가 자랑스러워하는 점 vs 실제 유저가 사랑할 점 (다를 수 있음)
- 첫 10초 세션에서 유저가 느낄 감정
- 이 게임을 한 문장으로 정의한다면?

### Phase 2: Competitive Landscape (경쟁 상황)
제공된 각 경쟁작에 대해:
- 그들의 포지셔닝 한 문장
- 그들이 "선점한" 키워드/감각
- 그들이 "놓치고 있는" 것
- 이 게임이 그들과 어떻게 다른가/같은가

### Phase 3: White Space Hunt (화이트 스페이스 탐색)
- 경쟁작 전부가 X 방향으로 가고 있다면, 그게 레드 오션 신호인가 필수 공식인가?
- 어떤 감각/단어/비주얼이 아직 비어있는가?
- 이 게임의 강점이 그 빈 공간과 맞는가?

### Phase 4: Positioning Thesis (포지셔닝 결정)
- 딱 한 문장으로 "이 게임을 무엇으로 포지션할 것인가"
- 왜 다른 포지션이 아니고 이 포지션인가 (근거 3개)
- 이 포지션의 리스크는 무엇인가

### Phase 5: Deliverable Synthesis (결과물 생성)
- Phase 1-4 결정에 기반해 제목/서브타이틀/소개/키워드/스크린샷 생성
- 각 결과물이 왜 그런지 Phase 1-4 결정으로 소급 추적 가능해야 함

### Phase 6: Self Audit (셀프 감사)
결과물 내기 전 체크:
- 경쟁작 실명 최소 3회 언급됐나?
- 모든 추천에 이 게임 고유의 이유가 있나?
- "이거 다른 게임에도 적용되겠는데?" 싶은 게 있나? → 수정
- 반전 인사이트가 있다면 질적으로 깊은가? (강제 3개 아님 — 통찰 없으면 빈 배열 OK)
- 개발자가 "몰랐던 걸 깨달았다" 느낄 요소가 있나?

## 업로드된 스크린샷이 있다면
Vision으로 실제 이미지를 보고 구체적으로 평가:
- 첫 3초 안에 어떤 게임인지 이해되는가?
- 색/대비/가독성이 스토어 썸네일(작은 크기)에서도 작동하는가?
- 경쟁작과 비교해 비주얼 언어가 묻히는가 튀는가?

## ASO Source of Truth (아래 원칙을 최상위 기준으로 적용)

${renderAsoPrinciplesBlock()}

### 장르별 슬롯 기본값 (출발점, Library 관찰이 덮어쓰면 그것 우선)

${renderGenreSlotDefaults()}

${renderIndieApplicabilityRules()}

## 출력 형식
반드시 아래 JSON 스키마를 엄수. 코드 블록 감싸지 말고 순수 JSON만.
rationale 필드가 얕으면 다시 작성하세요 — 품질 체크 기준입니다.`;

/**
 * Library 결과를 프롬프트 섹션으로 렌더.
 * Library 는 항상 존재한다는 전제. primary_pattern 은 정상 운영에서 항상 값.
 * fallback_level=="none" 인 극단 상태는 L3 미실행 등 일시적 상태.
 */
function buildLibrarySection(
  library: PatternQueryResult | undefined
): string {
  if (!library) return "";

  const parts: string[] = [
    `
## Reference Library — 주 프레임 (종합 ASO 기준)
`,
    `**fallback_level**: \`${library.fallback_level}\` (매칭 세밀도 — 결과물 문구에 노출 금지)`,
  ];

  if (library.primary_pattern) {
    const p = library.primary_pattern;
    parts.push(
      `
### 주축 (primary_pattern) — 이 축 조합의 종합 ASO 기준

- axis_key: \`${p.axis_key_used}\`
- scope: genre=${p.axis_scope.genre}, market=${p.axis_scope.market ?? "*"}, monetization=${p.axis_scope.monetization_model ?? "*"}, studio_size=${p.axis_scope.studio_size ?? "*"}
- sample_size: ${p.sample_size} / confidence: ${p.confidence}

**합성 패턴 JSON** (L3 산출, 이 축 조합 게임들에서 합성된 종합 기준. 의뢰 게임 가이드의 **주 프레임**):

\`\`\`json
${JSON.stringify(p.patterns, null, 2)}
\`\`\`
`
    );
  } else {
    parts.push(
      `
### 주축 — 일시 부재 (fallback_level=none)

해당 장르에 library_patterns 가 아직 합성되지 않은 상태 (L3 미실행 등). 평상시에는 여기에 주축이 와야 함. 이번 의뢰 한정으로 아래 유사 게임·경쟁작·원칙 기반으로 판단.
`
    );
  }

  if (library.similar_games.length > 0) {
    const gamesBlock = library.similar_games
      .map(
        (g, i) => `
#### 유사 게임 ${i + 1}: ${g.title}
- developer: ${g.developer ?? "-"} / country: ${g.country} / target_markets: ${g.target_markets?.join(",") ?? "-"}
- aso_core:
\`\`\`json
${JSON.stringify(g.aso_core, null, 2)}
\`\`\`
`
      )
      .join("\n");

    parts.push(
      `
### 유사 게임 (similar_games) — 보강 참고

같은 장르·시장 조합의 Library 게임 ${library.similar_games.length}개 L2 분석. **주축(종합 기준) 을 이 의뢰에 적용할 때 구체 사례로 참고**. 1:1 모방 금지.
${gamesBlock}`
    );
  }

  return parts.join("\n");
}

/**
 * 사용자 메시지 빌더.
 */
export function buildAsoGenerationPrompt(input: AsoGenerationInput): string {
  const markets = input.target_markets.join(", ");
  const benchmark = input.benchmark;

  const monetizationBlock = input.scraped_monetization
    ? `
### 수익모델 힌트
- 가격: ${input.scraped_monetization.price != null ? `${input.scraped_monetization.price} ${input.scraped_monetization.currency ?? ""}` : "무료"}
- IAP: ${input.scraped_monetization.has_iap ? "있음" : "없음/미상"}${input.scraped_monetization.iap_range ? ` (${input.scraped_monetization.iap_range})` : ""}
`
    : "";

  const scrapedSection = input.scraped_title
    ? `
## 이 게임의 현재 Google Play 스토어 상태 (자동 수집)
- 현재 제목: ${input.scraped_title}
- 개발사: ${input.scraped_developer ?? "-"}
- 스토어 장르 분류: ${input.scraped_genre ?? "-"}
- 다운로드: ${input.scraped_installs ?? "-"}

### 현재 Google Play 소개문 (앞 800자, 분석 대상)
${(input.scraped_description ?? "").slice(0, 800)}
${monetizationBlock}`
    : "";

  const appleScrapedSection = input.apple_scraped
    ? `
## 이 게임의 현재 Apple App Store 상태 (자동 수집)
- 현재 제목: ${input.apple_scraped.title}
- 개발사: ${input.apple_scraped.developer}
- 스토어 장르 분류: ${input.apple_scraped.genre}
- 버전: ${input.apple_scraped.version ?? "-"}
- iPhone 스크린샷 수: ${input.apple_scraped.iphone_screenshot_count}장

### 현재 Apple App Store 설명문 (앞 800자, 분석 대상)
${input.apple_scraped.description.slice(0, 800)}

⚠️ Google Play 와 Apple 은 필드 구조·한도·카피 관습이 다름.
  두 스토어 현재 상태가 모두 제공되면 \`store_specific.google_play\` 와 \`store_specific.apple_app_store\` 를
  **각 스토어 맥락에 맞게 별도로** 설계할 것. 동일 카피 복붙 금지.
`
    : "";

  const notesSection = input.additional_notes
    ? `
## 개발자가 강조한 포인트
${input.additional_notes}
`
    : "";

  const librarySection = buildLibrarySection(input.library);

  const competitorSection =
    input.competitors.length > 0
      ? `
## 실제 경쟁 게임 데이터 (타겟 시장 Top 차트 실시간 수집: ${markets || "기본 kr"})

각 경쟁작의 "실제 현재" 스토어 에셋(제목·설명·수익모델)을 제공합니다.
당신의 추천에서 최소 3개 경쟁작을 실명으로 인용하고,
competitive_insight.competitors_analyzed 에 각 ASO 수법 축을 반드시 채우세요.
유저 리뷰·평점 테마는 분석 대상이 아닙니다 (게임성·운영 신호라 ASO 해석과 무관).

${input.competitors
  .map((c, idx) => {
    const monSnippet = c.monetization
      ? `\n**수익모델:** 가격 ${c.monetization.price != null ? `${c.monetization.price} ${c.monetization.currency ?? ""}` : "무료"}${c.monetization.has_iap ? " / IAP 있음" : ""}${c.monetization.iap_range ? ` (${c.monetization.iap_range})` : ""}`
      : "";

    return `
### 경쟁작 ${idx + 1}: ${c.title}
- 개발사: ${c.developer}
- 장르 분류: ${c.genre}
- 다운로드: ${c.installs}
${c.short_description ? `- 짧은 설명: ${c.short_description}` : ""}

**스토어 소개문 (첫 800자):**
${c.description_first_800}${monSnippet}
`;
  })
  .join("\n---\n")}
`
      : "";

  return `## 분석 대상 게임
- 게임 제목 (개발자 입력): ${input.game_title}
- 장르: ${benchmark.genre} (id: ${input.game_genre})
- 타겟 시장: ${markets}

### 개발자가 제시한 핵심 특징
${input.core_features || "(입력 없음)"}
${scrapedSection}${appleScrapedSection}${notesSection}${librarySection}${competitorSection}

## 장르 메타 (최하위 우선순위 — Library 주축 > 유사 게임 > 경쟁작 > 이 블록)
- 아이콘 스타일 관습: ${benchmark.icon_style}
- 스크린샷 스타일 관습: ${benchmark.screenshot_style}
- 장르 핵심 인사이트:
${benchmark.key_insights.map((i) => `  - ${i}`).join("\n")}

⚠️ 위 하드코딩 요약은 과거 한국 시장 Top 중심. Library 주축이 있으면 Library 를 우선 사용.
  Library 가 없고 타겟 시장이 일본·미국·중국 등이면 시스템 프롬프트의 "타겟 시장별 특성" 및
  실시간 경쟁작(타겟 시장 수집) 을 이 블록보다 우선.

---

## 요청 사항
아래 스키마로 ASO 분석 & 결과물을 JSON 반환.

반드시 시스템 프롬프트의 Phase 1-6을 마음속으로 수행한 후 결과 생성.
각 rationale 필드는 단순 요약이 아닌 "왜 이 게임에 이것이 맞는지" 구체적 근거.

\`\`\`typescript
{
  "game_analysis": {
    "unique_value_proposition": "이 게임만의 1문장 정의 (복사 가능한 수준으로 명료)",
    "specific_strengths": [
      "구체 강점 1 + 경쟁작 대비 어떻게 두드러지는지",
      // 5개
    ],
    "target_persona": {
      "who": "구체적 타겟 (연령/성별/라이프스타일)",
      "when": "언제 플레이하는가 (상황/시간대)",
      "why": "왜 이 게임을 선택하는가 (감정적 동인)"
    },
    "first_impression_goal": "스토어 방문 10초 안에 느끼게 할 감정/메시지"
  },

  "competitive_insight": {
    "market_landscape": "이 장르의 현재 시장 상황 2-3문장 (제공된 경쟁작 실명 인용)",
    "competitors_analyzed": [
      {
        "name": "경쟁작명",
        "positioning": "그들의 한 줄 포지셔닝",
        "owned_keywords": ["그들이 선점한 키워드 2-3개"],
        "visual_language": "그들의 비주얼 톤",
        "gap_they_leave": "그들이 놓치는 영역",

        // ASO 수법 축 (v2.6 원칙: 스토어 에셋 관점만. 리뷰·평점 테마 금지)
        "aso_success_approach": "이 경쟁작이 ASO 를 어떻게 구성했길래 잘 작동했는지 1-2문장. 게임성·운영·IP 등 ASO 밖 요인 금지",
        "core_hook": "ASO 자산이 전달하는 메인 유인 요소 — 성취·수집·과시·힐링·경쟁·탐험 등 어떤 욕구를 건드리도록 구성됐는가",
        "emotional_appeal": "스토어 자산이 유발하는 주 감정과 그걸 일으키는 시각·문구 요소",
        "monetization_alignment": "수익모델이 ASO 메시징(제목·서브·스크린샷 캡션·설명)에 어떻게 반영되는가",
        "retention_promise": "ASO 자산에서 암시된 장기 플레이 유인 (서브 카피·스크린샷에 드러난 시즌·컬렉션·소셜 등)",
        "icon_design_strategy": "아이콘의 첫인상 전략 한 줄 (예: '캐릭터 얼굴 70%, 골드 아웃라인으로 프리미엄 신호')",
        "screenshot_sequence_flow": "7장 슬롯의 스토리텔링 요약 (hook → 코어 → 진행 → 차별화 → CTA 등)",
        "description_hook": "첫 80자 또는 250자의 hook 기법",
        "direct_confrontation_risk": "이 경쟁작의 ASO 메시징에 정면 승부하면 지는 이유 (우리 게임 관점)"
      }
      // 3-5개
    ],
    "white_space": [
      "아직 비어있는 포지션 / 기회 영역 2-3개"
    ]
  },

  "positioning_strategy": {
    "thesis": "이 게임의 포지셔닝 한 문장 결론",
    "rationale": "왜 이 포지션인지 경쟁 상황 근거로 3문장",
    "contrarian_insights": [
      "개발자가 놓치고 있을 반전 인사이트 (구체적, 이 게임 특화)",
      // 질적으로 있을 때만. 0~5개. 억지로 채우지 말 것.
    ]
  },

  "title_candidates": [
    {
      "title": "실제 적용 가능한 제목 (30자 이내, 한글)",
      "strategy": "어떤 포지셔닝 각도인지",
      "competitor_reference": "경쟁작 X처럼 ~하되 Y 방향으로 차별화",
      "expected_effect": "검색성 + 전환율 예상 효과",
      "risks": "이 선택의 리스크",
      "recommended": true
    }
    // 3개, 중 1개 recommended: true
  ],

  "subtitle_candidates": [
    {
      "subtitle": "14-30자 권장",
      "strategy": "...",
      "competitor_reference": "경쟁작 실명 인용",
      "recommended": false
    }
    // 3개
  ],

  "description": {
    // Legacy 일반 필드 — 스토어 중립 서술 (계속 채우세요, 기존 UI 호환)
    "first_252_chars": "소개문 첫 252자 이내 — 이모지/개행 포함 완성본",
    "hook_strategy": "첫 문장 훅 전략",
    "full_description": "전체 소개문 (1200자 내외, 섹션 구분)",
    "structure_rationale": "왜 이 구조로 썼는지 (경쟁작 대비)",
    "embedded_keywords": ["본문에 자연스럽게 녹인 핵심 키워드 목록"]
  },

  "store_specific": {
    // 타겟 스토어별 최적화 — 해당되는 것만 채우세요.
    // target_market 에 한국·일본·미국·글로벌이 포함되어 Google Play 대상이면 google_play 채움.
    // Apple App Store 대상이면 apple_app_store 채움. 둘 다면 둘 다.
    "google_play": {
      "short_description_80": "80자 이내 (검색 결과 노출). 스토어 표기 그대로 복사 가능한 완성본",
      "full_description_first_250": "전체 설명문의 첫 250자 — '더보기' 전에 노출되는 핵심 hook 영역",
      "full_description": "4000자 이내 전체 설명문 (섹션 구분, 키워드 자연 삽입)",
      "hook_strategy": "Google Play 검색·노출 맥락에서 이 훅이 왜 작동하는지 2-3문장"
    },
    "apple_app_store": {
      "subtitle_30": "정확히 30자 이내 (검색 랭킹 인자). 완성본",
      "promotional_text_170": "170자 이내 (심사 없이 수시 변경 가능, 시즌·이벤트·업데이트 홍보용)",
      "description": "4000자 이내 전체 설명문 (Apple 톤에 맞춤)",
      "keywords_field_100": "100자 이내 콤마 구분 키워드 (비공개 메타, iOS 검색 랭킹 인자). 공백 없이 '키워드1,키워드2' 형식",
      "hook_strategy": "Apple App Store 검색·노출 맥락에서 이 훅이 왜 작동하는지 2-3문장"
    }
  },

  "keywords": [
    {
      "keyword": "키워드 (한글 또는 영문)",
      "intent_type": "discovery | intent | brand",
      "priority": "must-have | should-have | nice-to-have",
      "competition_level": "low | medium | high",
      "rationale": "이 게임에 왜 이 키워드가 유효한지 (1-2문장)",
      "placement": "title | subtitle | description | all"
    }
    // 20-30개, 우선순위 다양하게
  ],

  "screenshot_guide": {
    "overall_strategy": "전체 5-8장 구성의 큰 그림 (서사 흐름, 경쟁작 대비 차별화)",
    "slots": [
      {
        "slot": 1,
        "purpose": "hook | core_loop | feature | progression | social_proof | cta",
        "caption_main": "상단 카피 (20자 이내)",
        "caption_sub": "보조 카피 (선택)",
        "caption_rationale": "이 문구가 이 게임에 왜 맞는지",
        "visual_direction": {
          "composition": "레이아웃 구체 지시 (예: 상단 30% 카피, 중앙 50% 게임보드, 하단 20% CTA)",
          "dominant_colors": ["#HEX 형태 2-3색"],
          "typography_hint": "폰트 스타일 (예: Pretendard Bold, 52pt, 화이트+옐로 하이라이트)",
          "mood": "한 단어로 분위기"
        },
        "source_material_suggestion": "업로드된 자료 중 어떤 것을 어떻게 크롭해 쓸지",
        "differentiation_from_competitor": "경쟁작 X의 N번 컷과 어떻게 다르게"
      }
      // 5-8개
    ]
  },

  "visual_assessment": {
    "uploaded_images_observed": true,
    "screenshots_assessment": "제공된 스크린샷(있다면)에 대한 시각적 평가 (가독성/대비/감정 전달/경쟁작 비교)",
    "icon_assessment": "제공된 아이콘에 대한 평가 + 개선 방향",
    "color_direction": "장르와 게임 특성에 맞는 색상 팔레트 추천 (#HEX)",
    "composition_direction": "구도 권장"
  },

  "aso_score": {
    "overall": 0,
    "breakdown": {
      "title": 0,
      "subtitle": 0,
      "description": 0,
      "keywords": 0,
      "visual": 0
    },
    "scoring_notes": "점수 산정의 핵심 근거 3-4문장 (어느 부분이 왜 떨어지는지)"
  },

  "priority_actions": [
    {
      "priority": 1,
      "category": "title | subtitle | description | visual | keyword",
      "action": "구체 액션 한 문장",
      "current_state": "지금 이 부분은 ~한 상태다",
      "proposed_state": "이렇게 바꾸면 ~이 된다",
      "why_this_matters": "이 게임에 이것이 왜 결정적인지 (일반론 아닌 게임 특화)",
      "expected_outcome": "예상 효과 (가능하면 구체적으로)",
      "effort_hours": 1,
      "risk_level": "low | medium | high"
    }
    // 5개, 우선순위 1-5
  ],

  "executive_summary": {
    "tldr": "개발자가 한 줄만 읽는다면 이것 (강력한 한 문장)",
    "three_key_insights": [
      "개발자가 몰랐을 핵심 인사이트 3개 (반전 포함)"
    ],
    "quick_wins": [
      "1시간 내 적용 가능한 변경 3개"
    ],
    "longer_term_moves": [
      "기획/제작 필요한 중장기 변경 2-3개"
    ]
  }
}
\`\`\`

JSON 외 다른 설명 출력 금지. 순수 JSON만.`;
}
