# Google Play 공식 자료 — ASO 관련 발췌

조사일: 2026-04-13
조사 범위: Google Play Console Help, Android Developers Blog, Play 공식 블로그 (google.play, blog.google, developers.googleblog.com), play.google/developer-content-policy
인디 적용 가능성 태그: [무료] 모든 개발자 / [자격] 자격 요건 충족 시 / [예산] 별도 예산 필요

## 필드 한도·스펙

- 앱 title: 최대 30자 (출처: https://support.google.com/googleplay/android-developer/answer/9898842, 확인일: 2026-04-13)
- short description: 최대 80자 — 검색 결과 등에 노출되는 앱 핵심 소개 (출처: https://support.google.com/googleplay/android-developer/answer/13393723, 확인일: 2026-04-13)
- full description: 최대 4,000자 (출처: https://support.google.com/googleplay/android-developer/answer/9866151, 확인일: 2026-04-13)
- developer name: 공연 성과·랭킹·가격·프로모션 문구 포함 금지 (출처: https://support.google.com/googleplay/android-developer/answer/9898842, 확인일: 2026-04-13)

## 이미지·영상 스펙

- app icon: 512 x 512 px, 32-bit PNG (알파 포함), 최대 1,024 KB (출처: https://support.google.com/googleplay/android-developer/answer/9866151, 확인일: 2026-04-13)
- feature graphic: 1,024 x 500 px, JPEG 또는 24-bit PNG (알파 없음) (출처: https://support.google.com/googleplay/android-developer/answer/9866151, 확인일: 2026-04-13)
- screenshot: PNG/JPEG, ≤8 MB/장, 권장 8:5 비율, 권장 해상도 3840x2400 (최소 1920x1200), 게시 최소 2장·각 디바이스별 최대 8장 (출처: https://support.google.com/googleplay/android-developer/answer/9866151, 확인일: 2026-04-13)
- 지원 디바이스 타입: phone / 7-inch tablet / 10-inch tablet / Chromebook / Android TV / Wear OS / Android Automotive / Android XR. Android TV 배포 시 TV 스크린샷 1장 이상 필수 (출처: https://support.google.com/googleplay/android-developer/answer/9866151, 확인일: 2026-04-13)
- Wear OS 워치 페이스: 최소 1장, 1:1 비율, 최소 384x384 px (출처: https://support.google.com/googleplay/android-developer/answer/9866151, 확인일: 2026-04-13)
- promo video: YouTube 링크 방식(Public 필수, Unlisted/Private 불가), 수익화 OFF, Shorts·Live 불가, 가로/세로 모두 지원, 첫 30초만 autoplay (출처: https://support.google.com/googleplay/android-developer/answer/15501235, 확인일: 2026-04-13)
- Asset Library: store listing/experiment/event 그래픽을 한곳에서 관리하는 Play Console 기능 [무료] (출처: https://support.google.com/googleplay/android-developer/answer/16386748, 확인일: 2026-04-13)

## 랭킹 시그널 (공식 언급)

- 메타데이터(title, description, category)와 기타 시그널을 종합해 쿼리 매칭 (출처: https://support.google.com/googleplay/android-developer/answer/4448378, 확인일: 2026-04-13)
- 리텐션 高·크래시 率 低·언인스톨 低 등 engagement + 기술 품질이 추천 빈도 결정 (출처: https://android-developers.googleblog.com/2022/11/supporting-and-rewarding-great-apps-and-games-on-google-play.html, 확인일: 2026-04-13)
- Android vitals 악화 시 Play 노출 기회 제한 (출처: https://android-developers.googleblog.com/2022/10/raising-bar-on-technical-quality-on-google-play.html, 확인일: 2026-04-13)
- Ratings & reviews는 다운로드 의사결정 주요 시그널 (출처: https://android-developers.googleblog.com/2021/08/making-ratings-and-reviews-better-for-users-and-developers.html, 확인일: 2026-04-13)
- SEO-식 키워드 사용 권장하되 spam/키워드 스터핑·단축 설명의 본문 반복 금지 (출처: https://support.google.com/googleplay/android-developer/answer/13393723, 확인일: 2026-04-13)

## CSL (Custom Store Listings)

- 앱당 최대 50개 CSL 생성 가능 [무료] (출처: https://support.google.com/googleplay/android-developer/answer/9867158, 확인일: 2026-04-13)
- 타겟팅 축: 국가/지역, URL(딥링크, 광고 캠페인 연동), 검색 키워드, 사용자 상태(pre-registration, installed 등) (출처: https://support.google.com/googleplay/android-developer/answer/9867158, 확인일: 2026-04-13)
- 한 국가는 하나의 CSL에만 할당 가능 — 중복 타겟 불가 (출처: 같은 URL, 확인일: 2026-04-13)
- pre-registration 국가 대상 별도 리스팅 가능, 프로덕션/테스트 이미 배포된 곳엔 노출 안됨 (출처: 같은 URL, 확인일: 2026-04-13)
- 오가닉 검색 직접 연동 여부는 명시적 수치 공개 없음 — URL/검색 키워드 타겟팅은 주로 캠페인/딥링크용으로 서술 (출처: 같은 URL, 확인일: 2026-04-13)

## Store Listing Experiments (A/B 테스트)

- Play Console 내장, 무료 [무료] (출처: https://support.google.com/googleplay/android-developer/answer/12053285, 확인일: 2026-04-13)
- 앱당 동시 실행 한도: default graphics experiment 1개 OR localized experiment 최대 5개 (출처: 같은 URL, 확인일: 2026-04-13)
- 테스트 가능 항목: app icon, feature graphic, screenshots, promo video, short/full description (default 또는 locale 단위)
- 트래픽 분할·통계 유의성 자동 계산 제공

## In-app Events / LiveOps (Promotional Content)

- 이벤트 타입: time-limited event, real-time event(동시 참여), major update, special event, offer, pre-registration event 등 (출처: https://support.google.com/googleplay/android-developer/answer/12932541, 확인일: 2026-04-13)
- time-limited event: 시작일로부터 최대 30일 이내 종료 (출처: 같은 URL, 확인일: 2026-04-13)
- preview 기간: 이벤트 시작 전 최대 14일간 사전 노출 가능 (출처: 같은 URL, 확인일: 2026-04-13)
- 제출 시점: 시작 60일 전부터 가능, 승인 최대 4일 소요 → 최소 4일 전 제출 권장 (출처: 같은 URL, 확인일: 2026-04-13)
- 노출 위치: Play Store 앱 상세 페이지, 검색, Apps/Games 홈의 이벤트 섹션 — 정확한 동시 활성 카드 수 공식 수치는 미발견
- [무료] 모든 개발자 사용 가능

## Guided Search · Ask Play · Play Store AI 개편 (최신)

- Guided Search: 2025년 9월 Play Store AI 개편 시 공식 발표 — 사용자가 "learn Spanish", "get fit at home" 같은 목표/의도 기반으로 검색, Gemini가 결과를 조직 (출처: https://android-developers.googleblog.com/2025/12/notes-from-google-play-2025.html, 확인일: 2026-04-13)
- You Tab: 2025년 9~10월 Play Points 마켓부터 단계적 롤아웃 — 구독/리워드/추천 허브
- Play Games Sidekick: 2025 말 내부 테스트, 2026 초 확대 — 인게임 Gemini 오버레이로 힌트·가이드 제공 (출처: https://android-developers.googleblog.com/2026/03/level-up-your-game.html, 확인일: 2026-04-13)
- "Ask Play": 2026-04-13 현재 Google 공식 블로그/Play Console Help에서 독립 기능명으로는 미발견. Google Maps "Ask Maps" 및 Google for Developers 내 AI chat은 별개. — 미확인/추적 필요
- ASO 영향: intent 기반 매칭 강화 → short description·full description의 "무엇을 하는가/어떤 목표를 이루는가" 서술이 키워드 나열보다 중요해질 가능성 (공식 수치/가이드 미공개)

## Level Up / Level Up+ 프로그램

- Level Up: 2025년 9월 공식 런칭, 모든 게임 카테고리 대상 [자격] 가이드라인 준수 시 (출처: https://android-developers.googleblog.com/2025/09/introducing-google-play-games-level-up.html, 확인일: 2026-04-13)
- 혜택: 스토어 피처링, Play Points 부스터, 퀘스트 — 2025년 피처링 윈도우 동안 설치 평균 +25%, 누적 2.5B 증분 획득 보고
- Level Up+ 조건(둘 중 하나): (a) 최근 3개월 DAU 1.6M+ AND 활성 설치 1.6M+, (b) 최근 1개월 DAU 2M+ AND 활성 설치 2M+ [자격] 고성과 게임만 (출처: https://support.google.com/googleplay/android-developer/answer/16501431, 확인일: 2026-04-13)
- 인디 적용: 대부분 Level Up 기본 티어에 해당. Level Up+는 인디에 사실상 비현실적
- Indie Games Fund (LatAm): $150K~$200K equity-free, 스튜디오 직원 ≤50명, 라틴아메리카 대상 (2025 4회차) [자격/지역제한] — 한국 인디에는 비대상 (출처: https://android-developers.googleblog.com/2025/07/google-plays-indie-games-fund-latin-america-returns-2025.html, 확인일: 2026-04-13)

## 리뷰·응답

- Play Console "Reviews" 섹션에서 리뷰당 1개 공개 답변 가능 [무료] (출처: https://support.google.com/googleplay/android-developer/answer/138230, 확인일: 2026-04-13)
- 답변 시 유저에게 푸시+이메일 알림 발송, 언제든 수정 가능
- Reply to Reviews API 제공 (Zendesk 등 외부 툴 연동 가능)
- 권장: 구체적 이슈에 답변, 더 높은 평점 요청 금지, FAQ/지원 링크 포함
- 부적절 리뷰 신고 가능 (출처: https://support.google.com/googleplay/android-developer/answer/7318385, 확인일: 2026-04-13)

## 정책 제약 (Metadata / Store Listing)

- 앱 title/icon/developer name에 랭킹·성과·가격·프로모션 시사 텍스트·이미지 금지 ("#1", "Top", "Best", "Free" 등) (출처: https://support.google.com/googleplay/android-developer/answer/9898842, 확인일: 2026-04-13)
- Title/short/full description에서 emoji, emoticon, 반복되는 특수문자 사용 금지 (출처: 같은 URL, 확인일: 2026-04-13)
- 키워드 스터핑, short description을 full description에 복붙, 무관 키워드 반복 금지 (출처: https://support.google.com/googleplay/android-developer/answer/13393723, 확인일: 2026-04-13)
- 앱 실제 기능을 정확히 설명해야 함 — misleading 금지 (출처: https://support.google.com/googleplay/android-developer/answer/9898842, 확인일: 2026-04-13)
- promo video: 기기를 조작하는 손/손가락 노출 금지(오프-디바이스 게임 제외), 과도한 로고·컷신·프리렌더 지양, 실제 플레이/앱 경험 위주 (출처: https://support.google.com/googleplay/android-developer/answer/15501235, 확인일: 2026-04-13)
- 인앱 이벤트: 허위 카운트다운·deceptive 프로모션 금지 (Content Quality 가이드라인) (출처: https://support.google.com/googleplay/android-developer/answer/12929944, 확인일: 2026-04-13)
- AI 생성 콘텐츠 앱은 별도 정책 준수 필요 (출처: https://support.google.com/googleplay/android-developer/answer/13985936, 확인일: 2026-04-13)

## 모순·불확실·미확인

- "Ask Play"라는 명칭의 Play Store 전용 AI 기능은 2026-04-13 현재 공식 채널에서 독립 고유명으로 확인 불가. 유사 기능은 Guided Search(2025.9)와 Sidekick(2026.3). 사용자가 말한 "Ask Play"가 어떤 출처인지 추가 확인 필요
- Full description에서 인덱싱되는 키워드의 가중치/추출 방식은 공식적으로 수치 미공개 — "키워드 반복 금지"만 명시
- CSL이 오가닉 검색 노출에 미치는 영향은 공식 비율 수치 없음 (주로 광고/딥링크 트래픽용으로 서술됨)
- In-app event 동시 활성 개수 상한은 공식 help 문서에서 명시적 수치 미발견 (30일 duration 및 4일 승인 시간만 확인)
- 스크린샷 "8:5" 권장 비율은 feature graphic 구도와 같으나, 실제 Play 표시 비율은 16:9 게임도 흔함 — 최소 해상도만 강제되고 비율은 권장
- feature graphic 내 텍스트 오버레이 허용 여부는 명시적 금지 없음 (title/icon만 성과·가격 언급 금지 규정). 그러나 실무상 너무 많은 텍스트는 low-quality로 피쳐링 제외 리스크
- Android Developers Blog 2026-04의 Gemma 4 / AICore 발표는 ASO가 아닌 온디바이스 AI 런타임 관련 — 서비스 스펙엔 미반영
