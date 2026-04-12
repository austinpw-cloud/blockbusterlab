# ASO 바이블: 장르별 Top 게임 분석 & 서비스 설계 기준서 (2026)

> **목적**: 인디게임닷컴 ASO 자동화 서비스의 판단 기준이 되는 벤치마크 데이터
> **범위**: Google Play + Apple App Store, 9개 장르, 80+ 게임 분석
> **기준일**: 2026년 4월

---

## 목차

1. [서비스 설계 개요](#1-서비스-설계-개요)
2. [장르별 Top 10 게임 ASO 분석](#2-장르별-top-10-게임-aso-분석)
   - 2.1 퍼즐
   - 2.2 RPG
   - 2.3 액션
   - 2.4 전략
   - 2.5 시뮬레이션
   - 2.6 캐주얼
   - 2.7 아케이드
   - 2.8 스포츠 / 레이싱
   - 2.9 카드 / 보드
3. [크로스 장르 ASO 패턴 분석](#3-크로스-장르-aso-패턴-분석)
4. [ASO 자동 분석 로직 설계](#4-aso-자동-분석-로직-설계)
5. [자동 제안 템플릿](#5-자동-제안-템플릿)

---

## 1. 서비스 설계 개요

### 서비스 흐름

```
[인디 개발자가 게임 정보 입력]
    → 장르 자동 분류
    → 해당 장르 Top 게임 ASO 벤치마크와 비교
    → 제목/소개/스크린샷/아이콘 각 항목 점수화
    → 구체적 개선안 자동 생성
    → 플랫폼별(iOS/Android) 맞춤 가이드 출력
```

### 평가 항목 (이 문서가 기준 데이터 역할)

| 평가 항목 | 벤치마크 소스 |
|-----------|--------------|
| 제목 키워드 전략 | 장르별 Top 10 타이틀 키워드 패턴 |
| 서브타이틀 구성 | 장르별 서브타이틀 유형 분류 |
| 아이콘 디자인 | 장르별 색상/구도/스타일 패턴 |
| 스크린샷 구성 | 장르별 장수/방향/오버레이 스타일 |
| 소개문구 구조 | 첫 252자 구성 패턴 |
| 프리뷰 영상 | 유무 및 길이/스타일 |
| 평점 기준선 | 장르별 평균 평점 |

---

## 2. 장르별 Top 10 게임 ASO 분석

---

### 2.1 퍼즐 (Puzzle)

#### Top 10 게임 요약

| 순위 | 게임 | 개발사 | 서브타이틀 | 평점 | 다운로드 |
|------|------|--------|-----------|------|----------|
| 1 | Block Blast! | Hungry Studio | Daily Puzzle & Block Crush | 4.9 | ~890M |
| 2 | Royal Match | Dream Games | King Robert's Match 3 Puzzles | 4.7 | 55M MAU |
| 3 | Candy Crush Saga | King | Puzzle Your Way Through Candy! | 4.7 | ~3.5B |
| 4 | Toon Blast | Peak Games | Funniest Match 3 Puzzle Game | 4.7 | ~120M |
| 5 | Homescapes | Playrix | Match 3 Puzzle & Home Design | 4.6 | ~312M |
| 6 | Gardenscapes | Playrix | Enjoy Your Garden Puzzle Game | 4.7 | ~324M |
| 7 | Empires & Puzzles | Small Giant | Hero fantasy with story & PvP | 4.7 | 26M+ |
| 8 | Wordscapes | PeopleFun | Crossword Puzzles Brain Games | 4.8 | 10M+ active |
| 9 | Sudoku.com | Easybrain | Classic logic puzzle game | 4.8 | 100M+ |
| 10 | Monument Valley 3 | ustwo games | Set sail for adventure! | 4.9 | 프리미엄 |

#### 퍼즐 장르 ASO 패턴

**제목 키워드 아키텍처**

| 게임 | 타이틀 키워드 | 서브타이틀 키워드 |
|------|-------------|-----------------|
| Block Blast! | block, blast | daily puzzle, block crush |
| Royal Match | royal, match | match 3, puzzles |
| Candy Crush Saga | candy, crush, saga | puzzle, candy |
| Toon Blast | toon, blast | match 3, puzzle, game |
| Homescapes | home, scapes | match 3, puzzle, home design |
| Gardenscapes | garden, scapes | garden, puzzle, game |
| Empires & Puzzles | empires, puzzles, match-3, RPG | hero, fantasy, story, PvP |
| Wordscapes | word, scapes | crossword, puzzles, brain games |
| Sudoku.com | sudoku, number, games | classic, logic, puzzle, game |
| Monument Valley 3 | monument, valley | adventure (감성형) |

**핵심 발견**:
- "Match 3"가 서브타이틀에 가장 많이 사용 (6/10)
- "-scapes" 패턴: Homescapes, Gardenscapes, Wordscapes — 장르+테마 결합 네이밍
- "Blast" 패턴: Block Blast, Toon Blast — 폭발/파괴 쾌감 암시
- 프리미엄 게임(Monument Valley)은 감성적 서브타이틀, 키워드 밀도 낮음

**아이콘 디자인 패턴**

| 패턴 | 사용 게임 |
|------|----------|
| 짙은 보라/네이비 + 골드 | Block Blast, Royal Match, Toon Blast |
| 캐릭터 얼굴 중심 | Royal Match (King), Homescapes (Austin), Toon Blast (Bear) |
| 깔끔한 화이트 미니멀 | Sudoku.com |
| 자연/따뜻한 톤 | Wordscapes, Monument Valley 3, Meow Tower |
| 다크 판타지 | Empires & Puzzles |
| 그린 + 라이프스타일 | Gardenscapes |

**스크린샷 전략**

| 유형 | 스타일 |
|------|--------|
| Match-3 리더 (Royal Match, Candy Crush) | 세로, 밝고 따뜻한 톤, 첫 스크린샷에 코어 매치 보드 + 스토리 훅 |
| 하이퍼캐주얼 (Block Blast) | 짙은 배경 + 비비드 컬러 대비, 콤보 폭발 장면 강조 |
| 프리미엄 (Monument Valley 3) | 예술적/회화적, 텍스트 최소화, 분위기 우선 |
| 워드/로직 (Wordscapes, Sudoku) | 자연 배경 또는 깔끔한 그리드, 차분한 톤 |

**소개문구 첫 252자 패턴**:
- Royal Match: 캐릭터 소개 → 미션 제시 → 핵심 메카닉 설명
- Block Blast: 세계관 진입 → 브레인+전략 포지셔닝 → 데일리 챌린지 훅
- Candy Crush: 세계 탐험 유도 → 수천 레벨 강조 → 매칭 메카닉

**평점 벤치마크**: 평균 **4.73/5** (앱스토어 기준)

---

### 2.2 RPG

#### Top 10 게임 요약

| 순위 | 게임 | 개발사 | 서브타이틀 | 평점 | 다운로드 |
|------|------|--------|-----------|------|----------|
| 1 | Genshin Impact | HoYoverse | An Open World Adventure | 4.3 | 202M+ |
| 2 | Honkai: Star Rail | HoYoverse | A Space Fantasy RPG | 4.4 | 100M+ |
| 3 | Wuthering Waves | Kuro Games | Waking of a World | 4.6 | 15M+ |
| 4 | Zenless Zone Zero | HoYoverse | Urban Fantasy ARPG | 4.1 | 50M(72h) |
| 5 | Diablo Immortal | Blizzard | MMORPG with Action & Adventure | 4.7 | 50M+ |
| 6 | Solo Leveling: Arise | Netmarble | ACTION on a different level! | 4.7 | 강력 런칭 |
| 7 | AFK Journey | Lilith Games | Major Update Now Live | 4.8 | 15M+ |
| 8 | NIKKE | SHIFT UP | Cruel Humanity Destiny Shooter | 4.8 | 4.6M+ |
| 9 | Hero Wars | Nexters | Mini-Warrior Battle Adventure | 4.5 | 185M+ |
| 10 | Dragon Ball Legends | BANDAI NAMCO | Action Card Battle RPG | 4.8 | 100M+ |

#### RPG 장르 ASO 패턴

**제목 전략 유형 분류**:

| 유형 | 예시 | 특징 |
|------|------|------|
| IP 브랜드 의존형 | Dragon Ball Legends, Solo Leveling | IP 이름 자체가 검색 볼륨 |
| 세계관 암시형 | Genshin Impact, Wuthering Waves | 고유 세계관 이름으로 브랜드 구축 |
| 장르 스태킹형 | Diablo Immortal (MMORPG+Action+Adventure) | 여러 장르 키워드 적재 |
| 감성/서사형 | NIKKE (Cruel Humanity Destiny Shooter) | 감정적 훅으로 차별화 |
| 기능 강조형 | AFK Journey (AFK = 방치형 장르 신호) | 핵심 메카닉을 제목에 |

**아이콘 패턴**:
- RPG는 **100% 캐릭터 초상화** 아이콘 사용
- 애니메이션 스타일 지배적 (8/10)
- 시즌/캐릭터 업데이트에 맞춰 아이콘 정기 변경
- 배경: 따뜻한 골드(Genshin), 보라/라벤더(Star Rail), 네온(ZZZ), 다크레드(Diablo)

**스크린샷 패턴**:
- 방향: 세로(폰) + 가로(태블릿) 혼용
- 전투 장면 + 캐릭터 아트 + 오픈월드 풍경 교차
- 텍스트 오버레이: 기능명, 수상 뱃지, 캐릭터명
- 색감: 리치한 판타지/SF (보라, 골드, 틸, 다크네이비)

**평점 벤치마크**: 평균 **4.57/5** (앱스토어 기준)

---

### 2.3 액션 (Action)

#### Top 10 게임 요약

| 순위 | 게임 | 개발사 | 서브타이틀 | 평점 | 다운로드 |
|------|------|--------|-----------|------|----------|
| 1 | Call of Duty Mobile | Activision | Battle Royale & DMZ FPS | 4.7 | 500M+ |
| 2 | PUBG Mobile | Tencent | Top Battle Royale Mobile Game | 4.3 | 1.75B |
| 3 | Free Fire | Garena | 10-minute Survival Shooter! | 4.0 | 22.5M/월 |
| 4 | Brawl Stars | Supercell | PvP & 3v3 Battle Royale MOBA | 4.7 | 18M/월 |
| 5 | Fortnite | Epic Games | Battle Royale & Social Games | 4.4 | 500M+ |
| 6 | Roblox | Roblox Corp | Play, Create, and Connect | 4.5 | 2B+ |
| 7 | Subway Surfers | Sybo Games | Join the endless running fun! | 4.6 | 4B+ |
| 8 | Delta Force | Level Infinite | ULTIMATE EXTRACTION & WARFARE | 4.7 | 급성장 |
| 9 | Stumble Guys | Scopely | Fun Multiplayer Battle Royale | 4.4 | 600M+ |
| 10 | Paper.io 2 | Voodoo | The world's #1 IO game | 4.5 | 360M+ |

#### 액션 장르 ASO 패턴

**서브타이틀 키워드 분석**:
- "Battle Royale" 등장: 5/10 게임 — 액션 장르 지배적 키워드
- "FPS", "PvP", "Multiplayer", "Shooter" 빈출
- 캐주얼 액션은 감성어 사용: "Fun", "Join", "#1"

**아이콘 패턴**:

| 유형 | 게임 | 특징 |
|------|------|------|
| 로고 포워드 | PUBG, Roblox | 캐릭터 없이 로고/브랜드마크만 |
| 캐릭터 액션 | Subway Surfers, Brawl Stars | 캐릭터가 동작 중인 포즈 |
| 밀리터리 다크 | CoD, Delta Force | 어두운 배경 + 골드/오렌지 악센트 |
| 캐주얼 카툰 | Stumble Guys, Paper.io | 밝고 단순한 도형/캐릭터 |

**스크린샷 패턴**: 주로 세로(폰 퍼스트), 모드명/플레이어수 텍스트 강조

**평점 벤치마크**: 평균 **4.48/5**

---

### 2.4 전략 (Strategy)

#### Top 10 게임 요약

| 순위 | 게임 | 개발사 | 서브타이틀 | 평점 | 다운로드 |
|------|------|--------|-----------|------|----------|
| 1 | Clash of Clans | Supercell | Join millions... build your village | 4.47 | 500M+ |
| 2 | Last War: Survival | FUNFLY | Dodge, Defend, Defeat Zombies | 4.67 | 10M+ |
| 3 | Whiteout Survival | Century Games | Build & Survive in Winter | 4.47 | 10M+ |
| 4 | Kingshot | Century Games | Idle strategic defense | 4.6 | 18.5M+ |
| 5 | Evony | TG Inc. | Build your cities... Be the king | 4.09 | 100M+ |
| 6 | Rise of Kingdoms | Lilith Games | Real-time strategy MMO | 4.46 | 50M+ |
| 7 | Clash Royale | Supercell | PvP Battle in Card Tower Duel | 4.6 | 500M+ |
| 8 | Puzzles & Survival | 37GAMES | Solve puzzles — kill zombies | 4.29 | 10M+ |
| 9 | Total Battle | Scorewarrior | MMO 4X real-time strategy | 4.53 | 50M+ |
| 10 | Age of Origins | CamelStudio | Kill zombies, form alliances | 4.13 | 50M+ |

#### 전략 장르 ASO 패턴

**지배적 키워드**: war, survival, kingdom, empire, clash, alliance, strategy, idle, build, base, MMO, troops, commander

**아이콘 패턴**:
- **캐릭터 구동형**: 전사, 지휘관, 왕 중심 (100%)
- **다크 배경**: 블랙, 딥블루, 레드 (100%)
- **골드 악센트**: 위엄/프리미엄 감각
- **공격적/강력한 에너지** 전달

**스크린샷**: 100% 세로, 볼드 시네마틱 텍스트, 극적 액션 문구

**평점 벤치마크**: 평균 **4.43/5**

---

### 2.5 시뮬레이션 (Simulation)

#### Top 10 게임 요약

| 순위 | 게임 | 개발사 | 서브타이틀 | 평점 | 다운로드 |
|------|------|--------|-----------|------|----------|
| 1 | Township | Playrix | Farm, Build & Match-3 | 4.71 | 4.2M/월 |
| 2 | Merge Cooking | Happibits | Merge & Cook, Theme Restaurant | 4.50 | 10M+ |
| 3 | Eatventure | Lessmore UG | Restaurant tycoon | 4.74 | 50M+ |
| 4 | BitLife | Candywriter | Live any life you choose | 4.8 | 50M+ |
| 5 | Pokemon Sleep | The Pokemon Co. | Turn sleep into entertainment | 4.3 | 410K/월 |
| 6 | Pizza Ready! | Supercent | Pizza restaurant simulator | 4.31 | 320M+ |
| 7 | Bus Simulator Ultimate | Zuuks Games | Realistic bus driving | 4.4 | 100M+ |
| 8 | Car Parking Multiplayer | Olzhasz | Realistic open-world parking | 4.54 | 200M+ |
| 9 | Among Us! | InnerSloth | Teamwork and betrayal in space | 4.05 | 수십억 |
| 10 | Garden Joy | Scopely | Cozy home landscaping | 4.5+ | 트렌딩 |

#### 시뮬레이션 장르 ASO 패턴

**지배적 키워드**: idle, tycoon, cooking, merge, farm, restaurant, life, simulator, offline, casual, city, build, cozy

**아이콘 패턴**:
- **환경/음식 중심** (캐릭터보다 공간/사물)
- **따뜻하고 밝은 색감**: 전략 장르와 정반대
- **친근한 카툰 또는 리얼리스틱 음식 사진** 스타일

**평점 벤치마크**: 평균 **4.49/5**

---

### 2.6 캐주얼 (Casual)

#### Top 10 게임 요약 (Apple App Store + Google Play 종합)

| 순위 | 게임 | 개발사 | 서브타이틀 | 평점 | 다운로드 |
|------|------|--------|-----------|------|----------|
| 1 | Block Blast! | Hungry Studio | Daily Puzzle & Block Crush | 4.9 | ~890M |
| 2 | Candy Crush Saga | King | Puzzle Your Way Through Candy! | 4.7 | ~3.5B |
| 3 | Subway Surfers | Sybo Games | Join the endless running fun! | 4.6 | ~4B |
| 4 | Royal Match | Dream Games | King Robert's Match 3 Puzzles | 4.7 | 84M(2025) |
| 5 | Royal Kingdom | Dream Games | King Richard's Match 3 Puzzles | 4.7 | 80.7M(2025) |
| 6 | Coin Master | Moon Active | Attack and Raid your Friends! | 4.8 | 수억 |
| 7 | My Talking Tom | Outfit7 | Meet your new virtual pet! | 4.3 | ~1.24B |
| 8 | Gardenscapes | Playrix | Enjoy Your Garden Puzzle Game | 4.7 | ~213M |
| 9 | Homescapes | Playrix | Match 3 Puzzle & Home Design | 4.6 | ~312M |
| 10 | Pizza Ready! | Supercent | Pizza restaurant simulator | 4.6 | ~320M |

#### App Store 실시간 캐주얼 차트 (2026년 4월)

| 순위 | 게임 | 서브타이틀 | 평점 |
|------|------|-----------|------|
| 1 | Magic Sort! | Water Sorting Puzzle | 4.7 |
| 2 | Block Blast! | Daily Puzzle & Block Crush | 4.9 |
| 3 | Arrows – Puzzle Escape | Puzzle Escape | 4.7 |
| 4 | Royal Kingdom | King Richard's Match 3 Puzzles | 4.7 |
| 5 | Jewel Coloring | Sparkle & Create with Pixel Art Puzzles | 4.9 |
| 6 | Block Out! | Color Block Puzzle | 4.7 |
| 7 | Gossip Harbor | Merge & Story | 4.6 |
| 8 | Bus Rush Fever! | Bus Rush Fever: Color Puzzle | 4.8 |
| 9 | Township | From Farming Town to Big City | 4.8 |
| 10 | Arrows GO! | Help the Arrows Escape! | 4.6 |

#### 캐주얼 장르 ASO 패턴

**서브타이틀 유형 분류**:

| 유형 | 예시 |
|------|------|
| 장르 키워드 + 액션 동사 | "Daily Puzzle & Block Crush", "Water Sorting Puzzle" |
| 소셜/멀티 강조 | "Attack and Raid your Friends!" |
| 내러티브 훅 | "King Robert's Match 3 Puzzles" |
| 코어 메카닉 설명 | "Merge & Story", "Color Block Puzzle" |
| 감성/라이프스타일 | "Meet your new virtual pet!" |
| 최상급 주장 | "The world's #1 IO game" |

**평점 벤치마크**: App Store 평균 **4.74/5**, Google Play 평균 **4.35/5**

---

### 2.7 아케이드 (Arcade)

#### Top 10 게임 요약 (Google Play 차트 기준)

| 순위 | 게임 | 개발사 | 서브타이틀 | 평점 | 다운로드 |
|------|------|--------|-----------|------|----------|
| 1 | Subway Surfers | Sybo Games | Join the endless running fun! | 4.6 | ~4B |
| 2 | Paper.io 2 | Voodoo | The world's #1 IO game | 4.5 | ~360M |
| 3 | Tower War | SayGames | Play Offline Military Strategy | 4.6 | 100M+ |
| 4 | Geometry Dash Lite | RobTop Games | (Music 카테고리) | 4.3 | ~560M |
| 5 | Pocket Champs | MADBOX | Most Epic 3D Racing Idle Games | 4.7 | ~48M |
| 6 | Mob Control | Voodoo | Collect, Grow, Multiply! | 4.6 | 220M+ |
| 7 | Hole.io | Voodoo | Eat the world | 4.6 | ~360M |
| 8 | Snake Clash! | Supercent | Grow to Eat! Snake Battle Game | 4.7 | 100M+ |
| 9 | Lumber GO! | Seikami | (미확인) | — | 트렌딩 |
| 10 | SwordSlash | Hide Seek | (미확인) | — | 500K+ |

#### 아케이드 장르 ASO 패턴

**Voodoo 지배력**: Top 10 중 3개가 Voodoo 게임 (Paper.io 2, Mob Control, Hole.io)
- 공통점: 볼드 네온 컬러 아이콘, 극도로 심플한 게임플레이 비주얼, 짧은 매치

**평점 벤치마크**: App Store 평균 **4.52/5**, Google Play 평균 **4.10/5**

---

### 2.8 스포츠 / 레이싱 (Sports / Racing)

#### 스포츠 Top 10

| 순위 | 게임 | 개발사 | 서브타이틀 | 평점 | 다운로드 |
|------|------|--------|-----------|------|----------|
| 1 | EA SPORTS FC Mobile 26 | EA | The #1 Football Game | 4.7 | 100M+ |
| 2 | Dream League Soccer 2026 | First Touch | Build Your Dream Team | 4.43 | 100M+ |
| 3 | eFootball 2026 | KONAMI | Most Authentic Football Game | 4.1 | 800M 누적 |
| 4 | NBA 2K Mobile | Cat Daddy | Build Your NBA Squad | 4.68 | 41M+ |
| 5 | Madden NFL 26 Mobile | EA | Build Your Ultimate Football Team | 4.3 | 수천만 |
| 6 | Tennis Clash | Wildlife Studios | Real-Time 1v1 Tennis Multiplayer | 4.55 | 140M+ |
| 7 | Retro Bowl | New Star Games | Ultimate Retro Football Experience | 4.6 | 5M+ |
| 8 | MLB 9 Innings 26 | Com2uS | Ultimate Mobile Baseball Game | 4.4 | 10M+ |
| 9 | F1 Mobile Racing | Codemasters/EA | Official Formula 1 Racing Game | 4.16 | 29M+ |
| 10 | Rocket League Sideswipe | Psyonix | Free-to-Play Rocket Car Soccer | 4.3 | 10M+ |

#### 레이싱 Top 10

| 순위 | 게임 | 개발사 | 서브타이틀 | 평점 | 다운로드 |
|------|------|--------|-----------|------|----------|
| 1 | Asphalt Legends | Gameloft | Race. Drift. Dominate. | — | 100M+ |
| 2 | CarX Street | CarX Technologies | Open World Street Racing | 4.58 | 23M+ |
| 3 | CSR 2 | NaturalMotion | Realistic Drag Racing | 4.7 | 대규모 |
| 4 | Need for Speed No Limits | EA | Underground Street Racing | 4.3 | 100M+ |
| 5 | Mario Kart Tour | Nintendo | Race with Mario Anywhere! | 4.33 | 160M+ |
| 6 | Hill Climb Racing 2 | Fingersoft | Physics Off-Road Racing | 4.47 | 100M+ |
| 7 | GRID Autosport | Feral Interactive | Full Console Racing — On Mobile | 4.5 | 프리미엄 |
| 8 | CarX Drift Racing 2 | CarX Technologies | Real Drift Racing Simulator | 4.4 | 10M+ |
| 9 | Race Master 3D | SayGames | Fast Racing Obstacle Courses | 4.51 | 500M |
| 10 | F1 Mobile Racing | Codemasters | Official Formula 1 Racing | 4.16 | 29M+ |

#### 스포츠/레이싱 ASO 패턴

**제목 전략**:
- 스포츠: IP 브랜드명 + 연도 + "Mobile" + 스포츠 종목 (EA SPORTS FC Mobile 26)
- 레이싱: 프랜차이즈명 + 차량 유형 + "realistic/3D/open world" + "multiplayer"

**아이콘 패턴**:
- 스포츠: 라이선스 IP 로고 지배적 (NFL 실드, NBA 로고, F1 브랜드)
- 레이싱: 프리미엄 슈퍼카 사진(CSR2, Asphalt) 또는 컬러풀 카툰(Hill Climb, Race Master)

**스크린샷 방향**: 대부분 **가로** (게임플레이가 가로 화면)

---

### 2.9 카드 / 보드 (Card / Board)

#### Top 10 게임 요약

| 순위 | 게임 | 개발사 | 서브타이틀 | 평점 | 다운로드 |
|------|------|--------|-----------|------|----------|
| 1 | MONOPOLY GO! | Scopely | Roll the Dice — Build Your Empire | 4.80 | 150M+ |
| 2 | Clash Royale | Supercell | Real-Time Card Battle Arena | 4.3 | 450M+ |
| 3 | Pokemon TCG Pocket | The Pokemon Co. | Collect. Battle. Trade. Every Day. | 4.50 | 61M+ |
| 4 | Hearthstone | Blizzard | Collect, Build & Battle with Cards | 4.14 | 57M+ |
| 5 | Balatro | LocalThunk | The Poker Roguelike | 9/10 | 5M+ |
| 6 | MARVEL SNAP | Second Dinner | Hero Strategy CCG | MGoY | 수천만 |
| 7 | Yu-Gi-Oh! Master Duel | KONAMI | Official Yu-Gi-Oh! TCG | 8/10 | 수천만 |
| 8 | Scrabble GO | Scopely | Fun with Words! | 4.46 | 40M+ |
| 9 | Ticket to Ride | Marmalade | Award-Winning Train Strategy | 4.3 | 니치 |
| 10 | Slay the Spire | Mega Crit | The Definitive Roguelike Card Game | 100% | 수백만 |

#### 카드/보드 ASO 패턴

**제목 전략**: IP 브랜드 + "card game/board game" + "multiplayer" + 감성 트리거 ("build", "battle", "collect")

**아이콘 패턴**: IP 인지도 극대화 (포켓볼, 모노폴리맨, 조커 카드)

**인디게임 주목**: Balatro(솔로 개발자)와 Slay the Spire(2인 팀)가 Top 10에 진입 — **인디게임이 카드 장르에서 가장 경쟁력 있음**

---

## 3. 크로스 장르 ASO 패턴 분석

### 3.1 아이콘 디자인 — 장르별 공식

| 장르 | 배경 색상 | 주요 요소 | 스타일 |
|------|----------|----------|--------|
| **퍼즐** | 보라/네이비 + 골드 | 게임 요소 또는 캐릭터 | 밝고 따뜻한 |
| **RPG** | 다양 (캐릭터별) | 캐릭터 초상화 100% | 애니메이션/판타지 |
| **액션** | 다크(밀리터리) 또는 비비드(카툰) | 로고 또는 캐릭터 | 장르에 따라 분화 |
| **전략** | 블랙/딥블루/레드 | 전사/지휘관/왕 | 공격적, 골드 악센트 |
| **시뮬레이션** | 따뜻한 밝은 톤 | 환경/음식/사물 | 친근하고 코지 |
| **캐주얼** | 밝은 보라/블루/오렌지 | 게임플레이 이미지 | 미니멀, 명확 |
| **아케이드** | 네온/비비드 | 게임 메카닉 시각화 | 볼드, 심플 |
| **스포츠** | IP 브랜드 컬러 | 라이선스 로고 | 공식적, 프로페셔널 |
| **레이싱** | 다크 + 스피드감 | 차량 사진/렌더 | 프리미엄 or 카툰 |
| **카드/보드** | IP별 상이 | IP 캐릭터/심볼 | IP 인지도 극대화 |

### 3.2 스크린샷 — 장르별 공식

| 장르 | 방향 | 장수 | 텍스트 오버레이 | 프리뷰 영상 |
|------|------|------|----------------|------------|
| 퍼즐 | 세로 100% | 5-8 | 기능 콜아웃, 레벨 수 | 100% 보유 |
| RPG | 세로+가로 혼용 | 5-8 | 기능명, 수상 뱃지 | 100% 보유 |
| 액션 | 세로 주력 | 5-8 | 모드명, 플레이어 수 | 100% 보유 |
| 전략 | 세로 100% | 8-10 | 볼드 시네마틱 문구 | 100% 보유 |
| 시뮬레이션 | 세로+가로 혼용 | 8-10 | 최소화 (비주얼 우선) | 90% 보유 |
| 캐주얼 | 세로 100% | 5-8 | 마케팅형 or 미니멀 | 90% 보유 |
| 아케이드 | 세로 주력 | 5-7 | 미니멀, 게임플레이 포커스 | 80% 보유 |
| 스포츠/레이싱 | 가로 주력 | 5-8 | 선수명, 시즌명 | 100% 보유 |
| 카드/보드 | 세로+가로 혼용 | 5-8 | IP 시즌/이벤트 아트 | 100% 보유 |

### 3.3 서브타이틀 — 6가지 패턴

서비스에서 인디게임의 서브타이틀을 자동 제안할 때 아래 6가지 유형 중 선택:

| 패턴 | 공식 | 예시 |
|------|------|------|
| **장르 키워드형** | [장르] + [메카닉] | "Match 3 Puzzle & Home Design" |
| **소셜/멀티형** | [PvP/멀티] + [장르] | "PvP & 3v3 Battle Royale MOBA" |
| **감성/서사형** | [감정] + [세계관] | "Set sail for adventure!" |
| **최상급 주장형** | [#1/Best] + [장르] | "The world's #1 IO game" |
| **메카닉 설명형** | [동사] + [동사] + [동사] | "Collect, Grow, Multiply!" |
| **IP/캐릭터형** | [캐릭터명] + [장르] | "King Robert's Match 3 Puzzles" |

### 3.4 평점 벤치마크 종합

| 장르 | App Store 평균 | Google Play 평균 | 최소 권장 |
|------|---------------|-----------------|----------|
| 퍼즐 | 4.73 | 4.55 | **4.5+** |
| RPG | 4.57 | 4.10 | **4.0+** |
| 액션 | 4.48 | 4.35 | **4.0+** |
| 전략 | 4.43 | 4.30 | **4.0+** |
| 시뮬레이션 | 4.49 | 4.35 | **4.0+** |
| 캐주얼 | 4.74 | 4.35 | **4.5+** |
| 아케이드 | 4.52 | 4.10 | **4.0+** |
| 스포츠 | 4.45 | 4.30 | **4.0+** |
| 카드/보드 | 4.40 | 4.20 | **4.0+** |

---

## 4. ASO 자동 분석 로직 설계

### 4.1 입력 정보

```
필수 입력:
- 게임 제목
- 장르 (자동 분류 또는 선택)
- 플랫폼 (iOS / Android / 양쪽)
- 서브타이틀
- 소개문구 (첫 252자 이상)
- 아이콘 이미지
- 스크린샷 이미지들
- 프리뷰 영상 유무

선택 입력:
- 타겟 지역
- 현재 평점
- 경쟁 게임 URL
```

### 4.2 자동 분석 규칙

#### A. 제목 분석

```python
def analyze_title(title, genre):
    score = 0
    issues = []
    
    # 1. 길이 체크
    if len(title) > 30:
        issues.append("제목이 30자 초과 — 스토어에서 잘릴 수 있음")
    
    # 2. 장르 키워드 포함 여부
    genre_keywords = GENRE_KEYWORD_DB[genre]  # 이 문서의 장르별 키워드
    has_genre_keyword = any(kw in title.lower() for kw in genre_keywords)
    if not has_genre_keyword:
        issues.append(f"제목에 {genre} 장르 키워드 없음 — 검색 노출 불리")
    
    # 3. 브랜드 키워드 vs 제네릭 키워드 밸런스
    # IP 게임이 아닌 인디게임은 제네릭 키워드 필수
    
    # 4. 콜론/하이픈 구조 체크
    # "GameName: Genre Keyword" 패턴이 효과적
    # 예: "Homescapes: Puzzle & Design"
    
    return score, issues
```

#### B. 서브타이틀 분석

```python
def analyze_subtitle(subtitle, genre):
    # 6가지 패턴 중 어디에 해당하는지 분류
    pattern = classify_subtitle_pattern(subtitle)
    
    # 장르별 효과적 패턴 매칭
    effective_patterns = {
        "puzzle": ["장르키워드형", "메카닉설명형"],
        "rpg": ["감성서사형", "장르키워드형"],
        "action": ["소셜멀티형", "최상급주장형"],
        "strategy": ["장르키워드형", "소셜멀티형"],
        "simulation": ["메카닉설명형", "감성서사형"],
        "casual": ["장르키워드형", "감성서사형"],
        "arcade": ["메카닉설명형", "최상급주장형"],
        "sports": ["장르키워드형", "IP캐릭터형"],
        "card": ["장르키워드형", "메카닉설명형"],
    }
    
    if pattern not in effective_patterns[genre]:
        return "서브타이틀 패턴 변경 권장"
```

#### C. 아이콘 분석 (AI 이미지 분석)

```python
def analyze_icon(icon_image, genre):
    # 1. 색상 팔레트 추출 → 장르별 벤치마크와 비교
    dominant_colors = extract_colors(icon_image)
    genre_colors = GENRE_COLOR_DB[genre]  # 이 문서의 장르별 색상 패턴
    
    # 2. 구도 분석: 캐릭터 중심 vs 사물 중심 vs 로고 중심
    composition = analyze_composition(icon_image)
    expected_composition = GENRE_COMPOSITION_DB[genre]
    
    # 3. 가독성 체크: 작은 사이즈에서도 식별 가능한지
    
    # 4. 경쟁작과의 차별화 + 장르 문법 준수 밸런스
```

#### D. 스크린샷 분석

```python
def analyze_screenshots(screenshots, genre):
    issues = []
    
    # 1. 장수 체크
    genre_benchmark = GENRE_SCREENSHOT_COUNT[genre]
    if len(screenshots) < genre_benchmark["min"]:
        issues.append(f"스크린샷 부족 — {genre} 장르 권장: {genre_benchmark['recommended']}장")
    
    # 2. 방향 체크 (세로/가로)
    expected_orientation = GENRE_ORIENTATION[genre]
    
    # 3. 텍스트 오버레이 유무 (2026년: 캡션이 검색 랭킹에 영향)
    has_text_overlay = detect_text_in_screenshots(screenshots)
    if not has_text_overlay:
        issues.append("스크린샷에 텍스트 캡션 없음 — Apple 검색 랭킹 요소 누락")
    
    # 4. 첫 3장 분석 (검색 결과에 직접 노출)
    first_three_quality = analyze_first_three(screenshots[:3])
    
    # 5. 프리뷰 영상 유무
    # Top 게임의 95%+ 보유 → 없으면 강력 권장
```

#### E. 소개문구 분석

```python
def analyze_description(description, genre, language):
    # 1. 첫 252자 핵심 정보 밀도
    first_252 = description[:252]
    
    # 2. 장르별 필수 키워드 포함 여부
    required_keywords = GENRE_DESCRIPTION_KEYWORDS[genre]
    missing = [kw for kw in required_keywords if kw not in description.lower()]
    
    # 3. "광고 없음", "오프라인 플레이" 등 전환율 부스터 키워드
    conversion_boosters = ["no ads", "offline", "free", "no wifi"]
    
    # 4. 영문 품질 체크 (번역기 사용 여부 감지)
    if language == "en":
        translation_quality = check_translation_quality(description)
    
    # 5. 소셜 프루프 ("Featured by Apple", 수상 경력)
```

### 4.3 점수 산출 방식

```
총점 = 제목(25점) + 서브타이틀(15점) + 아이콘(20점) 
     + 스크린샷(25점) + 소개문구(15점)

등급:
- 90~100: S등급 (Top 10 수준)
- 75~89:  A등급 (경쟁력 있음)
- 60~74:  B등급 (개선 필요)
- 40~59:  C등급 (주요 개선 필요)
- 0~39:   D등급 (전면 재작업 권장)
```

---

## 5. 자동 제안 템플릿

### 5.1 제목 제안 템플릿

**인디 퍼즐 게임의 경우**:
```
현재: "마법의 보석"
제안 1: "마법의 보석: 매치 퍼즐" (콜론 구조 + 장르 키워드)
제안 2: "마법의 보석 — Match 3 Puzzle" (영문 키워드 혼용)
제안 3: "Jewel Magic: Match & Blast" (글로벌 타겟)
근거: 퍼즐 Top 10의 80%가 장르 키워드를 제목에 포함
```

**인디 RPG의 경우**:
```
현재: "어둠의 기사"
제안 1: "어둠의 기사: Action RPG" (장르 스태킹)
제안 2: "Dark Knight: Fantasy ARPG" (글로벌 타겟)
근거: RPG Top 10의 서브타이틀에 "RPG", "Action", "Fantasy" 고빈도
```

### 5.2 서브타이틀 제안 템플릿

장르별 자동 생성 공식:

```
퍼즐: "[메카닉] [장르] & [부가가치]"
  → "Match 3 Puzzle & Home Design"
  → "Block Puzzle & Brain Challenge"

RPG: "[세계관 형용사] [서브장르]"  
  → "A Space Fantasy RPG"
  → "Urban Fantasy ARPG"

액션: "[PvP 방식] [장르]"
  → "PvP & 3v3 Battle Royale"
  → "Real-Time Survival Shooter"

전략: "[동사] & [동사] in [배경]"
  → "Build & Survive in Winter"
  → "Conquer & Rule Your Kingdom"

시뮬레이션: "[동사], [동사], [동사]!"
  → "Merge & Cook, Theme Restaurant"
  → "Farm, Build & Match-3"

캐주얼: "[감성어] [장르 키워드]"
  → "Daily Puzzle & Block Crush"
  → "Join the endless running fun!"
```

### 5.3 스크린샷 구성 제안 템플릿

**퍼즐 게임 권장 구성 (5-8장)**:
```
1장: 코어 게임플레이 보드 + "핵심 메카닉 한줄 캡션"
2장: 콤보/폭발 이펙트 장면 + "전략적 깊이" 캡션
3장: 데일리 챌린지/이벤트 UI
4장: 스토리/진행 요소 (있다면)
5장: 오프라인 플레이/광고 없음 강조
(선택) 6-8장: 캐릭터 커스텀, 소셜 기능, 수상 뱃지
```

**RPG 게임 권장 구성 (6-8장)**:
```
1장: 전투 액션 시퀀스 + 장르 캡션
2장: 캐릭터/히어로 로스터 쇼케이스
3장: 오픈월드/탐험 풍경
4장: 가챠/수집 시스템
5장: PvP/멀티플레이어 모드
6장: 스토리/시네마틱 장면
(선택) 7-8장: 커스터마이제이션, 이벤트
```

**캐주얼 게임 권장 구성 (5-7장)**:
```
1장: 즉시 이해 가능한 코어 루프 + 한줄 훅
2장: 만족감 있는 게임플레이 순간 (폭발, 컬렉션 등)
3장: 진행/성장 시스템
4장: 소셜/경쟁 요소
5장: 일일 보상/이벤트
```

### 5.4 아이콘 디자인 제안 템플릿

```
퍼즐 인디게임:
  - 배경: 짙은 보라/네이비 (#1A1646) 또는 따뜻한 자연톤
  - 전경: 게임 핵심 요소 (블록, 보석, 캐릭터)
  - 골드/옐로 악센트로 프리미엄 감각
  - 참고: Block Blast, Royal Match 아이콘

RPG 인디게임:
  - 배경: 캐릭터별 테마 색상
  - 전경: 메인 캐릭터 초상화 (100% 필수)
  - 시즌마다 교체 가능한 구조 설계
  - 참고: Genshin Impact, AFK Journey 아이콘

캐주얼 인디게임:
  - 배경: 밝고 명확한 단색 (보라, 블루, 오렌지)
  - 전경: 게임 메카닉 시각화 또는 마스코트
  - 작은 사이즈에서도 즉시 인식 가능해야 함
  - 참고: Paper.io 2, Hole.io 아이콘
```

### 5.5 소개문구 첫 252자 제안 템플릿

```
[장르 한줄 훅] + [핵심 메카닉 설명] + [차별화 포인트] + [행동 유도]

퍼즐 예시:
"빛나는 보석 블록을 드래그하여 줄을 완성하는 전략 퍼즐! 
매일 새로운 도전이 기다리는 데일리 퍼즐 모드와 
1,000개 이상의 스테이지를 공략하세요. 
광고 없이, 오프라인에서도 즐길 수 있습니다."

RPG 예시:
"멸망한 세계를 탐험하며 잃어버린 기억을 되찾는 액션 RPG.
50명 이상의 고유 히어로를 수집하고,
실시간 전투에서 전략적 조합을 만들어보세요.
[수상 경력 / 소셜 프루프 삽입]"
```

---

## 부록: 인디게임 성공 사례 벤치마크

카드/보드 장르에서 인디게임이 대형 IP와 경쟁하여 Top 10에 진입한 사례:

| 게임 | 팀 규모 | 가격 | 성과 |
|------|--------|------|------|
| **Balatro** | 1인 (LocalThunk) | $9.99 | 5M+ 판매, 모바일 첫 2개월 $4.4M |
| **Slay the Spire** | 2인 (Mega Crit) | $9.99 | 수백만 판매, 후속작 Steam 1위 |
| **Monument Valley 3** | ustwo games | 프리미엄 IAP | 4.9 평점, 프리미엄 퍼즐 대표 |
| **Retro Bowl** | New Star Games | F2P/프리미엄 | App Store #1 달성 |
| **Meow Tower** | HyperBeard | F2P | 한국 퍼즐 차트 #10, 4.9 평점 |

**인디게임의 ASO 특징**:
- IP 파워 없으므로 **장르 키워드 밀도가 더 높아야** 함
- 프리미엄 모델은 "try before you buy", "no ads", "single purchase" 강조
- 수상 경력을 스크린샷과 소개문구에 적극 활용
- 감성적/예술적 차별화로 대형 게임과 다른 비주얼 포지셔닝

---

## 참고 자료

### 데이터 소스
- Apple App Store 실시간 차트 (2026.04)
- Google Play 실시간 차트 (SimilarWeb, AppBrain, 2026.04)
- Sensor Tower 월간 보고서 (2025.12, 2026.01-03)
- PocketGamer.biz 월간 차트 (2026.01-03)
- Business of Apps 통계
- AppTweak ASO 벤치마크 리포트 2025-2026
- Phiture ASO Trends 2026
- Appalize ASO Benchmarks 2026

### 개별 게임 스토어 페이지
- 각 장르별 Top 10 게임의 App Store 및 Google Play 스토어 페이지 직접 분석
- 총 80+ 게임의 제목, 서브타이틀, 소개문구, 스크린샷, 아이콘, 평점, 다운로드 데이터 수집

---

*이 문서는 인디게임닷컴 ASO 자동화 서비스의 기준 데이터로 활용됩니다.*
*마지막 업데이트: 2026년 4월 11일*
