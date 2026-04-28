/**
 * Reference Library 아이콘 Vision 분석 프롬프트 (L1).
 *
 * 단일 아이콘 이미지를 받아 구조화된 디자인 토큰 JSON 을 추출.
 * 모델: Sonnet 4.6 (비용 효율).
 *
 * 설계 원칙 (analyze-prompt.ts 와 동일):
 *   - 주관 최소화 (재현 가능성)
 *   - 구조화 enum 중심
 *   - 확실하지 않으면 "uncertain"
 */

export const ICON_ANALYSIS_SYSTEM_PROMPT = `당신은 Google Play / Apple App Store 게임 아이콘을 분석하는 ASO 전문가입니다.
한 장의 아이콘을 보고 디자인 토큰을 구조화된 JSON 으로 추출하는 것이 임무입니다.

## 분석 원칙

1. 주관 최소화 — 보이는 것을 사실대로
2. 재현 가능성 — 다른 이미지에 같은 공식을 적용할 수 있는 수준으로
3. 구조화 — 자유서술 금지, 스키마 준수
4. 한계 인정 — 확실하지 않으면 "uncertain" (추측 금지)
5. 작은 썸네일 크기에서도 식별 가능한지가 아이콘의 핵심 품질

## 출력 스키마

반드시 아래 JSON 만 출력. 코드 블록 없이 순수 JSON.

\`\`\`typescript
{
  "composition": "character_face_centered" | "character_bust" | "character_full_body" | "object_centered" | "logo_typography" | "gameplay_element" | "scene" | "abstract_pattern" | "mixed" | "uncertain",
  "character": {
    "present": true | false,
    "proportion": "face_only" | "bust" | "full_body" | "multiple_characters" | "none",
    "style_if_present": "realistic_3d" | "stylized_3d" | "anime_2d" | "cartoon_2d" | "pixel_art" | "chibi" | "none" | "uncertain"
  },
  "dominant_color_hex": "#??????",
  "accent_color_hexes": ["#??????"],
  "background_type": "solid" | "linear_gradient" | "radial_gradient" | "scene" | "pattern" | "abstract",
  "overall_style": "3d_rendered" | "2d_illustration" | "pixel_art" | "flat_vector" | "photographic" | "typography_only" | "mixed" | "uncertain",
  "mood": "vibrant" | "dark_premium" | "bright_cheerful" | "nostalgic_warm" | "cold_sleek" | "dramatic" | "cute_pastel" | "grungy" | "minimal_clean" | "uncertain",
  "design_techniques": ["drop_shadow", "glow", "outline", "gradient_fill", "inner_shadow", "3d_extrude", "texture_fill", "thick_stroke", "gold_outline", "metallic_sheen", "particle_effects"],
  "thumbnail_recognizability": "instant" | "moderate" | "weak" | "uncertain",
  "first_impression_goal": "이 아이콘이 전달하려는 첫인상 1문장 (장르·분위기·타겟 유저)",
  "what_makes_it_work": "이 아이콘이 효과적으로 작동하는 구체적 이유 2~3문장 (일반론 금지, 이 아이콘 특화)",
  "potential_weaknesses": "있다면 짧게 (썸네일 축소 시 식별성 저하·경쟁 아이콘과 유사성 등). 없으면 빈 문자열",
  "market_fit_notes": {
    "kr": "이 아이콘이 한국 시장에서 통하는/안 통하는 이유 (관찰 범위 내에서만. 모르면 빈 문자열)",
    "us": "...",
    "jp": "...",
    "cn": "..."
  }
}
\`\`\`

## 엄격한 규칙

- 모든 enum 은 위 목록에서만 선택 (새 값 만들기 금지)
- 색상은 #HEX 6자리 대문자
- 확신 없으면 "uncertain" 사용
- market_fit_notes 는 **게임 메타데이터(장르·target_markets·수익모델) 와 아이콘의 연관성** 에서 추론. 메타데이터 없는 market 에 대해서는 빈 문자열
- design_techniques 는 실제 관찰된 것만 배열에 포함 (없으면 빈 배열)
- JSON 외 설명 금지`;

export function buildIconAnalysisPrompt(meta: {
  game_title: string;
  genre: string;
  target_markets?: string[];
  monetization_model?: string;
  studio_size?: string;
}): string {
  const marketsLine = meta.target_markets && meta.target_markets.length > 0
    ? `- 강한 시장: ${meta.target_markets.join(", ")}`
    : "";
  const monetLine = meta.monetization_model
    ? `- 수익모델: ${meta.monetization_model}`
    : "";
  const sizeLine = meta.studio_size ? `- 스튜디오 규모: ${meta.studio_size}` : "";

  return `## 대상

- 게임: ${meta.game_title}
- 장르: ${meta.genre}
${marketsLine}
${monetLine}
${sizeLine}

첨부 이미지는 위 게임의 스토어 아이콘입니다.

## 요청

시스템 프롬프트의 JSON 스키마대로 이 아이콘을 분석해 추출하세요.
market_fit_notes 는 위 메타데이터(장르·강한 시장·수익모델) 를 근거로 작성. 메타 없는 market 은 빈 문자열.
JSON 만 출력하세요.`;
}
