# Apple 공식 자료 — ASO 관련 발췌

조사일: 2026-04-13
조사 방식: developer.apple.com 공식 페이지 정적/WebFetch 수집. WWDC 세션은 공개 트랜스크립트 요약 기반.

---

## 1. 필드 한도

- App name: 최대 30자 (출처: https://developer.apple.com/app-store/product-page/, 확인일: 2026-04-13)
- Subtitle: 최대 30자, 버전 제출 없이도 갱신 가능 (출처: https://developer.apple.com/app-store/product-page/, 확인일: 2026-04-13)
- Promotional text: 최대 170자, 버전 제출 없이 언제든 갱신 가능 (출처: https://developer.apple.com/app-store/product-page/, 확인일: 2026-04-13)
- Keywords: 총 100자, 콤마 구분·공백 없음(문구 내 공백은 허용) (출처: https://developer.apple.com/app-store/product-page/, 확인일: 2026-04-13)
- Description: 명시 상한 없음(공식 페이지에 문자 수 미기재, 업계 통용 4,000자는 Apple 공식 문서에 수치로는 언급 안 됨) — 버전 제출 시에만 수정 가능 (출처: https://developer.apple.com/app-store/product-page/, 확인일: 2026-04-13)
- App Review Guidelines 2.3.7: "App names must be limited to 30 characters" 명시 (출처: https://developer.apple.com/app-store/review/guidelines/, 확인일: 2026-04-13)
- In-App Event name: 최대 30자, title case (출처: https://developer.apple.com/app-store/in-app-events/, 확인일: 2026-04-13)
- In-App Event short description: 최대 50자, sentence case (이벤트 카드에 표시) (출처: https://developer.apple.com/app-store/in-app-events/, 확인일: 2026-04-13)
- In-App Event long description: 최대 120자, sentence case (이벤트 상세 페이지에 표시) (출처: https://developer.apple.com/app-store/in-app-events/, 확인일: 2026-04-13)

## 2. 이미지·영상 스펙

### 스크린샷 (출처: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/, 확인일: 2026-04-13)
- 장수: 디바이스 패밀리당 1~10장
- 포맷: .jpeg / .jpg / .png
- iPhone 6.9" (필수, iPhone 지원 시): 1290 x 2796 / 2796 x 1290 px 계열 — 페이지 명시 1260×2736 또는 2736×1260 (최신 iPhone 17/16 Pro Max 등 기준)
- iPhone 6.5" (6.9" 미제공 시 필수): 1284 x 2778 또는 1242 x 2688
- iPad 13" (iPad 지원 시 필수): 2064 x 2752 또는 2048 x 2732
- Mac: 16:10, 1280×800 / 1440×900 / 2560×1600 / 2880×1800
- Apple Vision Pro: 3840 x 2160
- Apple TV: 1920×1080 또는 3840×2160
- 파일 사이즈 상한: 공식 문서 미기재

### App Preview (동영상) (출처: https://developer.apple.com/app-store/app-previews/ + https://developer.apple.com/help/app-store-connect/reference/app-preview-specifications/, 확인일: 2026-04-13)
- 로케일·디바이스당 최대 3개
- 길이: 15~30초
- 파일 크기: 최대 500MB
- 포맷: H.264 (.mov/.m4v/.mp4) 또는 ProRes 422 HQ (.mov)
- 프레임레이트: 최대 30fps
- H.264 비트레이트 타깃: 10–12 Mbps
- 오디오: 스테레오, 256kbps AAC, 44.1/48kHz
- iPhone 6.9"/6.5"/6.3"/6.1" 공통: 886×1920 또는 1920×886 (19.5:9)
- iPad 13"/11"/10.5": 1200×1600 또는 1600×1200 (4:3)
- Vision Pro: 3840×2160 (16:9)
- 음소거 자동재생 — 첫 몇 초의 시각적 임팩트 중요 (출처: https://developer.apple.com/app-store/product-page/, 확인일: 2026-04-13)
- Poster frame 별도 지정 가능

### App Icon
- App Store 마케팅 아이콘: 1024×1024 PNG, 알파 채널 없음 (출처: HIG/Xcode documentation — JS 렌더링 페이지라 정적 수집 실패. 확인일: 2026-04-13, **페이지 원문 재확인 필요**)
- HIG app-icons 페이지 및 Xcode "configuring-your-app-icon"은 JavaScript 필수이라 curl/WebFetch 로 본문 추출 불가 — 페이지 최신 수정일 불명

## 3. 랭킹·검색 시그널 (Apple 공식 인정분만)

- App Store 공식: "Search results are based on a number of factors, including text relevance (matches for your app's title, subtitle, keywords, and primary category), as well as user behavior (downloads, ratings and reviews, and more)." (출처: https://developer.apple.com/app-store/search/, 확인일: 2026-04-13)
- 즉 공식 시그널: (a) 텍스트 관련성 — title / subtitle / keywords / primary category, (b) 사용자 행동 — downloads / ratings / reviews
- Promotional text 는 "doesn't affect your app's search ranking" — 키워드 용도로 쓰지 말 것 명시 (출처: https://developer.apple.com/app-store/search/, 확인일: 2026-04-13)
- Primary category + optional secondary category 가 검색 알고리즘에 인덱싱됨, 게임은 서브카테고리 2개 추가 선택 가능 (출처: https://developer.apple.com/app-store/search/, 확인일: 2026-04-13)
- Ratings/reviews 가 랭킹에 영향: "can influence how your app ranks in App Store search" (출처: https://developer.apple.com/app-store/search/, 확인일: 2026-04-13)
- 스크린샷이 검색 결과에 표시됨 — 앱 프리뷰 부재 시 방향성에 따라 첫 1~3장 노출 (출처: https://developer.apple.com/app-store/product-page/, https://developer.apple.com/app-store/search/, 확인일: 2026-04-13)
- **스크린샷 내 캡션 텍스트가 검색 인덱싱 대상이라는 공식 언급 없음** (통념과 달리 Apple 문서에 명시 없음 — 3자 해석 영역)
- App Store Tags 는 앱 메타데이터 기반 LLM 생성 → 검색 결과·Search Landing Page 에 노출 (출처: https://developer.apple.com/app-store/search/, https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-tags/, 확인일: 2026-04-13)

## 4. CPP (Custom Product Pages)

(출처: https://developer.apple.com/app-store/custom-product-pages/, https://developer.apple.com/app-store/search/, 확인일: 2026-04-13)

- iPhone/iPad 용 최대 70개 추가 버전 발행 가능
- 가변 요소: 스크린샷, promotional text, app previews
- 각 CPP 는 고유 URL — 외부 채널 공유용
- **CPP 에 키워드 할당 가능 → 해당 키워드 검색 결과에 default 가 아닌 CPP 가 노출됨** (WWDC 2025 발표 후 적용). 키워드 조합은 CPP 별 유니크해야 함
- CPP 메타데이터는 App Review 필요하지만 앱 업데이트와 독립적으로 제출 가능
- 오가닉 노출: editorial 기획(Today/Games/Apps), 검색 결과에 노출 가능 — Apple Ads 필수 아님
- Apple Ads 병행 시 Search tab ads / 검색 결과 ad variation 으로도 활용
- Deep link 할당 가능 (iOS 18+)
- Apple 공식 통계: CPP 링크로 유입 시 평균 2.5pp 전환율 상승 (default 1.6% 대비 +156%)
- **인디 적용성: Apple Ads 없이도 외부 SNS/커뮤니티 링크로 활용 가능**

## 5. In-App Events

(출처: https://developer.apple.com/app-store/in-app-events/, 확인일: 2026-04-13)

- 앱당 동시 게재 최대 10개, App Store Connect 에 승인 보관 최대 15개
- 이벤트는 앱 버전과 독립적으로 제출·심사 가능
- 노출 위치: 자사 product page / 검색 결과(앱 다운로드한 유저에게 카드, 비다운로드 유저에게 스크린샷) / 사용자가 이벤트명 직접 검색 / Today·Games·Apps 에디토리얼
- 배지 종류: Challenge, Competition, Live Event, Major Update, New Season, Premiere, Special Event
- 부적격 사례: 반복 일일 과제, 신규 콘텐츠 없는 가격 프로모션, 앱 일반 홍보
- **인디 적용성: 시즌 업데이트·콜라보·경쟁 이벤트에 효과적. 단순 세일은 불가.**

## 6. App Store Tags (WWDC 2025 신규)

(출처: https://developer.apple.com/app-store/search/, https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-tags/, WWDC 2025 "What's new in App Store Connect" 세션 공개 트랜스크립트 기반, 확인일: 2026-04-13)

- 생성 방식: LLM 이 App Store Connect 메타데이터(설명·카테고리·스크린샷 포함) 기반으로 자동 생성 → 인간 큐레이션 검수
- 노출: 검색 결과·제품 페이지·Search Landing Pages 에 태그로 표시, 탭하면 유사 앱 컬렉션
- 개발자 통제: App Store Connect > App Information > General > App Store Tags 에서 선택 해제 가능. 전부 해제 시 discoverability 저하 경고
- 지역: **현재 미국 지역만 표시** (확인일 2026-04-13 기준)
- 최대 개수 공식 문서 미기재
- 필요 역할: Account Holder / Admin / App Manager / Marketing
- **ASO 영향: 스크린샷·description 이 tag 생성 입력이므로 메타데이터 품질이 tag 품질에 직접 영향 — 공식 명시**

## 7. Product Page Optimization (A/B 테스트)

(출처: https://developer.apple.com/app-store/product-page-optimization/, 확인일: 2026-04-13)

- 최대 3개 treatment vs original 동시 비교 (총 4 variants)
- 동시 테스트: 1개만 가능
- 최대 기간: 90일
- 테스트 요소: app icon / screenshots / app preview
- 트래픽 할당 % 개발자가 직접 설정
- 전체 또는 부분 localization 가능
- 테스트 시작 후 수정 불가
- Alternate icon 테스트는 앱 바이너리에 해당 icon 포함 필요 (binary 업데이트 연동)
- **인디 적용성: 스크린샷·프리뷰 A/B 는 앱 업데이트 없이 독립 제출 가능**

## 8. 리뷰·응답

(출처: https://developer.apple.com/app-store/search/, App Store Connect Help — Respond to reviews, 확인일: 2026-04-13)

- Ratings/reviews 가 검색 랭킹에 영향 — Apple 공식 확인
- Developer response 기능 App Store Connect 내 제공 (Monitor ratings and reviews > Respond to reviews)
- WWDC 2025: AI 기반 리뷰 요약(Review Summaries) 제품 페이지에 표시됨, App Store Connect 에서 확인·피드백 가능 — 출처: WWDC 2025 "What's new in App Store Connect" 세션

## 9. 정책 제약 (App Review Guidelines 2.3 계열)

(출처: https://developer.apple.com/app-store/review/guidelines/, 확인일: 2026-04-13)

- 2.3.3 스크린샷은 "app in use"를 보여야 함 — title art / login / splash 만 있으면 안 됨. 텍스트·이미지 오버레이 허용
- 2.3.4 App preview 는 **앱 자체의 화면 캡처만** 허용. 나레이션/오버레이 가능. In-app 화면 밖 (손가락·디바이스 촬영) 금지
- 2.3.7 키워드·메타데이터 stuffing 금지: trademarked terms, 인기 앱명, 가격, 무관한 문구 금지. 서브타이틀도 "standard metadata rules" 따라야 함
- 2.3.8 아이콘·스크린샷·프리뷰는 **4+ 등급 기준**으로 적합해야 함 (앱 등급이 높아도). "For Kids"/"For Children" 용어는 Kids 카테고리 전용
- 2.3.9 아이콘·스크린샷·프리뷰 소재 권리 확보 책임은 개발자. 실제 인물 데이터 금지
- 2.3.10 타 플랫폼(Android 등) 이름·아이콘·이미지 노출 금지
- Keywords 금지: 상표 무단 사용 / 무관 용어 / 경쟁 앱명 / 부적절 표현
- Promotional text 에 키워드 스터핑 시도하지 말 것 명시 (출처: https://developer.apple.com/app-store/search/)

## 10. 기타 (부가 ASO 인자)

- Localization: 50+ 로케일 지원 (출처: https://developer.apple.com/help/app-store-connect/reference/app-store-localizations/, 확인일: 2026-04-13). 한국어 포함
- Primary + Secondary category 모두 검색 알고리즘 인덱싱. Games 는 primary/secondary 선택 + 서브카테고리 2개 추가 (출처: https://developer.apple.com/app-store/search/)
- In-App Purchase promotion: 제품 페이지/검색에 노출 가능
- Featuring nomination: App Store Connect 에서 에디토리얼 피처링 노미네이션 제출 가능 (직접 ASO 시그널은 아니나 디스커버리 경로)

---

## 모순·불확실·미확인

- **App 아이콘 세부 스펙**: HIG app-icons / Xcode configuring-your-app-icon 페이지가 JavaScript 렌더링이라 정적 수집 실패. 1024×1024 PNG·no-alpha 는 업계 통용이지만 **공식 페이지 문구로 이번 회차 재확인 못 함**. 브라우저 렌더링 또는 PDF 로 재수집 필요.
- **Description 문자 상한**: "Creating Your Product Page" 공식 페이지에 숫자 미기재. 통용 4,000자는 별도 App Store Connect UI 제약으로 추정되나 **문서 출처 확보 못 함**.
- **스크린샷 캡션 인덱싱**: Apple 공식 문서 어디에도 "screenshot captions are indexed for search" 명시 없음. App Store Tags 생성 입력으로 스크린샷이 쓰인다는 WWDC 2025 언급은 있으나, 이것이 "랭킹 시그널" 인지 "tag 생성 시그널" 인지 경계 불분명 → 보수적으로 후자로 기록.
- **App Store Tags 지역 확대 일정**: 2026-04 현재 US only 공식 표기. 한국 포함 시점 Apple 공식 발표 없음.
- **Tags 최대 개수**: 공식 문서 미기재.
- **In-App Event 미디어 스펙 페이지**: `/help/app-store-connect/reference/in-app-event-media-specifications/` 현재 404 로 반환. 과거 URL 이었을 가능성. WWDC 비디오 또는 App Store Connect 내부 UI 문서 확인 필요.
- **WWDC 세션 "Discover games with App Store tags"**: 2025 세션 리스트에서 정확한 동일 제목 세션 확인 실패. 게임 관련 세션은 "Engage players with the Apple Games app" (WWDC25 세션 215). App Store tags 관련 내용은 "What's new in App Store Connect" (WWDC25 세션 328) 트랜스크립트에서 확보. **영상 직접 시청 아님, 공개 트랜스크립트 기반 요약**.
- **Apple Games app** (WWDC25 발표): 게임 전용 디스커버리 허브. 인디 게임 ASO 에 중요한 채널일 가능성 — 별도 심층 조사 필요.
- **페이지 최신 수정일**: developer.apple.com 페이지들은 last-modified 명시가 없어 모두 "페이지 최신 수정일 불명" 라벨.
