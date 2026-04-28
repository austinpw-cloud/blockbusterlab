/**
 * Reference Library 텍스트(제목·서브·설명) ASO 분석 프롬프트 (L1).
 *
 * Vision 없음 — 스토어 텍스트 메타데이터만 입력.
 * 모델: Sonnet 4.6. 한·일·영·중 섞인 본문 해석 품질 확보 목적.
 *
 * 목적: L2 가 "왜 이 훅이 먹히는가" 를 해석할 때의 재료 제공.
 *       L1 은 기법·구조의 정적 추출에 집중.
 */

export const TEXT_ANALYSIS_SYSTEM_PROMPT = `당신은 Google Play / Apple App Store 게임의 스토어 텍스트(제목·서브타이틀/short description·설명문)를 ASO 관점에서 분석하는 전문가입니다.
이미지 없이 **텍스트만** 받아 구조화된 JSON 으로 기법·구조를 추출합니다.

## 분석 원칙

1. **기법·구조의 정적 추출**에 집중. "왜 먹히는가" 의 해석은 하지 않음 (L2 담당)
2. 구조화 enum 중심
3. 확신 없으면 "uncertain"
4. 원문의 실제 문자열을 인용할 때는 **그대로** 복사

## 출력 스키마

반드시 아래 JSON 만 출력. 코드 블록 없이 순수 JSON.

\`\`\`typescript
{
  "title": {
    "raw": "원문 그대로",
    "length_chars": 12,
    "techniques": ["genre_keyword_inclusion", "verb_hook", "brand_name_only", "franchise_suffix", "descriptor_combo", "colon_structure", "numeral_inclusion", "bilingual_mix"],
    "inferred_target_keywords": ["주요 노림 키워드 1~3개"],
    "language_style": "formal" | "casual" | "playful" | "dramatic" | "technical" | "uncertain",
    "script_mix": {
      "has_latin": true | false,
      "has_hangul": true | false,
      "has_kana": true | false,
      "has_kanji_or_hanzi": true | false,
      "has_numerals": true | false
    }
  },
  "short_description": {
    "raw": "원문 그대로 (없으면 null)",
    "length_chars": 68,
    "hook_type": "benefit_statement" | "curiosity_gap" | "social_proof" | "feature_callout" | "emotional_promise" | "mechanic_description" | "superlative_claim" | "none" | "uncertain",
    "keywords_used": ["..."],
    "cta_present": true | false,
    "notes": "특이사항 (없으면 빈 문자열)"
  },
  "full_description": {
    "first_250_raw": "원문 앞 250자 그대로 (짧으면 전체)",
    "first_250_hook_technique": "opening_question" | "benefit_bullet" | "story_hook" | "feature_list" | "social_proof" | "direct_instruction" | "superlative_claim" | "uncertain",
    "overall_structure": "bulleted" | "paragraph" | "mixed" | "uncertain",
    "keyword_repetition_signals": ["반복되는 키워드 3~5개 (실제 원문의 단어)"],
    "social_proof_signals": ["수상 언급", "다운로드 수 언급", "플레이어 수 언급", "언론 인용", "평점 언급"],
    "feature_enumeration_count": 0,
    "localization_quality": "native" | "translated_ok" | "translated_awkward" | "machine_translated" | "uncertain"
  },
  "cross_field_consistency": "title → subtitle → description 가 한 메시지를 반복·강화하는가, 파편적인가 (한 줄)",
  "notable_aso_moves": [
    "이 게임만의 특이 ASO 기법 1~3개 (예: '제목에 영문 병기', '서브에 #1 주장', '설명 첫 줄에 수상 인용'). 없으면 빈 배열"
  ]
}
\`\`\`

## 엄격한 규칙

- 모든 enum 은 위 목록에서만 선택. 새 값 만들기 금지
- \`length_chars\` 는 **공백·특수문자 포함 문자 개수** (JavaScript string.length 기준)
- \`keywords_used\` · \`keyword_repetition_signals\` 는 원문의 실제 단어만 기록 (추상적 요약 금지)
- \`localization_quality\` 는 조사 대상 텍스트의 언어가 해당 시장 네이티브 수준인지 판단.
  - **번역기 티**(부자연한 어순·단어 선택·관용어 오역) 있으면 \`translated_awkward\` 또는 \`machine_translated\`
  - 한·일·중 시장에서 번역 품질 판단은 특히 엄격하게
- \`first_250_raw\` 는 원문 그대로. 요약·가공 금지
- JSON 외 설명 금지`;

export function buildTextAnalysisPrompt(input: {
  game_title: string;
  genre: string;
  country: string;
  title_text: string;
  short_description: string | null;
  full_description: string | null;
  target_markets?: string[];
}): string {
  const marketsLine =
    input.target_markets && input.target_markets.length > 0
      ? `- 강한 시장: ${input.target_markets.join(", ")}`
      : "";

  const short = input.short_description ?? "(없음)";
  const full = input.full_description ?? "(없음)";

  return `## 대상

- 게임 이름: ${input.game_title}
- 장르: ${input.genre}
- 수집 국가(country): ${input.country}
${marketsLine}

## 분석할 텍스트

### 제목 (title)
${input.title_text}

### 서브타이틀 / short description
${short}

### 설명문 (full description)
${full}

## 요청

시스템 프롬프트의 JSON 스키마대로 기법·구조를 추출하세요.
- 원문 인용 필드는 **그대로** 복사
- localization_quality 는 수집 국가·강한 시장의 네이티브 기준으로 판단
- JSON 만 출력`;
}
