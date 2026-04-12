/**
 * ASO 핵심 원칙 — ASO bible(장르별 벤치마크) + ASO optimization guide(트렌드/전략) 문서 발췌.
 *
 * 용도:
 *   - Stage 8 주문 분석 프롬프트에 주입
 *   - Reference Library 분석 프롬프트에 주입
 *   - 같은 원칙·기준을 두 파이프라인이 공유하기 위한 Source of Truth.
 *
 * 업데이트 정책:
 *   - ASO bible / optimization guide 문서가 갱신되면 이 모듈을 함께 갱신.
 *   - 장르별 구체 벤치마크는 Reference Library(DB)로 대체되어 가고 있지만,
 *     "원칙·기준" 계층은 이 모듈이 담당.
 *
 * 출처:
 *   - /Users/cj/projects/indiegame/ASO-bible-by-genre-2026.md
 *   - /Users/cj/projects/indiegame/ASO-optimization-guide-2026.md
 */

/**
 * 스토어별 ASO 필드 규칙.
 *
 * Google Play ↔ Apple App Store 는 필드 구조와 한도가 다르다. 프롬프트가
 * 이 차이를 모르면 잘못된 길이·구성의 결과물이 나온다.
 */
export const STORE_FIELD_RULES = {
  google_play: {
    title: { max: 30, unit: "chars" },
    short_description: { max: 80, unit: "chars", note: "검색 결과에 노출" },
    full_description: {
      max: 4000,
      unit: "chars",
      note: "첫 250자 내외가 '더보기' 전 노출되어 결정적",
    },
    screenshots: {
      min_per_device: 2,
      max_per_device: 8,
      orientation: "세로/가로 선택 가능",
      note: "첫 3장이 검색 결과 스낵 썸네일로 노출",
    },
    feature_graphic: {
      size: "1024×500",
      required: false,
      note: "권장 — 프로모션/가로형 진열 시 노출 (에디터스 초이스·피처드 요건)",
    },
    promo_video: { note: "선택, 전환율 유의미하게 상승" },
    icon: { size: "512×512", format: "PNG" },
  },
  apple_app_store: {
    title: { max: 30, unit: "chars" },
    subtitle: { max: 30, unit: "chars", note: "검색 랭킹 인자" },
    promotional_text: {
      max: 170,
      unit: "chars",
      note: "수시 변경 가능 (심사 없이)",
    },
    description: { max: 4000, unit: "chars" },
    keywords: {
      max: 100,
      unit: "chars",
      note: "콤마 구분, 비공개 메타필드, iOS 주요 검색 랭킹 인자",
    },
    screenshots: {
      min_per_device: 3,
      max_per_device: 10,
      note: "첫 3장이 검색 결과에 노출",
    },
    preview_video: { max_count: 3, note: "전환율 강력 영향" },
    icon: { size: "1024×1024", format: "PNG" },
  },
} as const;

/**
 * 장르별 기본 슬롯 전략 (ASO bible 5.3절, 일반 가이드).
 * 절대 규칙이 아님 — 의뢰 게임 특성에 따라 해석.
 */
export const GENRE_SLOT_DEFAULTS: Record<
  string,
  {
    count_range: [number, number];
    orientation: string;
    text_density: "minimal" | "moderate" | "heavy";
    notes: string;
  }
> = {
  puzzle: {
    count_range: [5, 8],
    orientation: "세로 중심",
    text_density: "moderate",
    notes: "콤보/폭발 이펙트 강조, 레벨 수·기능 콜아웃",
  },
  rpg: {
    count_range: [5, 8],
    orientation: "세로+가로 혼용",
    text_density: "moderate",
    notes: "캐릭터 아트·전투·오픈월드 교차, 수상 뱃지",
  },
  strategy: {
    count_range: [8, 10],
    orientation: "세로 중심",
    text_density: "heavy",
    notes: "볼드 시네마틱 문구, 전쟁 스케일",
  },
  simulation: {
    count_range: [8, 10],
    orientation: "세로+가로 혼용",
    text_density: "minimal",
    notes: "비주얼 우선, 텍스트 최소화",
  },
  casual: {
    count_range: [5, 8],
    orientation: "세로 중심",
    text_density: "moderate",
    notes: "마케팅형 또는 미니멀, 감정 호소",
  },
  card: {
    count_range: [5, 8],
    orientation: "세로",
    text_density: "moderate",
    notes: "덱 빌딩 UI, 경쟁 요소",
  },
  action: {
    count_range: [5, 8],
    orientation: "세로+가로",
    text_density: "moderate",
    notes: "역동적 구도, 스킬 이펙트",
  },
  arcade: {
    count_range: [5, 8],
    orientation: "세로",
    text_density: "minimal",
    notes: "직관적 게임플레이, 점수/스피드 강조",
  },
  sports: {
    count_range: [5, 8],
    orientation: "가로 선호",
    text_density: "moderate",
    notes: "실감 나는 필드감, 라이선스 로고",
  },
  racing: {
    count_range: [5, 8],
    orientation: "가로",
    text_density: "minimal",
    notes: "속도감, 차량 라인업",
  },
};

/**
 * 타겟 시장별 ASO 특성 (ASO optimization guide 발췌).
 * 한국은 기본 타겟, 글로벌 확장은 아래 시장별 특성을 참고.
 */
export const MARKET_CHARACTERISTICS: Record<
  string,
  {
    language: string;
    keyword_behavior: string;
    visual_preferences: string;
    monetization_note: string;
  }
> = {
  kr: {
    language: "한국어 (기본)",
    keyword_behavior: "한글 키워드 + 장르 영문 키워드 병기 흔함",
    visual_preferences:
      "캐릭터 중심, 밝은 색감, 카피 밀도 높음, 이벤트/출석체크 UX 친숙",
    monetization_note: "가챠·시즌패스 수용도 높음. IAP 평균 지출 상위권",
  },
  jp: {
    language: "일본어",
    keyword_behavior:
      "카타카나/히라가나 혼용. 약어(例: RPG, ソシャゲ) 흔함. 한자 비율 낮추는 편",
    visual_preferences: "애니메이션 스타일, 캐릭터 일러스트 큼직, 감성적 카피",
    monetization_note: "가챠 주류, 유료 다운로드도 여전히 존재",
  },
  us: {
    language: "영어",
    keyword_behavior:
      "'Match 3', 'RPG', 'Puzzle' 등 장르 키워드 + 동사형 훅(Blast/Crush/Build)",
    visual_preferences:
      "폴리싱·광택 강조, 경쟁 게임 대비 프리미엄 룩, 영문 카피 크기 큼",
    monetization_note: "F2P 주류, 광고형·구독형 상승 중",
  },
  cn: {
    language: "중국어 간체",
    keyword_behavior: "Apple 중국 스토어는 자체 검색 로직, 키워드 매우 중요",
    visual_preferences: "캐릭터·서사 중심, 고밀도 카피, IP 기반 강함",
    monetization_note: "가챠·시즌패스·VIP 레벨, 검열 이슈 주의",
  },
  tw: {
    language: "중국어 번체",
    keyword_behavior: "번체+영문 혼용 흔함, 일본식 서브컬처 키워드 통용",
    visual_preferences: "일본·한국 감성 영향, 애니메이션 스타일 선호",
    monetization_note: "가챠 수용도 높음",
  },
  global_en: {
    language: "영어 (글로벌 기본)",
    keyword_behavior: "장르 키워드 필수 + 동사형 훅",
    visual_preferences: "범용 폴리싱, 과도한 로컬 문화 요소는 피함",
    monetization_note: "시장별 차이 크므로 스토어 리스팅에서는 일반화 주의",
  },
};

/**
 * 품질 바 — 프로 vs 아마추어를 가르는 요소.
 * ASO bible 5.3 + optimization guide 3.3 종합.
 */
export const QUALITY_BAR = {
  pro_essentials: [
    "계층적 타이포그래피 (헤드 Bold Extra + 서브 Medium + 액센트)",
    "2~3단 드롭섀도우 / 글로우 (글자가 '떠' 있음)",
    "그라디언트 배경 (2색 이상 blend)",
    "이미지에 마스크/오버레이 적용",
    "SVG 장식 요소 (아이콘·별·리본·배지·하이라이트)",
    "극적 색 대비 (네온/화이트 vs 다크베이스)",
    "광원 방향성 (빛이 어디서 오는지 느껴짐)",
    "무음 자동재생 환경에서도 메시지 전달",
    "첫 3장에 검색 hook (게임 정체성을 즉시 이해)",
  ],
  amateur_failures: [
    "단색 배경 + 글자 박스",
    "폰트 1개로 모든 텍스트 처리",
    "드롭섀도우 없음 (글자가 평면)",
    "게임 스크린샷을 날것 그대로 박아둠",
    "장식 요소 0",
    "색 대비 부족 (흐리멍덩)",
    "캡션 텍스트 없음 (검색 랭킹 인자 누락)",
  ],
} as const;

/**
 * ASO 원칙 — 분석·생성 모두에 공통 적용.
 */
export const ASO_CORE_PRINCIPLES = [
  "ASO 바이블/가이드 문서의 장르별 권장(슬롯 수·카피 밀도·시각 방향)은 일반 가이드다. 절대 규칙 아님.",
  "의뢰 게임의 고유 경쟁력이 원칙보다 우선. 장르 공식의 기계적 적용 금지.",
  "첫 3장의 스크린샷이 검색 결과에 노출 → hook 강도 결정적.",
  "캡션 텍스트는 검색 랭킹 인자이자 무음 환경 메시지 전달 수단. 누락 = 아마추어.",
  "경쟁작 실명 인용 + 실제 현재 문구 근거. 막연한 '탑 게임들' 금지.",
  "반전 인사이트는 '있을 때만 품질 있게' 추출. 억지로 3개 채우기 금지.",
  "한국이 기본 타겟. 의뢰 target_market에 일본·미국·중국 등이 있으면 해당 시장 특성에 맞춰 확장.",
  "스토어별 필드 차이 엄수 — Google Play에는 subtitle 없음(short_description 80자). Apple은 subtitle 30자 + promotional_text 170자.",
  "결과물·고객 대면 문서에 AI·자동·알고리즘 단어 금지. 결과물은 전문 큐레이션 관점으로 서술.",
  "'완성물까지 제작'이 이 서비스의 차별점 — 리포트만 주는 일반론 금지.",
] as const;

/**
 * 시스템 프롬프트에 주입할 수 있도록 문자열 블록으로 직렬화.
 * Stage 8 / Library 분석 프롬프트가 이걸 가져다 쓴다.
 */
export function renderAsoPrinciplesBlock(): string {
  const principles = ASO_CORE_PRINCIPLES.map((p, i) => `${i + 1}. ${p}`).join(
    "\n"
  );

  const proEssentials = QUALITY_BAR.pro_essentials
    .map((s) => `- ${s}`)
    .join("\n");
  const amateurFailures = QUALITY_BAR.amateur_failures
    .map((s) => `- ${s}`)
    .join("\n");

  const stores = `
### Google Play
- Title: 최대 30자
- Short description: 최대 80자 (검색 결과 노출)
- Full description: 최대 4000자 (첫 250자 내외가 '더보기' 전 노출)
- Screenshots: 2~8장, 첫 3장이 검색 결과 스낵 썸네일
- Feature graphic (1024×500) 권장
- Subtitle 필드 **없음** (주의)

### Apple App Store
- Title: 최대 30자
- **Subtitle: 최대 30자** (검색 랭킹 인자, Google Play와 다름)
- Promotional text: 최대 170자 (심사 없이 수시 변경)
- Description: 최대 4000자
- Keywords: 100자 비공개 메타필드 (콤마 구분)
- Screenshots: 3~10장, 첫 3장이 검색 결과 노출
- Preview video: 최대 3개
`.trim();

  const markets = Object.entries(MARKET_CHARACTERISTICS)
    .map(
      ([code, m]) =>
        `- **${code}** (${m.language}): ${m.keyword_behavior}. 비주얼: ${m.visual_preferences}. 수익: ${m.monetization_note}`
    )
    .join("\n");

  return `## ASO 핵심 원칙

${principles}

## 프로 vs 아마추어 품질 바

### 프로 필수 요소
${proEssentials}

### 아마추어 실패 패턴 (회피)
${amateurFailures}

## 스토어별 필드 규칙 (엄수)

${stores}

## 타겟 시장별 특성 (한국이 기본, 아래는 확장 시 참고)

${markets}
`.trim();
}

/**
 * 장르 슬롯 기본값 블록 (프롬프트 주입용).
 */
export function renderGenreSlotDefaults(): string {
  return Object.entries(GENRE_SLOT_DEFAULTS)
    .map(
      ([g, d]) =>
        `- ${g}: ${d.count_range[0]}~${d.count_range[1]}장, ${d.orientation}, 텍스트 ${d.text_density}. ${d.notes}`
    )
    .join("\n");
}
