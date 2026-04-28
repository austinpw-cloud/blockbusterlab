/**
 * Reference Library 패턴·인사이트 합성 프롬프트 (L3).
 *
 * 축 조합에 매칭되는 게임들의 L1+L2 결과(압축본) 를 받아
 * 공통 패턴 + 의사결정 규칙 + edge case + anti-pattern + 축 상호작용 을 합성.
 *
 * 모델: Opus 4.6. L3 산출물은 Library 의 "인사이트 층" — 서비스가 의뢰 처리에 직접 쓰는 지식.
 */

export const PATTERN_SYNTHESIS_SYSTEM_PROMPT = `당신은 게임 ASO 패턴 분석 전문가입니다.
같은 축 조합(장르·시장·수익모델·스튜디오 규모)에 속하는 여러 게임의 ASO 관찰 데이터(L1) 와 개별 ASO 수법 해석(L2) 을 받아,
**공통 패턴 + 의사결정 규칙 + 인사이트** 를 구조화된 JSON 으로 합성합니다.

## ASO 의 본질 — 엄수

ASO 는 **게임성을 "판단"하는 게 아니라 "부각"하는 기술**. 관심 대상:
- 스토어 자산(제목·서브·아이콘·스크린샷·설명·영상) 의 ASO 수법
- 어떻게 첫인상으로 눈길 끌고, 흥미 유발하고, 설치 결심 만드나

**분석 대상 아님**: 게임성·IP·외부 광고·커뮤니티·평점·유저 리뷰 테마.

## 분석 원칙

1. **관찰에 근거한 귀납** — 제공된 게임 데이터에서 실제로 드러나는 것만. 일반론·추측 금지
2. **구체적 수치·비율** — 가능하면 "N/M 게임이 X 를 사용" 형태
3. **소수 패턴도 기록** — 다수 패턴뿐 아니라 variations 로 명시
4. **모순은 숨기지 말 것** — 관찰 간 충돌하면 contradictions 에 기록
5. **인사이트는 근거 게임과 함께** — decision_rules·edge_cases·anti_patterns 각각에 evidence_games 필수
6. 확신 없으면 "uncertain" 또는 해당 필드 생략

## 출력 스키마

반드시 아래 JSON 만 출력. 코드 블록 없이 순수 JSON.

\`\`\`typescript
{
  "axis_scope": {
    "genre": "puzzle",
    "market": "kr" | null,
    "monetization_model": "f2p_iap" | null,
    "studio_size": "indie" | null
  },
  "sample": {
    "size": 8,
    "games": ["게임 타이틀 리스트"]
  },
  "confidence": "high" | "medium" | "low",

  "icon": {
    "common": {
      "composition_distribution": "예: 'character_face_centered 62%, object_centered 25%, logo_typography 13%'",
      "dominant_color_families": ["예: 'warm_gold', 'deep_navy'"],
      "style_distribution": "예: '2d_illustration 70%, 3d_rendered 30%'",
      "frequent_techniques": ["drop_shadow", "gold_outline"]
    },
    "variations": ["다수 아닌 소수 패턴 설명"],
    "avoid_observed": ["이 조합에서 관찰되지 않는 혹은 실패로 드러난 패턴"]
  },

  "title_subtitle": {
    "common_patterns": ["예: '장르 키워드 포함 80%', '한글+영문 병기 60%'"],
    "hook_type_distribution": "예: 'benefit_statement 50%, feature_callout 30%'",
    "market_specific_cues": ["시장에 특화된 언어·표기 관찰"]
  },

  "screenshots": {
    "count_median": 7,
    "count_range": "6~8",
    "first_three_structure": "예: '1. 코어 메카닉 hook → 2. 성장·진행 훅 → 3. 차별화·사회적 증거'",
    "caption_presence_rate": "예: '100% (첫 3장 모두)' 또는 '70%'",
    "orientation_distribution": "예: '세로 95%, 가로 5%'",
    "notable_visual_techniques": ["공통적으로 관찰된 시각 기법"]
  },

  "description": {
    "first_250_hook_distribution": "예: 'benefit_bullet 50%, story_hook 30%'",
    "keyword_repetition_signals": ["자주 반복되는 키워드 경향"],
    "social_proof_usage_rate": "예: '80% 가 수상·다운로드수 인용'",
    "structure_distribution": "예: 'bulleted 60%, paragraph 40%'"
  },

  "video": {
    "presence_rate": 0.75
  },

  "monetization_alignment": {
    "ad_messaging": "ASO 자산에 광고 관련 메시지가 어떻게 반영되는가 (해당 시)",
    "iap_messaging": "과금 구조가 ASO 에 어떻게 드러나는가 (해당 시)",
    "remove_ads_cta": "Remove Ads·Pay Once 류 언급 빈도와 방식"
  },

  "common_pitfalls_observed": [
    "이 조합 게임들에서 공통적으로 드러나는 실패·약점 관찰 (있으면)"
  ],

  "contradictions": [
    {
      "claim_a": "관찰 A",
      "claim_b": "관찰 B",
      "notes": "왜 충돌하는지와 가능한 해석"
    }
  ],

  "indie_applicability_notes": {
    "replicable_from_this_cohort": [
      "인디가 답습 가능한 수법 — 이 축 조합 관찰에서 도출"
    ],
    "aaa_only_strategies_excluded": [
      "이 조합 내 AAA 스튜디오가 사용하는 AAA 전용 수법 — 인디 답습 금지 플래그"
    ]
  },

  "decision_rules": [
    {
      "when": "적용 조건 (의뢰 게임의 어떤 특성·상황)",
      "then": "어떤 패턴·수법 적용",
      "evidence_games": ["근거 게임 타이틀 1~3개"]
    }
  ],
  "edge_cases_and_exceptions": [
    {
      "pattern_broken": "일반 패턴 중 무엇을",
      "condition": "언제 깨도 되는지",
      "evidence_games": ["..."]
    }
  ],
  "anti_patterns_observed": [
    {
      "description": "반복 관찰되는 실패 패턴",
      "why_fails": "왜 작동하지 않는지 (관찰 근거)",
      "evidence_games": ["..."]
    }
  ],
  "cross_axis_interactions": [
    {
      "interacts_with": "다른 축 (예: '수익모델 F2P+광고')",
      "rule": "이 상호작용이 만드는 규칙",
      "evidence_games": ["..."]
    }
  ],
  "commission_derived_insights": []
}
\`\`\`

## 엄격한 규칙

- JSON 외 설명 금지
- \`sample.games\` 는 실제 합성 입력에 포함된 게임 타이틀만 (상상 금지)
- 관찰 빈도 수치("80%" 등) 는 실제 sample 에서 도출 가능할 때만. 아니면 생략
- \`evidence_games\` 배열의 타이틀은 실제 입력된 게임 중에서만 선택
- \`commission_derived_insights\` 는 초기 합성에서 빈 배열로 둠 (의뢰 처리 시 추가)
- \`avoid_observed\` 는 "이 조합에서 관찰되지 않는 패턴 or 실패 사례" 만. 일반론·추측 금지
- 소수 게임 (2~3개) 만 있으면 confidence 는 'low' 로 표기하고 수치 일반화 대신 사례 서술
- **중요 — 규칙 생성 가드**: 입력 프롬프트에 \`allow_rules: false\` 가 표시되면 **\`decision_rules\`, \`edge_cases_and_exceptions\`, \`anti_patterns_observed\`, \`cross_axis_interactions\` 네 필드는 모두 \`[]\` (빈 배열) 로 반환**. 2~3개 샘플에서 "규칙" 을 뽑는 건 예외의 일반화라 금지. 관찰 요약(icon·title·screenshots·description·monetization_alignment·common_pitfalls_observed·contradictions·indie_applicability_notes) 은 평소대로 채움.`;

/**
 * 게임별 L1+L2 를 핵심 필드만 추려 압축. 토큰 절약용.
 */
function compressGameForSynthesis(game: {
  title: string;
  genre: string;
  country: string;
  target_markets: string[] | null;
  monetization_model: string | null;
  studio_size: string | null;
  selection_basis: string | null;
  icon_analysis: Record<string, unknown> | null;
  text_analysis: Record<string, unknown> | null;
  aso_analysis: Record<string, unknown> | null;
  has_video: boolean;
  screenshot_slots: Array<{
    slot_number: number;
    analysis: Record<string, unknown> | null;
  }>;
}): string {
  const pick = (obj: Record<string, unknown> | null, path: string): unknown => {
    if (!obj) return undefined;
    const keys = path.split(".");
    let cur: unknown = obj;
    for (const k of keys) {
      if (cur && typeof cur === "object" && k in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return cur;
  };

  // 아이콘 핵심
  const iconCore = game.icon_analysis
    ? {
        composition: pick(game.icon_analysis, "composition"),
        dominant_color: pick(game.icon_analysis, "dominant_color_hex"),
        style: pick(game.icon_analysis, "overall_style"),
        mood: pick(game.icon_analysis, "mood"),
        techniques: pick(game.icon_analysis, "design_techniques"),
        what_makes_it_work: pick(game.icon_analysis, "what_makes_it_work"),
      }
    : null;

  // 텍스트 핵심
  const textCore = game.text_analysis
    ? {
        title_techniques: pick(game.text_analysis, "title.techniques"),
        title_language_style: pick(game.text_analysis, "title.language_style"),
        short_hook_type: pick(game.text_analysis, "short_description.hook_type"),
        first_250_technique: pick(
          game.text_analysis,
          "full_description.first_250_hook_technique"
        ),
        localization_quality: pick(
          game.text_analysis,
          "full_description.localization_quality"
        ),
        notable_moves: pick(game.text_analysis, "notable_aso_moves"),
      }
    : null;

  // 스크린샷 요약: 슬롯 수 + 첫 3장 role·caption 유무
  const sortedSlots = [...game.screenshot_slots].sort(
    (a, b) => a.slot_number - b.slot_number
  );
  const firstThree = sortedSlots.slice(0, 3).map((s) => ({
    slot: s.slot_number,
    role: pick(s.analysis, "slot_role"),
    caption_present: pick(s.analysis, "caption.present"),
    first_eye_catch: pick(s.analysis, "visual_hierarchy.first_eye_catch"),
  }));

  // L2 핵심
  const l2Core = game.aso_analysis
    ? {
        positioning: pick(game.aso_analysis, "positioning"),
        aso_success_approach: pick(game.aso_analysis, "aso_success_approach"),
        core_hook: pick(game.aso_analysis, "core_hook"),
        reusable_aso_techniques: pick(
          game.aso_analysis,
          "reusable_aso_techniques"
        ),
        indie_applicability: pick(game.aso_analysis, "indie_applicability"),
        monetization_alignment: pick(game.aso_analysis, "monetization_alignment"),
      }
    : null;

  return [
    `## ${game.title}`,
    `- country: ${game.country} / target_markets: ${
      game.target_markets?.join(",") ?? "-"
    }`,
    `- monetization_model: ${game.monetization_model ?? "?"} / studio_size: ${
      game.studio_size ?? "?"
    } / selection_basis: ${game.selection_basis ?? "?"}`,
    `- has_video: ${game.has_video}`,
    `- screenshot_count: ${sortedSlots.length}`,
    `- first_three_slots: ${JSON.stringify(firstThree)}`,
    iconCore ? `- icon_core: ${JSON.stringify(iconCore)}` : "- icon_core: null",
    textCore ? `- text_core: ${JSON.stringify(textCore)}` : "- text_core: null",
    l2Core ? `- l2_core: ${JSON.stringify(l2Core)}` : "- l2_core: null (L2 미분석)",
  ]
    .filter(Boolean)
    .join("\n");
}

export type GameForSynthesis = Parameters<typeof compressGameForSynthesis>[0];

export function buildPatternSynthesisPrompt(input: {
  axis_scope: {
    genre: string;
    market: string | null;
    monetization_model: string | null;
    studio_size: string | null;
  };
  games: GameForSynthesis[];
  /** 규칙 필드 생성 허용 여부. n>=4 에서만 true. false 면 decision_rules 등 4필드는 빈 배열. */
  allow_rules: boolean;
}): string {
  const gamesBlock = input.games.map(compressGameForSynthesis).join("\n\n---\n\n");

  const axisLines = [
    `- genre: ${input.axis_scope.genre}`,
    `- market: ${input.axis_scope.market ?? "* (무관)"}`,
    `- monetization_model: ${input.axis_scope.monetization_model ?? "* (무관)"}`,
    `- studio_size: ${input.axis_scope.studio_size ?? "* (무관)"}`,
  ].join("\n");

  const ruleGuardLine = input.allow_rules
    ? `- allow_rules: true (샘플 n≥4 — 규칙 필드 생성 가능)`
    : `- **allow_rules: false** (샘플 n<4 — decision_rules·edge_cases_and_exceptions·anti_patterns_observed·cross_axis_interactions 4필드는 반드시 \`[]\` 빈 배열. 관찰 요약만 채움)`;

  return `## 축 조합

${axisLines}

## 샘플 크기

${input.games.length} 게임

## 규칙 생성 가드

${ruleGuardLine}

---

## 각 게임의 압축 관찰 데이터

${gamesBlock}

---

## 요청

시스템 프롬프트의 스키마대로 이 축 조합의 **공통 패턴 + 의사결정 규칙 + 인사이트** 를 합성하세요.

- sample.games 는 실제 입력된 게임 타이틀만 포함
- 관찰 수치("N%") 는 sample 에서 도출 가능할 때만
- evidence_games 는 실제 입력 게임 중에서만 선택
- commission_derived_insights 는 빈 배열
- allow_rules 값에 따라 규칙 필드 처리 (위 '규칙 생성 가드' 참조)
- JSON 만 출력`;
}
