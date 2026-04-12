/**
 * Claude 모델 상수 — 하이브리드 전략.
 *
 * 퀄리티 우선 작업엔 Opus, 단순 분석은 Sonnet.
 */

export const MODELS = {
  /** 최고 품질 — ASO 핵심 텍스트 생성 (제목/서브타이틀/소개문구/가이드) */
  OPUS: "claude-opus-4-6" as const,

  /** 빠르고 저렴 — 장르 분류, 벤치마크 비교 분석, 검수 */
  SONNET: "claude-sonnet-4-6" as const,

  /** 가장 경량 — 간단한 분류/추출 (필요 시만 사용) */
  HAIKU: "claude-haiku-4-5-20251001" as const,
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

/**
 * 작업별 권장 모델.
 */
export const MODEL_FOR_TASK = {
  genre_classification: MODELS.SONNET,
  benchmark_analysis: MODELS.SONNET,
  title_generation: MODELS.OPUS,
  description_generation: MODELS.OPUS,
  keyword_generation: MODELS.OPUS,
  screenshot_guide: MODELS.OPUS,
  quality_review: MODELS.SONNET,
} as const;
