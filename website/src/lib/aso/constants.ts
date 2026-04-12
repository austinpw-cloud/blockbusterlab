/**
 * ASO 서비스에서 공통으로 사용하는 상수들.
 * 장르, 타겟 시장, 패키지 정의.
 *
 * DB 스키마의 game_genre / target_market 필드와 id 값이 일치해야 함.
 */

export const GAME_GENRES = [
  { id: "puzzle", label: "퍼즐" },
  { id: "rpg", label: "RPG" },
  { id: "action", label: "액션" },
  { id: "strategy", label: "전략" },
  { id: "simulation", label: "시뮬레이션" },
  { id: "casual", label: "캐주얼" },
  { id: "arcade", label: "아케이드" },
  { id: "sports", label: "스포츠" },
  { id: "racing", label: "레이싱" },
  { id: "card", label: "카드/보드" },
  { id: "other", label: "기타" },
] as const;

export type GameGenreId = (typeof GAME_GENRES)[number]["id"];

export const TARGET_MARKETS = [
  { id: "korea", label: "한국" },
  { id: "global", label: "글로벌 (영어권)" },
  { id: "japan", label: "일본" },
  { id: "china", label: "중국/대만" },
  { id: "seasia", label: "동남아시아" },
  { id: "europe", label: "유럽" },
] as const;

export type TargetMarketId = (typeof TARGET_MARKETS)[number]["id"];

/**
 * Phase 1 패키지 — Google Play 중심.
 * iOS 추가는 Phase 1.5에서 활성화.
 */
export const ASO_PACKAGES = [
  {
    id: "start_google_play",
    label: "스타트 (Google Play)",
    price_krw: 200000,
    description: "Google Play 스토어 ASO 분석 + 결과물 완성본",
    features: [
      "제목/서브타이틀/소개문구 완성본 (각 3개 대안)",
      "키워드 리스트 (30~50개, 우선순위 포함)",
      "스토어 규격 스크린샷 5~8장",
      "스크린샷 제작 가이드 문서",
      "경쟁 게임 5개 분석",
      "2회 무료 수정 (14일 내)",
      "30일 후 무료 후속 점검",
    ],
    active: true,
  },
  {
    id: "basic_both",
    label: "베이직 (iOS + Google Play)",
    price_krw: 350000,
    description: "양쪽 플랫폼 ASO 통합 최적화",
    features: [
      "Google Play + App Store 양쪽",
      "플랫폼별 최적화된 결과물",
      "스타트 패키지 전체 포함",
    ],
    active: false, // Phase 1.5
  },
  {
    id: "global",
    label: "글로벌 (다국어)",
    price_krw: 700000,
    description: "아시아 다국어 지역 최적화",
    features: [
      "iOS + Android 양쪽",
      "2개 언어 지역 최적화 (영/일/중 중 선택)",
      "지역별 스토어 페이지 번역",
    ],
    active: false, // Phase 1.5
  },
] as const;

export type AsoPackageId = (typeof ASO_PACKAGES)[number]["id"];
