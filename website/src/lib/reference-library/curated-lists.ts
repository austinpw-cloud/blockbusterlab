/**
 * Reference Library 큐레이션 상수 — 수동 관리.
 *
 * 세 경로 중 자동 수집 안 되는 항목:
 *   (1) 장르 키워드 검색용 키워드 세트
 *   (2) ASO 케이스 스터디로 업계 출판물에 인용된 App ID 리스트
 *   (3) 알려진 AAA 스튜디오 whitelist (studio_size 자동 태깅용)
 *
 * 이 파일은 리서치·운영 피드백으로 점진 갱신.
 */

/**
 * 장르 키워드 검색 — Google Play 검색 결과 상위 n개를 수집.
 * 한글·영문 혼용. country 에 따라 적합한 쪽 사용.
 *
 * TODO: 초기 버전. 실제 수집 결과 보고 적절성 보정 필요.
 */
export const SEARCH_KEYWORDS: Record<string, string[]> = {
  kr: [
    "퍼즐 게임",
    "방치형 RPG",
    "매치 3",
    "카드 게임",
    "전략 시뮬레이션",
    "수집형 RPG",
    "MMORPG",
    "액션 게임",
    "슈팅 게임",
    "러너 게임",
    "경영 시뮬",
    "타이쿤",
    "타워 디펜스",
    "로그라이크",
  ],
  us: [
    "match 3 puzzle",
    "idle rpg",
    "roguelike deckbuilder",
    "city builder",
    "gacha rpg",
    "collection rpg",
    "action game",
    "shooter game",
    "runner game",
    "tycoon",
    "tower defense",
    "survival strategy",
  ],
  jp: [
    "パズル",
    "放置 RPG",
    "カードゲーム",
    "RPG",
    "ガチャ",
    "アクション",
    "シューティング",
    "経営シミュ",
    "タイクーン",
  ],
  // cn 은 Google Play 부재로 Apple App Store 중심. Phase 2.
};

/**
 * ASO 케이스 스터디로 언급된 게임 App ID 리스트.
 *
 * 출처 예: Apptweak / Phiture / Storemaven 블로그가 "이 게임이 ASO 를 이렇게 해서 효과 봤다" 로 명시적으로 다룬 사례.
 * 게임 품질 상(GOTY·Apple Design Awards) 과 구분 — 여기 포함하지 않음.
 *
 * TODO: 별도 리서치 필요. 아래는 플레이스홀더 — 실제 운영 전에 Apptweak 블로그 등에서 확인된 5개로 교체.
 * 현재는 초기 타입 체크 통과용 샘플.
 */
export const CASE_STUDY_APP_IDS: Array<{
  app_id: string;
  country: string;
  source_note: string;
}> = [
  // ── RPG (IP·AAA 게임 포함 — 케이스 스터디 경로는 IP/AAA 필터 우회) ──
  {
    app_id: "com.lilithgame.hgame.gp",
    country: "us",
    source_note: "AFK Arena — Phiture·Apptweak 아이콘 A/B 테스트 케이스",
  },
  {
    app_id: "com.plarium.raidlegends",
    country: "us",
    source_note: "Raid: Shadow Legends — ASO+UA 통합 캠페인 케이스",
  },
  {
    app_id: "com.miHoYo.GenshinImpact",
    country: "us",
    source_note: "Genshin Impact — 글로벌 런칭 ASO·로컬라이제이션 케이스",
  },
  {
    app_id: "com.HoYoverse.hkrpgoversea",
    country: "us",
    source_note: "Honkai: Star Rail — 시즌 ASO·아이콘 진화 케이스",
  },
  {
    app_id: "com.neowizgames.game.lordofheroes",
    country: "kr",
    source_note: "Lord of Heroes — 한국 인디 RPG ASO 모범 사례",
  },
  // ── Action ──
  {
    app_id: "com.kiloo.subwaysurf",
    country: "us",
    source_note: "Subway Surfers — 장수 ASO·콜라보 시즌 케이스 (Sybo)",
  },
  {
    app_id: "com.kitkagames.fallbuddies",
    country: "us",
    source_note: "Stumble Guys — 배틀로얄 ASO 케이스 (Kitka·Scopely)",
  },
  {
    app_id: "com.supercell.brawlstars",
    country: "us",
    source_note: "Brawl Stars — Supercell 시즌 LiveOps·ASO 케이스",
  },
  {
    app_id: "com.dxx.survivor",
    country: "us",
    source_note: "Survivor.io — 하이퍼액션 ASO 신흥 사례 (Habby)",
  },
  {
    app_id: "com.habby.archero",
    country: "us",
    source_note: "Archero — Habby 액션 RPG 초기 ASO 케이스",
  },
  // ── Strategy / SLG ──
  {
    app_id: "com.fun.lastwar.gp",
    country: "us",
    source_note: "Last War: Survival — 2024 ASO+광고 통합 1위 케이스 (FirstFun)",
  },
  {
    app_id: "com.gof.global",
    country: "us",
    source_note: "Whiteout Survival — 빙하 SLG ASO 케이스 (Century Games)",
  },
  {
    app_id: "com.topwar.gp",
    country: "us",
    source_note: "Top War: Battle Game — 4X SLG ASO 케이스",
  },
  // ── Simulation ──
  {
    app_id: "com.playrix.township",
    country: "us",
    source_note: "Township — Playrix 장수 시뮬 ASO 케이스",
  },
  {
    app_id: "com.vizorinteractive.klondike",
    country: "us",
    source_note: "Klondike Adventures — 어드벤처 시뮬 ASO 케이스",
  },
];

/**
 * IP·브랜드 파워로 매출이 나오는 퍼블리셔 whitelist — Library 수집에서 제외 대상.
 *
 * 기준: 2023~2026 ASO 업계 리포트 (AppTweak·Phiture·data.ai) 에서
 * 자체 브랜드·프랜차이즈 파워로 차트 상위를 유지한다고 분석된 퍼블리셔만 포함.
 *
 * **제거된 항목 (ASO·광고 기반 성장으로 간주 — 수집 대상에 포함)**:
 *   Dream Games, Peak Games, Playrix, Moon Active, Scopely, Voodoo, Supersonic,
 *   Homa Games, Jam City, Wooga, Supercent, Sybo, Outfit7, InnerSloth.
 *   이들은 ASO 혁신 사례로 업계 리포트에 자주 인용되므로 Library 분석 대상.
 *
 * 소문자로 비교. 부분 일치(includes) 허용.
 */
export const AAA_STUDIOS_NORMALIZED: string[] = [
  // 중국·글로벌 대형 퍼블리셔
  "hoyoverse",
  "mihoyo",
  "cognosphere", // HoYoverse 글로벌 퍼블리셔 브랜드
  "tencent",
  "proxima beta", // Tencent 계열 글로벌 퍼블리셔 (NIKKE 등)
  "level infinite", // Tencent 글로벌 퍼블리셔 브랜드
  "timi", // Tencent TiMi Studio
  "netease",
  "kuro games",
  "funplus",
  "igg",
  "lilith games",
  // 서구 대형 퍼블리셔
  "supercell",
  "king",
  "activision",
  "electronic arts",
  "ea sports",
  "blizzard",
  "epic games",
  "rovio",
  "zynga",
  "machine zone",
  // 한국 주요 퍼블리셔 (자체 IP 강함)
  "netmarble",
  "nexon",
  "ncsoft",
  "com2us",
  "kakao games",
  "shift up",
  // 일본 레거시 퍼블리셔
  "nintendo",
  "bandai namco",
  "konami",
  "square enix",
  // 라이선스 IP 보유자
  "pokemon",
  "disney",
  "garena",
];

/**
 * 알려진 mid 규모 스튜디오 whitelist.
 * whitelist 에 없는 대부분은 default=indie 로 태깅 후 수동 보정.
 *
 * 2026 갱신: ASO·광고 기반 성장한 중견·신흥 퍼블리셔를 여기로 이동 — 수집 대상 포함.
 */
export const MID_STUDIOS_NORMALIZED: string[] = [
  "dream games",
  "peak games",
  "playrix",
  "moon active",
  "scopely",
  "voodoo",
  "supersonic",
  "homa games",
  "jam city",
  "wooga",
  "supercent",
  "sybo",
  "outfit7",
  "innersloth",
  "small giant",
  "fingersoft",
  "cat daddy",
  "wildlife studios",
  "first touch",
  "kabam",
  "miniclip",
  "century games",
  "magic tavern",
];

/**
 * IP·프랜차이즈 제목 키워드 — Library 수집에서 제외 대상.
 *
 * 이 키워드 중 하나라도 제목에 포함되면 제외. 대소문자·공백 무시, 부분 일치.
 * 언어별 표기(영·한·일·중 간체) 모두 포함.
 */
export const IP_FRANCHISE_KEYWORDS: string[] = [
  // 포켓몬
  "pokemon",
  "pokémon",
  "ポケモン",
  "포켓몬",
  // 유희왕
  "yu-gi-oh",
  "yugioh",
  "遊戯王",
  "유희왕",
  // 드래곤볼
  "dragon ball",
  "ドラゴンボール",
  "드래곤볼",
  // 디즈니 계열
  "disney",
  "ディズニー",
  "디즈니",
  "marvel",
  "star wars",
  "harry potter",
  // 샌드박스 IP
  "minecraft",
  "マインクラフト",
  "마인크래프트",
  "roblox",
  // 보드게임 IP
  "monopoly",
  "モノポリー",
  "모노폴리",
  // JP 레거시 RPG IP
  "final fantasy",
  "ファイナルファンタジー",
  "파이널 판타지",
  "dragon quest",
  "ドラゴンクエスト",
  "드래곤 퀘스트",
  "fate/",
  "fate grand",
  "フェイト",
  "페이트",
  // 중국·호요 IP
  "genshin",
  "원신",
  "honkai",
  "崩壊",
  "崩坏",
  "붕괴",
  "wuthering",
  "鸣潮",
  "명조",
  // 한국 MMO IP
  "lineage",
  "リネージュ",
  "리니지",
  "maplestory",
  "メイプル",
  "메이플",
  "aion",
  "아이온",
  "odin",
  "오딘",
  // 수퍼셀 IP
  "candy crush",
  "clash royale",
  "clash of clans",
  "brawl stars",
  // 스포츠 라이선스
  "nba ",
  "nfl ",
  "fifa ",
  "mlb ",
  "fc 모바일",
  "fc mobile",
  "efootball",
  // BR/FPS IP
  "call of duty",
  "pubg",
  "fortnite",
  "free fire",
  // 일본 인기 IP
  "monster strike",
  "モンスト",
  "モンスター ストライク",
  // 기타
  "angry birds",
  "앵그리버드",
  "アングリーバード",
  "cookierun",
  "cookie run",
  "쿠키런",
];

/**
 * 제목이 IP 프랜차이즈 키워드를 포함하는지 판정.
 * 소문자·공백 정규화 후 비교.
 */
export function isIpFranchise(title: string): string | null {
  const t = title.toLowerCase();
  for (const kw of IP_FRANCHISE_KEYWORDS) {
    if (t.includes(kw.toLowerCase())) return kw;
  }
  return null;
}

/**
 * Google Play 카테고리 → 내부 장르 역매핑.
 * GENRE_TO_GPLAY_CATEGORY 의 역방향.
 */
export const GPLAY_CATEGORY_TO_GENRE: Record<string, string> = {
  GAME_PUZZLE: "puzzle",
  GAME_ROLE_PLAYING: "rpg",
  GAME_ACTION: "action",
  GAME_STRATEGY: "strategy",
  GAME_SIMULATION: "simulation",
  GAME_CASUAL: "casual",
  GAME_ARCADE: "arcade",
  GAME_SPORTS: "sports",
  GAME_RACING: "racing",
  GAME_CARD: "card",
  GAME_ADVENTURE: "adventure",
  GAME_BOARD: "board",
  GAME_WORD: "word",
};

/**
 * 매출 차트 수집 대상 국가 (Google Play GROSSING 지원).
 * 중국은 Google Play 부재 — 제외. Apple 경로는 Phase 2.
 */
export const GROSSING_COUNTRIES = ["kr", "us", "jp"] as const;

/**
 * 쿼터 설정 — 설계 §3 에 따른 50개 구성.
 */
export const CURATION_QUOTAS = {
  grossing: 35,
  keyword_search: 15,
  case_study: 15,
  total: 65,
} as const;
