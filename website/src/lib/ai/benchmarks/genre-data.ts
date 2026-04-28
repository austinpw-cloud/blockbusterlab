/**
 * 장르별 Top 게임 ASO 벤치마크 — AI 프롬프트에 주입할 요약 데이터.
 *
 * 원본: docs/aso/99-archived/ASO-bible-by-genre-2026.md (아카이브됨)
 *
 * **우선순위 (v2.7)**: Library 주축 > 유사 게임 > 실시간 경쟁작 > **이 블록 (최하위 폴백)**.
 * Library 가 구축되어 `library_patterns` 에 실제 데이터가 있으면 Opus 가 Library 를 우선 참고.
 * 이 하드코딩은 Library 조회가 `fallback_level === "none"` 일 때 또는 과거 한국 시장 Top 감각 참고용.
 *
 * 향후: 완전 제거 후보. L1~L3 실행으로 `library_patterns` 가 충분히 채워지면 이 파일 dead code.
 */

export type GenreBenchmark = {
  genre: string;
  title_patterns: string[];
  subtitle_patterns: string[];
  icon_style: string;
  screenshot_style: string;
  avg_rating: number;
  top_games: string[];
  key_insights: string[];
};

export const GENRE_BENCHMARKS: Record<string, GenreBenchmark> = {
  puzzle: {
    genre: "퍼즐",
    title_patterns: [
      "'Match 3'가 서브타이틀 빈출 (6/10 게임)",
      "'-scapes' 패턴: Homescapes/Gardenscapes/Wordscapes — 장르+테마 결합",
      "'Blast' 패턴: Block Blast/Toon Blast — 폭발/파괴 쾌감",
    ],
    subtitle_patterns: [
      '"Daily Puzzle & Block Crush"',
      '"King Robert\'s Match 3 Puzzles" (캐릭터형)',
      '"Funniest Match 3 Puzzle Game" (장르 키워드 중첩)',
      '"Classic logic puzzle game" (감성)',
    ],
    icon_style: "짙은 보라/네이비 + 골드, 캐릭터 얼굴 중심 (50%+)",
    screenshot_style:
      "세로 100%, 5-8장, 밝고 따뜻한 톤, 콤보/폭발 이펙트 강조",
    avg_rating: 4.73,
    top_games: [
      "Block Blast! (Hungry Studio)",
      "Royal Match (Dream Games)",
      "Candy Crush Saga (King)",
      "Toon Blast (Peak)",
      "Homescapes (Playrix)",
    ],
    key_insights: [
      "제목에 'puzzle'/'match' 같은 장르 키워드 직접 포함 필수",
      "서브타이틀은 14-30자 캐치프레이즈 + 장르 키워드 중첩",
      "첫 스크린샷에 코어 매치 보드 + 스토리 훅 배치",
      "소개문 첫 252자에 '무료/오프라인/광고 없음' 같은 전환 부스터 포함",
    ],
  },

  rpg: {
    genre: "RPG",
    title_patterns: [
      "IP 브랜드 의존형: Dragon Ball, Solo Leveling",
      "세계관 암시형: Genshin Impact, Wuthering Waves",
      "장르 스태킹형: Diablo Immortal (MMORPG+Action+Adventure)",
    ],
    subtitle_patterns: [
      '"An Open World Adventure"',
      '"A Space Fantasy RPG"',
      '"Urban Fantasy ARPG"',
      '"Cruel Humanity Destiny Shooter" (감성/서사형)',
    ],
    icon_style: "100% 캐릭터 초상화, 애니메이션 스타일, 시즌별 교체",
    screenshot_style:
      "세로+가로 혼용, 5-8장, 전투/캐릭터 아트/오픈월드 교차, 보라/골드/틸/네이비",
    avg_rating: 4.57,
    top_games: [
      "Genshin Impact (HoYoverse)",
      "Honkai: Star Rail (HoYoverse)",
      "Solo Leveling: Arise (Netmarble)",
      "AFK Journey (Lilith Games)",
      "NIKKE (SHIFT UP)",
    ],
    key_insights: [
      "메인 캐릭터 초상 아이콘은 절대 원칙",
      "서브타이틀에 'RPG', 'Action', 'Fantasy' 등 장르 키워드 필수",
      "인디 RPG는 IP 없으므로 독특한 세계관/감성 키워드로 승부",
      "첫 스크린샷은 코어 전투 장면 — 게임의 '맛' 즉시 전달",
    ],
  },

  action: {
    genre: "액션",
    title_patterns: [
      '"Battle Royale"가 5/10 서브타이틀에 등장',
      "'FPS', 'PvP', 'Multiplayer', 'Shooter' 빈출",
      "캐주얼 액션은 'Fun', 'Join', '#1' 감성어 사용",
    ],
    subtitle_patterns: [
      '"Battle Royale & DMZ FPS"',
      '"Top Battle Royale Mobile Game"',
      '"10-minute Survival Shooter!"',
      '"PvP & 3v3 Battle Royale MOBA"',
    ],
    icon_style: "로고 포워드(PUBG) 또는 캐릭터 액션(Subway Surfers), 다크 밀리터리",
    screenshot_style: "주로 세로(폰 퍼스트), 모드명/플레이어수 텍스트 강조",
    avg_rating: 4.48,
    top_games: [
      "Call of Duty Mobile (Activision)",
      "PUBG Mobile (Tencent)",
      "Brawl Stars (Supercell)",
      "Fortnite (Epic)",
      "Subway Surfers (Sybo)",
    ],
    key_insights: [
      "서브타이틀에 모드/장르/멀티 키워드 적재",
      "스크린샷은 가장 극적인 전투/액션 장면 우선 배치",
      "'10-minute', '3v3' 같은 구체 숫자로 차별화",
    ],
  },

  strategy: {
    genre: "전략",
    title_patterns: [
      "war, survival, kingdom, empire, clash 빈출",
      "alliance, MMO, 4X, commander 키워드 중요",
    ],
    subtitle_patterns: [
      '"Build & Survive in Winter"',
      '"Idle strategic defense"',
      '"Real-time strategy MMO"',
      '"Dodge, Defend, Defeat Zombies"',
    ],
    icon_style: "블랙/딥블루/레드 배경, 전사/지휘관/왕, 골드 악센트",
    screenshot_style:
      "세로 100%, 8-10장, 볼드 시네마틱 텍스트, 극적 액션 문구",
    avg_rating: 4.43,
    top_games: [
      "Clash of Clans (Supercell)",
      "Last War: Survival (FUNFLY)",
      "Whiteout Survival (Century)",
      "Kingshot (Century)",
      "Rise of Kingdoms (Lilith)",
    ],
    key_insights: [
      "서브타이틀은 3-4개 동사/명사 조합의 압축적 문구",
      "공격적/강력한 에너지 전달 (골드 악센트)",
      "스크린샷 텍스트 오버레이가 게임플레이 만큼 중요",
    ],
  },

  simulation: {
    genre: "시뮬레이션",
    title_patterns: [
      "idle, tycoon, cooking, merge, farm, life 빈출",
      "restaurant, city, build, cozy 키워드 중요",
    ],
    subtitle_patterns: [
      '"Farm, Build & Match-3" (동사 나열)',
      '"Merge & Cook, Theme Restaurant"',
      '"Live any life you choose"',
      '"Pizza restaurant simulator"',
    ],
    icon_style: "따뜻한 밝은 톤, 환경/음식/사물 중심, 친근하고 코지",
    screenshot_style: "세로+가로 혼용, 8-10장, 텍스트 최소화 (비주얼 우선)",
    avg_rating: 4.49,
    top_games: [
      "Township (Playrix)",
      "Eatventure (Lessmore)",
      "BitLife (Candywriter)",
      "Pizza Ready! (Supercent)",
      "Among Us! (InnerSloth)",
    ],
    key_insights: [
      "서브타이틀은 '동사, 동사, 동사!' 패턴이 매우 효과적",
      "아이콘은 캐릭터보다 환경/테마 오브젝트",
      "코지/따뜻함 분위기 (전략 장르와 정반대)",
    ],
  },

  casual: {
    genre: "캐주얼",
    title_patterns: [
      "장르와 결합된 제목: Block Blast, Candy Crush",
      "캐릭터/테마 결합: Royal Match (King Robert's)",
    ],
    subtitle_patterns: [
      '"Daily Puzzle & Block Crush"',
      '"Join the endless running fun!"',
      '"Attack and Raid your Friends!"',
      '"Meet your new virtual pet!"',
    ],
    icon_style: "밝은 보라/블루/오렌지, 게임플레이 이미지 직관적",
    screenshot_style: "세로 100%, 5-8장, 마케팅형 또는 미니멀",
    avg_rating: 4.74,
    top_games: [
      "Block Blast! (Hungry Studio)",
      "Candy Crush Saga (King)",
      "Subway Surfers (Sybo)",
      "Royal Match (Dream Games)",
      "Coin Master (Moon Active)",
    ],
    key_insights: [
      "서브타이틀에 감성어+CTA 조합 효과적 ('Join', 'Meet')",
      "평점 4.5+ 필수 경쟁력",
      "스크린샷은 한눈에 이해되는 단순함이 생명",
    ],
  },

  arcade: {
    genre: "아케이드",
    title_patterns: [
      "간결한 브랜드명: Paper.io 2, Hole.io",
      "'#1' 최상급 주장 자주 사용",
    ],
    subtitle_patterns: [
      '"The world\'s #1 IO game"',
      '"Eat the world"',
      '"Collect, Grow, Multiply!"',
      '"Play Offline Military Strategy"',
    ],
    icon_style: "네온/비비드 컬러, 게임 메카닉 시각화, 볼드 심플",
    screenshot_style: "세로 주력, 5-7장, 미니멀, 게임플레이 포커스",
    avg_rating: 4.52,
    top_games: [
      "Subway Surfers (Sybo)",
      "Paper.io 2 (Voodoo)",
      "Tower War (SayGames)",
      "Hole.io (Voodoo)",
      "Mob Control (Voodoo)",
    ],
    key_insights: [
      "서브타이틀은 동사 나열 또는 최상급 주장이 지배적",
      "아이콘은 게임 메카닉을 한 장의 그래픽으로",
      "Voodoo 스타일: 고대비 네온 + 극도로 심플",
    ],
  },

  sports: {
    genre: "스포츠",
    title_patterns: [
      "IP 브랜드명 + 연도 + 'Mobile' + 종목",
      "'Ultimate', 'Dream', 'Official' 자주 사용",
    ],
    subtitle_patterns: [
      '"The #1 Football Game — Build Your Ultimate Team"',
      '"Build Your Dream Team — Rise to Glory"',
      '"Real-Time 1v1 Tennis Multiplayer"',
    ],
    icon_style: "라이선스 IP 로고 지배적 (NFL, NBA, F1 등)",
    screenshot_style: "가로 주력, 스타디움/경기 장면, 선수명 텍스트 오버레이",
    avg_rating: 4.45,
    top_games: [
      "EA SPORTS FC Mobile 26 (EA)",
      "Dream League Soccer 2026 (First Touch)",
      "NBA 2K Mobile (2K)",
      "Tennis Clash (Wildlife)",
    ],
    key_insights: [
      "라이선스 없는 인디는 장르 키워드로 승부",
      "'Ultimate Team' 빌드 개념이 공통 핵심 메카닉",
    ],
  },

  racing: {
    genre: "레이싱",
    title_patterns: [
      "프랜차이즈명 + 차량유형 + 'racing/drift/street'",
    ],
    subtitle_patterns: [
      '"Race. Drift. Dominate."',
      '"Open World Street Racing"',
      '"Realistic Drag Racing"',
      '"Fast Racing Through Crazy Obstacle Courses"',
    ],
    icon_style: "프리미엄 슈퍼카 사진(CSR2) 또는 컬러풀 카툰(Hill Climb)",
    screenshot_style: "가로 주력, 스피드감, 차량 사진 중심",
    avg_rating: 4.4,
    top_games: [
      "Asphalt Legends (Gameloft)",
      "CarX Street (CarX)",
      "CSR 2 (NaturalMotion)",
      "Race Master 3D (SayGames)",
    ],
    key_insights: [
      "'Drift', 'Street', 'Open World' 키워드가 차별화",
      "카툰 스타일 인디는 'Crazy', 'Obstacle' 등 재미 키워드",
    ],
  },

  card: {
    genre: "카드/보드",
    title_patterns: [
      "IP + 'card game/board game' + 'multiplayer'",
      "감성 동사: 'build', 'battle', 'collect'",
    ],
    subtitle_patterns: [
      '"Roll the Dice — Build Your Empire"',
      '"Real-Time Card Battle Arena"',
      '"Collect. Battle. Trade. Every Day."',
      '"The Poker Roguelike"',
    ],
    icon_style: "IP 인지도 극대화 (포켓볼, 모노폴리맨, 조커)",
    screenshot_style: "세로+가로 혼용, IP 시즌/이벤트 아트",
    avg_rating: 4.4,
    top_games: [
      "MONOPOLY GO! (Scopely)",
      "Clash Royale (Supercell)",
      "Pokemon TCG Pocket",
      "Balatro (LocalThunk) — 인디 성공 사례",
      "Slay the Spire (Mega Crit) — 인디 성공 사례",
    ],
    key_insights: [
      "**인디게임이 대형 IP와 경쟁 가능한 장르** (Balatro, Slay the Spire)",
      "독특한 장르 혼합(Poker Roguelike)이 차별화 포인트",
      "프리미엄 모델도 통하는 장르",
    ],
  },

  other: {
    genre: "기타",
    title_patterns: ["장르 특성에 맞게 조정"],
    subtitle_patterns: ["게임의 핵심 메카닉과 감성을 전달"],
    icon_style: "장르와 타겟에 맞춰 자유롭게",
    screenshot_style: "게임플레이 중심 + 명확한 가치 제안",
    avg_rating: 4.3,
    top_games: [],
    key_insights: [
      "특정 장르 분류가 애매하면 가장 가까운 장르 벤치마크 참고",
      "독창적 포지셔닝이 오히려 강점이 될 수 있음",
    ],
  },
};

/**
 * 장르 ID로 벤치마크 데이터 가져오기.
 * 없는 장르는 'other' fallback.
 */
export function getBenchmarkByGenre(genreId: string): GenreBenchmark {
  return GENRE_BENCHMARKS[genreId] ?? GENRE_BENCHMARKS.other;
}
