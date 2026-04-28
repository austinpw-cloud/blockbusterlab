/**
 * ASO 원칙·상수 — `docs/aso/knowledge.md` 의 기계 판독용 구현.
 *
 * 출처: `docs/aso/knowledge.md` + `docs/aso/raw-notes/`
 * 갱신 정책: knowledge.md 가 바뀌면 이 모듈을 함께 갱신. 반대 방향도 동일.
 * 사용처: Stage 8 분석 프롬프트 (aso-generation.ts) + Library 분석 프롬프트
 */

/**
 * 스토어별 ASO 필드 규칙 (하드 룰).
 * 출처: Apple App Store Connect Help / Google Play Console Help — 2026-04 확인
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
      recommended_ratio: "8:5",
      min_resolution: "1920x1200",
      max_size_mb: 8,
      note: "첫 3장이 검색 결과 스낵 썸네일로 노출",
    },
    feature_graphic: {
      size: "1024×500",
      format: "JPEG 또는 24-bit PNG (알파 없음)",
      required: false,
      note: "권장 — 프로모션/가로형 진열 노출 (에디터스 초이스·피처드 요건)",
    },
    promo_video: {
      source: "YouTube 공개 링크 1개",
      restrictions: "Shorts·Live 불가, 수익화 OFF",
      note: "첫 30초만 autoplay",
    },
    icon: { size: "512×512", format: "PNG 32-bit (알파 포함)", max_kb: 1024 },
    custom_store_listings: {
      max_count: 50,
      note: "국가·URL·검색 키워드·사용자 상태 타겟. 국가 중복 불가",
    },
  },
  apple_app_store: {
    title: { max: 30, unit: "chars" },
    subtitle: { max: 30, unit: "chars", note: "검색 랭킹 인자" },
    promotional_text: {
      max: 170,
      unit: "chars",
      note: "버전 제출 없이 수시 변경 가능. Apple 공식: 검색 랭킹 영향 없음",
    },
    description: {
      max: 4000,
      unit: "chars",
      note: "공식 페이지 숫자 미기재, 업계 통용 4,000자 — 재검증 필요",
    },
    keywords: {
      max: 100,
      unit: "chars",
      note: "콤마 구분, 비공개 메타필드, iOS 주요 검색 랭킹 인자",
    },
    screenshots: {
      min_per_device: 1,
      max_per_device: 10,
      iphone_6_9_resolution: "1290×2796 또는 2796×1290",
      ipad_13_resolution: "2064×2752 또는 2048×2732",
      note: "첫 1~3장이 검색 결과에 노출 (방향성에 따라 달라짐)",
    },
    app_preview: {
      max_per_locale_per_device: 3,
      duration_sec: "15~30",
      max_size_mb: 500,
      iphone_resolution: "886×1920 또는 1920×886",
      note: "음소거 자동재생 — 첫 몇 초의 시각적 임팩트 중요",
    },
    icon: {
      size: "1024×1024",
      format: "PNG no-alpha",
      note: "HIG 페이지 JS 렌더링이라 직접 확인 실패 — 통용값",
    },
    custom_product_pages: {
      max_count: 70,
      note: "키워드 할당 가능 — 해당 쿼리 검색 결과에 default 대신 노출됨 (WWDC25)",
    },
    in_app_events: {
      concurrent_max: 10,
      approved_buffer_max: 15,
      note: "시즌 업데이트·콜라보·경쟁 이벤트에 효과적. 단순 세일 불가",
    },
  },
} as const;

/**
 * 장르별 슬롯 기본값 (출발점, 변경 빈도 낮음).
 *
 * NOTE: 구체 아이콘·스크린샷·카피 패턴은 이 상수에 고정하지 **않는다**.
 * Reference Library 의 귀납 관찰이 완료되면 Library 쿼리가 이 기본값을
 * 덮어쓴다. 본 상수는 Library 미구축 장르의 안전한 디폴트로만 사용.
 */
export const GENRE_SLOT_DEFAULTS: Record<
  string,
  {
    count_range: [number, number];
    orientation: "portrait" | "landscape" | "mixed";
  }
> = {
  puzzle: { count_range: [5, 8], orientation: "portrait" },
  rpg: { count_range: [5, 8], orientation: "mixed" },
  strategy: { count_range: [8, 10], orientation: "portrait" },
  simulation: { count_range: [8, 10], orientation: "mixed" },
  casual: { count_range: [5, 8], orientation: "portrait" },
  card: { count_range: [5, 8], orientation: "portrait" },
  action: { count_range: [5, 8], orientation: "mixed" },
  arcade: { count_range: [5, 8], orientation: "portrait" },
  sports: { count_range: [5, 8], orientation: "landscape" },
  racing: { count_range: [5, 8], orientation: "landscape" },
  adventure: { count_range: [5, 8], orientation: "mixed" },
  board: { count_range: [5, 8], orientation: "portrait" },
  word: { count_range: [5, 8], orientation: "portrait" },
};

/**
 * 타겟 시장별 ASO 특성.
 * 출처: `docs/aso/knowledge.md` §4.2 + `docs/aso/raw-notes/markets.md`
 * 스코프: 한국(KR) · 미국(US) · 일본(JP) · 중국(CN) 4개 확정.
 */
export const MARKET_CHARACTERISTICS: Record<
  string,
  {
    language: string;
    platform_split: string;
    keyword_behavior: string;
    visual_preferences: string;
    narrative_preferences: string;
    monetization_reception: string;
    regulation: string;
    localization_quality: string;
    review_culture: string;
    external_channels: string;
    separate_track?: boolean;
  }
> = {
  kr: {
    language: "한국어 (기본)",
    platform_split: "Android 매출 75% / iOS 25% (Sensor Tower 2025 H2)",
    keyword_behavior:
      "한글 기본 + 장르 영문 병기 흔함 (방치형 RPG, MMORPG). 숏테일은 대형 IP 점유 → 인디는 롱테일 필수",
    visual_preferences:
      "MMORPG: 캐릭터 풀샷 + 금·진홍 톤 + 큰 타이틀 로고. 캐주얼: 글로벌 템플릿 수용. 스크린샷 첫 3장 한글 카피 필수",
    narrative_preferences:
      "미드코어는 경쟁·스펙트럼 카피(서버 최강·실시간 PvP). 캐주얼·방치형은 실용(광고 없이·오프라인·출퇴근)",
    monetization_reception:
      "F2P + 가챠 + 배틀패스 지배. RPG 매출 52% (2024 Sensor Tower). Premium 선불 약함. 구독 약함",
    regulation: "GRAC 등급 필수. 확률형 아이템 공시 의무 (2024-03 시행)",
    localization_quality:
      "번역기 티 즉시 거부 — 네이티브 카피 요구 (일본과 동급). 인디 자동 번역 그대로 출시 금지",
    review_culture:
      "Google Play 리뷰 활발. 3점대는 의심, 4.3+ 기본 기대. 집단 별점 하락 빠름",
    external_channels:
      "유튜브·쇼츠·나무위키·루리웹·인벤 경유 비중 큼 — ASO 단독으로 인디 유입 불가",
  },
  us: {
    language: "영어",
    platform_split:
      "양대 스토어 1차 타깃. 다운로드 Google Play 우위, 매출 iOS 우위 (공식 숫자 없음)",
    keyword_behavior:
      "장르·기분 검색 (city builder, match 3, relaxing offline). 숏테일 AAA 점유 → 인디는 롱테일+negative keyword",
    visual_preferences:
      "하이퍼캐주얼: Voodoo/Zynga 간결·대비. 미드코어·RPG: 폴리싱 3D. 스크린샷 텍스트 여백 많고 짧음 (중·일 대비)",
    narrative_preferences:
      "최상급 카피 허용 (Best·#1·Million Players). 즉시 이해되는 재미 제안 + 커뮤니티 훅(Play with friends)",
    monetization_reception:
      "F2P 주류. 광고 수용도 세계 최고 (리워드 광고 중심). 구독 (Apple Arcade·Netflix Games) 점진 성장",
    regulation:
      "COPPA (13세 미만) · ATT · CCPA. 주별 loot box·AI 표기 법안 증가. Kids Category 별도 리뷰",
    localization_quality: "영어 원어면 논점 없음. 미국 슬랭 자연스러움 — 영국 영어 직이식 위화감",
    review_culture:
      "작성 빈도 매우 높음. 리뷰 응답 문화 정착 — 무응답 감점. 광고 과잉·버그에 즉각 별점 폭락",
    external_channels:
      "TikTok·YouTube·Twitch 광고·스트리머 영향. Reddit r/gamedev·AppStore Reddit 커뮤니티",
  },
  jp: {
    language: "일본어",
    platform_split: "iOS 57% / Android 43% (AppSamurai 2025, 재검증 필요). ARPU 세계 최고",
    keyword_behavior:
      "히라가나·카타카나·한자·영문 혼합 인덱싱 필요. 외래어·게임 용어는 카타카나 우위 (ガチャ·レベル·アクション)",
    visual_preferences:
      "애니메이션·만화풍 일러스트 지배적. 캐릭터 얼굴 클로즈업 아이콘 강세. 실사풍 서구 3D는 전환율 낮은 경향",
    narrative_preferences:
      "세계관·캐릭터·이벤트 스토리 중요. '물량 경쟁'보다 '캐릭터와의 관계' 카피. 긴 텍스트 허용 (미국보다 밀도 높게)",
    monetization_reception:
      "F2P + 가챠 압도적. 세계에서 Premium 이 가장 먹히는 모바일 시장 중 하나. ARPPU 월 $120+ 확인",
    regulation:
      "경품표시법 — 가챠 확률 공시, 레어 아이템 기대금액 1회 100배·5만엔 이내. 컴플리트 가챠 전면 금지. 자금결제법 프리페이드 공탁 의무. 카피 과장 금지 (2021 Square Enix 처분)",
    localization_quality:
      "네이티브 필수. 경어·존칭·캐릭터 말투 일관성. AI 티 즉시 거부",
    review_culture:
      "작성 빈도 미국보다 낮음. 3점 = '보통/좋음' 해석 주의. 부정 리뷰는 구체적·길게",
    external_channels: "Twitter(X)·YouTube·니코니코·Pixiv — 캐릭터·IP 중심 커뮤니티",
  },
  cn: {
    language: "간체 중국어 (중화권 확장 시 번체 별도)",
    platform_split:
      "iOS 디바이스 20~25% (매출 기여 압도). Google Play 부재, Android 400+ 서드파티 (Huawei ~25% / Tencent MyApp ~13% / Xiaomi ~12%). TapTap 인디 친화",
    keyword_behavior:
      "간체 기본. 장르 어휘 풍부 (放置·卡牌·策略·仙侠·武侠·三国). 병음 검색 드묾 — 한자 직접 타이핑",
    visual_preferences:
      "고밀도 UI·많은 카피·선명한 대비·원색 (서구·일본보다 dense). 실사·반실사 3D 우위. 붉은·금색 = 운·부유",
    narrative_preferences:
      "선협·무협·삼국 고전 IP 기반이면 즉시 문맥. 가족·집단 가치 카피 (光宗耀祖). 최상급 카피는 신광고법 주의",
    monetization_reception:
      "F2P + 가챠·배틀패스 지배. Premium 은 Apple App Store 에서만 실질 가능. 구독 약함",
    regulation:
      "판호(ISBN) 없이 본토 iOS·Android 정식 유통·과금 불가. 수입 판호 연간 100여 개. 실명 인증·미성년 주당 3시간 의무. 상하이 2025-07 외국 게임 파일럿 경로",
    localization_quality:
      "간체 필수, 번체(TW·HK) 별도. 번역기 티 즉시 거부. UI 폰트·행간 재조정",
    review_culture:
      "TapTap 커뮤니티 리뷰가 실질 구매 의사결정. 쇼트비디오 (Douyin) 리뷰/플레이 영상이 사실상 '리뷰 문화'",
    external_channels:
      "쇼트비디오 (Douyin·Bilibili) 41% 가 신규 게임 인지 경로 (Niko Partners 2025). 스토어 검색 38.7%",
    separate_track: true,
  },
};

/**
 * 품질 바 — 범용 (장르·규모 무관).
 * 장르·시장·수익모델 의존 디테일은 본 상수에 넣지 않는다.
 */
export const QUALITY_BAR = {
  pro_essentials: [
    "계층적 타이포그래피 (헤드 Bold + 서브 Medium + 액센트)",
    "드롭섀도우 / 글로우 — 글자가 '떠' 있음",
    "그라디언트 또는 이미지 배경 + 오버레이 — 평면 금지",
    "첫 3장에 검색 hook (게임 정체성 즉시 이해)",
    "무음 자동재생 환경에서도 메시지 전달 (캡션 포함)",
    "작은 썸네일 크기에서도 식별 가능한 아이콘",
    "평점 4.0 이상 유지 (피처링 허들)",
  ],
  amateur_failures: [
    "단색 배경 + 장식 없는 글자 박스",
    "폰트 1종으로 모든 텍스트 처리",
    "드롭섀도우·글로우 없음 — 글자가 평면",
    "게임 스크린샷을 날것 그대로 박아둠 (2.3.3 위반 여지)",
    "캡션 텍스트 없음 — 무음 환경 메시지 전달 수단 누락",
    "색 대비 부족 (썸네일 크기에서 식별 불가)",
  ],
} as const;

/**
 * AAA 전용 전략 (인디 답습 금지).
 * knowledge.md §4.4 기반.
 */
export const INDIE_NOT_APPLICABLE_STRATEGIES = [
  "시즌·콜라보마다 아이콘 전면 교체 (Supercell Pass Royale 급 운영 전제)",
  "유료 CPP 광고 매칭 (Apple Search Ads 대규모 예산 전제)",
  "30+ 언어 동시 로컬라이제이션",
  "월 단위 미만 크리에이티브 A/B 로테이션 (표본 부족으로 노이즈 지배)",
  "대형 IP 콜라보 피처링 협상 (Apple/Google 파트너 매니저 접점 전제)",
  "국가·세그먼트별 CPP 10개+ 운영 (트래픽 세그먼트 충분해야 의미)",
] as const;

/**
 * 인디에게 특히 중요한 전략.
 */
export const INDIE_RECOMMENDED_STRATEGIES = [
  "장르 롱테일 키워드 공략 (숏테일은 AAA 점유)",
  "첫 3장 스크린샷 hook 품질 강화 (규모 무관 1순위)",
  "리뷰 응답 템플릿화 + 주 1~2회 배치 (Google Play Reply API 활용)",
  "장르 오버랩 스트리머·커뮤니티 외부 UA (Balatro 류 사례)",
  "Store Listing Experiments (Google) / Product Page Optimization (Apple) 무료 도구 적극 활용",
] as const;

/**
 * ASO 원칙 — 분석·생성 프롬프트에 공통 주입.
 */
export const ASO_CORE_PRINCIPLES = [
  "의뢰 게임의 고유 경쟁력이 장르 공식보다 우선. 장르 공식은 일반 가이드일 뿐, 기계 적용 금지.",
  "첫 3장 스크린샷이 검색 결과에 노출 → hook 강도가 CVR 결정적.",
  "경쟁작 실명 인용 + 실제 현재 문구 근거. 막연한 '탑 게임들' 금지.",
  "반전 인사이트는 질적으로 있을 때만 추출. 억지 3개 채우기 금지.",
  "스토어별 필드 차이 엄수 — Google Play 에는 subtitle 없음 (short_description 80자). Apple 은 subtitle 30자 + promotional_text 170자 (랭킹 영향 없음).",
  "Apple 스크린샷 캡션 인덱싱은 공식 명시 없음 — CVR 효과는 별개로 유효 (음소거 자동재생·접근성 목적 필수).",
  "한국·일본 타겟은 번역기 티 즉시 실패 — 네이티브 리라이트 필수.",
  "일본 타겟 가챠 규제 카피 금칙어 — '10배 획득 확정' 류 과장 표현 금지 (경품표시법 위반).",
  "중국은 별도 트랙. 판호 없이 본토 정식 유통·과금 불가. 옵션은 해외판 (HK·TW·SG) 또는 TapTap 글로벌 또는 퍼블리셔 파트너십.",
  "모든 권장안에 인디 적용 가능성 라벨 필수 (indie_recommended | all_sizes | indie_not_applicable).",
  "AAA 전용 전략을 인디에 답습 권장 금지 — 표본 부족 노이즈 + 브랜드 훼손 + 예산 소진 3중 손실.",
  "결과물·고객 대면 문서에 AI·자동·알고리즘 단어 금지. 전문 큐레이션 관점으로 서술.",
] as const;

// ─────────────────────────────────────────────────────────────────────
// 프롬프트 주입용 렌더 함수
// ─────────────────────────────────────────────────────────────────────

/**
 * ASO 핵심 원칙 블록 — 시스템 프롬프트에 주입.
 */
export function renderAsoPrinciplesBlock(): string {
  const principles = ASO_CORE_PRINCIPLES.map((p, i) => `${i + 1}. ${p}`).join(
    "\n"
  );

  const proEssentials = QUALITY_BAR.pro_essentials.map((s) => `- ${s}`).join(
    "\n"
  );
  const amateurFailures = QUALITY_BAR.amateur_failures
    .map((s) => `- ${s}`)
    .join("\n");

  const stores = `
### Google Play
- Title: 최대 30자
- Short description: 최대 80자 (검색 결과 노출)
- Full description: 최대 4000자 (첫 250자 내외가 '더보기' 전 노출)
- Screenshots: 2~8장/디바이스, 첫 3장이 검색 결과 스낵 썸네일, 권장 8:5
- Feature graphic 1024×500 권장 (피처링 요건)
- Promo video: YouTube 공개 링크 1개, Shorts·Live 불가
- Custom Store Listings: 최대 50개 (국가·URL·키워드·사용자 상태 타겟)
- Subtitle 필드 **없음** (주의)

### Apple App Store
- Title: 최대 30자
- **Subtitle: 최대 30자** (검색 랭킹 인자)
- Promotional text: 최대 170자 (수시 변경 가능, **랭킹 영향 없음** — Apple 공식)
- Description: 최대 4000자 (통용, 공식 수치 미기재)
- Keywords: 100자 비공개 메타필드 (콤마 구분, 핵심 랭킹 인자)
- Screenshots: 1~10장/디바이스, 첫 1~3장이 검색 결과 노출
- App Preview: 로케일·디바이스당 최대 3개, 15~30초, 음소거 자동재생
- Custom Product Pages: 최대 70개, 키워드 할당으로 검색 결과 교체 가능
- In-App Events: 동시 10개, 승인 버퍼 15개
`.trim();

  const markets = Object.entries(MARKET_CHARACTERISTICS)
    .map(([code, m]) => {
      const track = m.separate_track ? " · **별도 트랙** (판호 요구)" : "";
      return `- **${code}** (${m.language})${track}\n  - 플랫폼: ${m.platform_split}\n  - 키워드: ${m.keyword_behavior}\n  - 비주얼: ${m.visual_preferences}\n  - 수익: ${m.monetization_reception}\n  - 규제: ${m.regulation}\n  - 현지화: ${m.localization_quality}`;
    })
    .join("\n");

  return `## ASO 핵심 원칙

${principles}

## 프로 vs 아마추어 품질 바 (범용)

### 프로 필수 요소
${proEssentials}

### 아마추어 실패 패턴 (회피)
${amateurFailures}

## 스토어별 필드 규칙 (엄수)

${stores}

## 타겟 시장별 특성

${markets}
`.trim();
}

/**
 * 장르 슬롯 기본값 블록 — Library 관찰이 덮어쓸 때까지의 출발점.
 */
export function renderGenreSlotDefaults(): string {
  const lines = Object.entries(GENRE_SLOT_DEFAULTS).map(([g, d]) => {
    const orientation =
      d.orientation === "portrait"
        ? "세로"
        : d.orientation === "landscape"
          ? "가로"
          : "세로+가로 혼용";
    return `- ${g}: ${d.count_range[0]}~${d.count_range[1]}장, ${orientation}`;
  });
  return [
    "> 출발점 값. Reference Library 관찰 패턴이 있으면 그것이 우선.",
    ...lines,
  ].join("\n");
}

/**
 * 인디 적용 가능성 규칙 블록 — 프롬프트에 주입.
 * AAA 전용 플래그 + 인디 우선 전략을 명시.
 */
export function renderIndieApplicabilityRules(): string {
  const notApplicable = INDIE_NOT_APPLICABLE_STRATEGIES.map(
    (s) => `- ${s}`
  ).join("\n");
  const recommended = INDIE_RECOMMENDED_STRATEGIES.map((s) => `- ${s}`).join(
    "\n"
  );

  return `## 인디 적용 가능성 (모든 권장안에 태깅 필수)

### indie_not_applicable — AAA 전용, 인디 답습 금지
${notApplicable}

### indie_recommended — 인디에 특히 중요
${recommended}

### all_sizes — 전 규모 적용 가능
- 하드 룰 / 기본 위생 / CVR 최적화 원칙은 규모와 무관.

각 권장안 출력 시 반드시 (근거 · 인디 적용도 · 예외 조건) 4-part 구조로 서술.`.trim();
}
