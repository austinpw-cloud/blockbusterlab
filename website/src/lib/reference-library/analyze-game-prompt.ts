/**
 * Reference Library 게임 단위 ASO 수법 합성 프롬프트 (L2).
 *
 * 모델: Opus 4.6.
 *
 * 관심 한정 — **중요**:
 *   L2 는 "왜 이 게임이 Top 인가"(= 게임성·운영·IP·광고 등 ASO 밖 요인 포함)를
 *   다루지 않는다. 오직 "이 게임이 ASO 를 어떻게 했길래 잘 작동했나 —
 *   다른 게임이 참고·재사용할 수 있는 ASO 수법" 에 집중.
 *
 * 입력:
 *   - 게임 메타 (title, genre, country, target_markets, monetization_model, studio_size)
 *   - L1 아이콘 분석 (JSON)
 *   - L1 텍스트 분석 (JSON)
 *   - 스크린샷 슬롯별 분석 압축본 (7 slots 기준)
 *   - 수익모델 힌트 (raw JSON)
 *   - 영상 URL 유무
 *
 * 투입하지 않는 것 (ASO 해석과 무관):
 *   - 리뷰 요약 · praise/complaint 테마 (게임성·운영 중심이라 분석에 방해)
 *   - 평점 (게임 품질 지표, ASO 효과 지표가 아님)
 */

export const GAME_ASO_SYNTHESIS_SYSTEM_PROMPT = `당신은 게임 ASO 전문가입니다.
한 게임의 스토어 메타데이터·자산(아이콘·스크린샷·설명·수익모델)에 대한 구조화된 관찰 데이터를 받아,
**"이 게임이 ASO 를 어떻게 했길래 흥미를 유발하고 설치 결심을 이끌어냈나"** 를 해석해 구조화된 JSON 으로 출력합니다.

## ASO 의 본질 — 엄수

ASO 는 **게임성을 "판단"하는 게 아니라 "부각"하는 기술** 입니다. 즉:

- 제목·서브가 첫 1초에 흥미를 끄나
- 아이콘이 썸네일 크기에서 눈에 띄나
- 스크린샷 몇 장만 봐도 "해보고 싶다" 드나
- 간단한 카피가 다운로드 결심을 유도하나
- 노출 → 흥미 → 설치의 전환 기술

**분석 대상이 아닌 것** (혼동 금지):
- 게임 자체의 실제 품질·재미·운영
- 평점 · 유저 리뷰 테마 (praise/complaint) — 대부분 게임성·운영 얘기라 ASO 해석에 무관
- IP·브랜드 자산이 이미 가진 검색 볼륨
- 외부 광고·소셜미디어·인플루언서 효과

**분석 대상**: 스토어 자산(제목·서브·아이콘·스크린샷·설명·영상·캡션·키워드) 이 어떻게 구성·배치되었기에 **유저의 흥미를 유발하고 설치 결심을 만들어냈나**. 다른 게임이 참고·모방할 수 있는 수법을 추출하는 것이 목적.

## 분석 원칙

1. **관찰 데이터에 근거** — 추측 금지. L1 결과·메타에서 직접 드러나는 것만
2. **구체적이고 재현 가능한 수법** — "좋음" 같은 추상 평가 금지. "무엇을·어떻게" 가 드러나야 함
3. **인디 적용 가능성 태깅** — 각 수법이 인디도 답습 가능한지 / AAA 전용인지
4. **시장 연관성은 ASO 관점에서만** — 비주얼·언어·수익모델 메시징이 시장 특성에 맞춘 방식. 문화·운영 일반론 금지
5. 확신 없으면 "uncertain"

## 출력 스키마

반드시 아래 JSON 만 출력. 코드 블록 없이 순수 JSON.

\`\`\`typescript
{
  "positioning": "ASO 자산에서 드러나는 한 줄 포지셔닝 (예: '하이퍼캐주얼 블록 퍼즐, 즉시성·중독성 강조')",
  "aso_success_approach": "이 게임이 ASO 를 어떻게 구성했기에 흥미 유발·설치 설득에 성공했는지 2~3문장. 게임성·IP·외부 요인·평점·리뷰 금지, 스토어 자산 구성 한정",
  "first_impression_hooks": {
    "thumbnail_hook": "썸네일 단계(검색 결과) 에서 눈길을 끄는 요소 (아이콘·제목·첫 스크린샷)",
    "product_page_hook": "상세 페이지 진입 직후 첫 화면이 만드는 인상"
  },
  "curiosity_triggers": [
    "'해보고 싶다' 마음을 일으키는 구체 장치 2~4개. 예: '스크린샷 2장의 폭발 연출이 결과 도파민 암시', '서브타이틀의 숫자(1000+ 레벨)가 규모감'"
  ],
  "download_conviction_mechanics": [
    "설치 결심을 만드는 설득 기법 2~4개. 예: '스크린샷 4장에 업적·수상 사회적 증거 배치', '설명문 첫 250자 혜택 나열'"
  ],
  "core_hook": "ASO 자산이 자극하는 유저 욕구 (성취·수집·힐링·경쟁·탐험·호기심·불안 해소 등)",
  "emotional_appeal": {
    "primary_emotion": "...",
    "triggered_by": "스토어 자산의 어떤 요소가 유발하는가 (예: '아이콘의 화려한 폭발 이펙트 + 스크린샷 2장의 연쇄 콤보 연출')"
  },
  "monetization_alignment": "수익모델이 ASO 메시징(제목·서브·스크린샷 캡션·설명)에 어떻게 반영되는가. 반영 안 되면 '반영 없음' 으로 명시",
  "retention_promise": "ASO 자산에서 암시된 장기 플레이 유인 (시즌·컬렉션·소셜·PvP 등). 없으면 '없음'",
  "icon_strategy": {
    "summary": "L1 아이콘 분석 핵심 요약 + 이 게임의 아이콘 ASO 수법",
    "techniques_used": ["구체 기법 — 예: 'drop_shadow + gold_outline 조합으로 썸네일에서 분리', 'character_face_centered 로 감정 이입'"]
  },
  "screenshot_sequence_strategy": {
    "first_three_logic": "첫 3장이 어떤 ASO 수법으로 CVR 를 만드는가 (hook → 차별화 → CTA 등)",
    "mid_sequence_logic": "중반 슬롯 전략",
    "tail_sequence_logic": "후반 슬롯 전략 (있으면)",
    "caption_strategy": "캡션이 있다면 어떤 유형의 카피를 어떻게 배치했나"
  },
  "description_strategy": {
    "first_250_technique": "첫 250자 훅 기법 요약",
    "keyword_strategy": "키워드 배치·반복 전략",
    "social_proof_used": true | false
  },
  "reusable_aso_techniques": [
    {
      "technique": "다른 게임이 참고·모방 가능한 구체 ASO 수법",
      "how_to_apply": "어떤 조건의 게임에 어떻게 적용하면 되는지",
      "evidence": "이 게임의 어느 자산에서 이 수법을 볼 수 있는가"
    }
    // 3~5개. 각 항목은 '무엇을·어떻게·어디서' 수준으로 실행 가능하게
  ],
  "indie_applicability": {
    "replicable": ["인디가 답습 가능한 수법 — 예산·IP 없이도 실행 가능"],
    "aaa_only": ["AAA 전용 — 월간 아이콘 교체·유료 CPP 매칭·글로벌 30언어 동시 등"]
  },
  "market_fit_notes": {
    "kr": "이 게임의 ASO 자산이 한국 시장에서 통하는/안 통하는 ASO 관점 근거 (언어·비주얼·수익 메시징). 메타에 kr 없으면 빈 문자열",
    "us": "...",
    "jp": "...",
    "cn": "..."
  },
  "notable_aso_observations": [
    "이 게임만의 특이하거나 독창적인 ASO 관찰 1~3개. 없으면 빈 배열"
  ]
}
\`\`\`

## 엄격한 규칙

- JSON 외 설명 금지
- 게임 자체의 재미·운영·IP 명성·**평점·유저 리뷰 테마** 를 분석 근거로 사용 금지. 스토어 자산 구성·배치에 한정
- \`reusable_aso_techniques\` 의 각 항목은 충분히 구체적이어야 함. "좋은 스크린샷을 쓴다" 같은 추상 금지
- \`market_fit_notes\` 는 제공된 target_markets 에 대해서만 작성. 없는 시장은 빈 문자열
- 'ASO 는 게임성을 부각하는 기술' 이므로 스토어 자산이 **실제 게임보다 과장했는지/부각 잘했는지** 도 판단 대상 — 단 판단 근거는 자산 자체, 외부 리뷰 아님`;

/**
 * 슬롯 분석을 압축. 전체 JSON 덤프 대신 핵심 필드만 추려 토큰 절약.
 */
function compressSlotAnalysis(
  slot: { slot_number: number; analysis: Record<string, unknown> | null }
): string {
  const a = slot.analysis ?? {};
  const pick = (path: string): unknown => {
    const keys = path.split(".");
    let cur: unknown = a;
    for (const k of keys) {
      if (cur && typeof cur === "object" && k in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return cur;
  };

  const role = pick("slot_role") ?? "?";
  const layout = pick("layout_archetype") ?? "?";
  const captionText = pick("caption.approximate_text_if_readable") ?? "";
  const captionPresent = pick("caption.present");
  const firstEye = pick("visual_hierarchy.first_eye_catch") ?? "?";
  const mood = pick("color_palette.overall_mood") ?? "?";
  const polish = pick("quality_signals.polish_level") ?? "?";
  const why = pick("what_makes_it_work") ?? "";

  return [
    `[슬롯 ${slot.slot_number}]`,
    `- role: ${role}`,
    `- layout: ${layout}`,
    `- first_eye_catch: ${firstEye}`,
    `- mood: ${mood}`,
    `- polish: ${polish}`,
    captionPresent
      ? `- caption: "${captionText}"`
      : "- caption: (없음)",
    why ? `- what_makes_it_work: ${why}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildGameAsoSynthesisPrompt(input: {
  // 메타
  title: string;
  genre: string;
  country: string;
  target_markets: string[] | null;
  monetization_model: string | null;
  studio_size: string | null;
  selection_basis: string | null;
  // L1 결과
  icon_analysis: Record<string, unknown> | null;
  text_analysis: Record<string, unknown> | null;
  screenshot_slots: Array<{
    slot_number: number;
    analysis: Record<string, unknown> | null;
  }>;
  monetization_raw: Record<string, unknown> | null;
  has_video: boolean;
}): string {
  const markets =
    input.target_markets && input.target_markets.length > 0
      ? input.target_markets.join(", ")
      : "(미지정)";

  const slotSection =
    input.screenshot_slots.length > 0
      ? input.screenshot_slots
          .sort((a, b) => a.slot_number - b.slot_number)
          .map(compressSlotAnalysis)
          .join("\n\n")
      : "(스크린샷 슬롯 분석 결과 없음)";

  const iconSection = input.icon_analysis
    ? JSON.stringify(input.icon_analysis, null, 2)
    : "(아이콘 분석 결과 없음)";

  const textSection = input.text_analysis
    ? JSON.stringify(input.text_analysis, null, 2)
    : "(텍스트 분석 결과 없음)";

  const monetSection = input.monetization_raw
    ? JSON.stringify(input.monetization_raw, null, 2)
    : "(수익모델 힌트 없음)";

  return `## 대상 게임

- 제목: ${input.title}
- 장르: ${input.genre}
- 수집 country: ${input.country}
- 강한 시장 (target_markets): ${markets}
- 수익모델 (분류): ${input.monetization_model ?? "(미지정)"}
- 스튜디오 규모: ${input.studio_size ?? "(미지정)"}
- 선별 근거: ${input.selection_basis ?? "(미지정)"}
- 홍보 영상 보유: ${input.has_video ? "예" : "아니오"}

---

## L1 아이콘 분석 (JSON)

\`\`\`json
${iconSection}
\`\`\`

---

## L1 텍스트(제목·서브·설명) 분석 (JSON)

\`\`\`json
${textSection}
\`\`\`

---

## 스크린샷 슬롯별 핵심 관찰 (압축본)

${slotSection}

---

## 수익모델 힌트 (스토어 스크래퍼 raw)

\`\`\`json
${monetSection}
\`\`\`

---

## 요청

시스템 프롬프트의 JSON 스키마대로 **이 게임이 ASO 를 어떻게 했길래 잘 작동했는지** 합성하세요.

- 게임성·운영·IP·외부 광고 등 ASO 밖 요인은 분석 근거 금지
- 재사용 가능한 ASO 수법(reusable_aso_techniques) 은 구체적·실행 가능하게
- 인디 적용 가능성 반드시 태깅
- market_fit_notes 는 제공된 target_markets 만 채우고 나머지는 빈 문자열
- JSON 만 출력`;
}
