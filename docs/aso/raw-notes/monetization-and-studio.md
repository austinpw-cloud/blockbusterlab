# 수익모델·스튜디오 규모 축 — ASO 영향

조사일: 2026-04-13
연결 문서: `docs/aso/knowledge.md`, `docs/aso/raw-notes/` (Markets 문서 — 국가별 수용도), ASO Bible 2026

> 국가별 수익모델 수용도(예: JP 가챠 친화, KR 구독 저항 등) 는 **Markets 문서 참조**. 여기서는 수익모델 자체와 스튜디오 규모가 ASO 크리에이티브·메타데이터·운영에 미치는 영향만 다룬다.

---

## 수익모델 축

### F2P + 광고 (하이퍼캐주얼 / 라이트 퍼즐)

- **제목·서브타이틀**
  - 무료 강조는 거의 쓰지 않음 — "Free" 자체가 스토어에서 이미 표시되기 때문에 서브에서는 장르·핵심 액션 동사("Tap", "Match", "Merge", "Run") 를 쓴다.
  - 키워드 측면에서 "puzzle game no ads" 가 실제 검색 쿼리로 존재 (Apptweak/Appalize 레퍼런스) — 단 F2P+광고 게임은 이 키워드를 **피하는** 편이 많고, Premium·Hybrid 쪽이 가져간다.
- **스크린샷·캡션**
  - 80% 의 톱 하이퍼캐주얼 아이콘이 "게임플레이 요소를 그대로 보여주는 아트 스타일" (Apptweak).
  - 캡션은 "One tap", "Easy to play", "Endless fun" 같은 즉시성·단순성 메시지. 튜토리얼·로그인 없음을 암시.
  - 첫 3장에 결과 화면(점수·연쇄 폭발) 을 배치해 도파민 유발 (Supersonic A/B 사례).
- **아이콘·비주얼**
  - 밝은 원색, 과장된 표정, 결과 액션(폭발·레벨업) 이 아이콘에 노출. 게임플레이 스크린을 그대로 변형.
  - 계절·이벤트성 아이콘 교체는 AAA 전용 (아래 스튜디오 축 참조). 하이퍼캐주얼 자체는 UA 물갈이 주기가 빨라서 크리에이티브 교체는 잦지만 **테마 계절 이벤트** 가 아닌 **CVR 테스트 목적**.
- **평점·리뷰 경향**
  - "광고가 너무 많다", "rewarded ad 강제", "interstitial 간격" 류 불만이 1~3점 리뷰 핵심. F2P+광고는 이 불만 자체가 구조적이라 완전 해소 불가 — 리뷰 응답에서 "광고 빈도 조정 옵션" / "Remove ads IAP" 안내가 표준 답변.
- **ASO 접근 전략**
  - 설치 유입 **최대화** 우선. CVR 대비 install volume 이 수익 직결.
  - 키워드는 장르·액션 동사 중심(이미 "game" 단어 없이도 되는 넓은 범위). 롱테일 장르 변주 "merge truck", "idle miner" 등.
  - 첫 3장 스크린샷 hook 강도가 CVR 을 지배 — 텍스트보다 시각 결과.

출처: [ASO Tips for Hyper-Casual (Apptweak)](https://www.apptweak.com/en/aso-blog/aso-tips-for-hyper-casual-mobile-games) / [Supersonic A/B Testing](https://supersonic.com/learn/blog/4-a-b-testing-tips-to-give-your-hyper-casual-games-aso-a-boost/) / [Storemaven Hypercasual Spotlight](https://www.storemaven.com/app-store-category-spotlight-hypercasual-games/) — 2026-04-13 확인

---

### F2P + IAP (RPG / 전략 / 미드코어)

- **제목·서브타이틀**
  - 무료·과금 언급은 거의 안 함. IP 명·세계관 명사·장르("RPG", "Strategy", "Idle") 가 메타데이터 중심.
  - 서브타이틀에 PvP·길드·시즌·협력 등 사회적 훅("Clan Wars", "Guild", "Co-op") 을 배치 — 장기 플레이·ARPPU 를 암시하되 직접 언급 금지.
- **스크린샷·캡션**
  - 진행·성장 곡선 전시: 캐릭터 수집, 장비 강화, 레벨업, 전투 스킬 연출. 캡션은 "Collect", "Upgrade", "Build your team".
  - 과금 구조 자체를 광고하지 않음 — 대신 "가치를 얻을 수 있는 엔드게임·콘텐츠 폭" 을 보여줌.
- **아이콘·비주얼**
  - 캐릭터 클로즈업(특히 일러 기반) — IP 인지 또는 "이 게임은 이런 결의 캐릭터가 있다" 전달.
  - 시즌·콜라보마다 아이콘 교체 가능(AAA 전용, `indie_not_applicable`).
- **평점·리뷰 경향**
  - "Pay to win", "과금 유도 강제", "확률 조작 의심" 류가 핵심 불만. Hybrid 모델(광고도 겸한 F2P+IAP) 은 "광고 보고도 보상 적다" 도 추가.
  - 반대로 고래(whale) 층의 긍정 리뷰가 평점을 지탱하는 양극 구조.
- **ASO 접근 전략**
  - 설치 **양 + 질** 을 동시에 — 엔드게임 플레이어 유입이 LTV 좌우. 따라서 캐주얼 대비 키워드가 좁고 정확("gacha rpg", "afk idle", "4x strategy").
  - IAP 98% 수익 기여는 상위 소수 (Sensor Tower/App 데이터 반복 언급) — CVR 보다 D7/D30 리텐션을 지지하는 크리에이티브 선별 필요.

출처: [App Monetization Strategies 2025 (ASOMobile)](https://asomobile.net/en/blog/mobile-market-money-app-monetization-in-2025/) / [Phoenix Games — ASO for F2P](https://www.phoenixgames.com/announcements/app-store-optimization-for-f2p-games/) / [Pushwoosh Ad Monetization](https://www.pushwoosh.com/blog/optimize-ad-monetization-mobile-game/) — 2026-04-13 확인

---

### F2P + 구독 (Apple Arcade / Google Play Pass)

- **제목·서브타이틀**
  - Apple Arcade 타이틀은 본 앱 이름에 "+" 접미사가 붙는 관례(예: `DREDGE+`, `Unpacking+`) — 서비스 내 식별자이자 검색 신호.
  - 서브타이틀에 "No Ads. No IAP." 류 명시가 흔함 — 구독 내 가치를 강조.
- **스크린샷·캡션**
  - "Included with Apple Arcade" 뱃지 배치. 에디토리얼 카피 톤(시네마틱, 분위기 위주) — 구독자는 이미 과금 결정을 했으므로 "이 주의 고를 만한 가치" 를 설득.
  - 게임플레이 다양성 + 아트 퀄리티가 메인. 수익모델 설득 캡션은 거의 없음.
- **아이콘·비주얼**
  - 에디토리얼 하이라이트 이미지(Apple Arcade 피처링 배너) 가 ASO 만큼 중요 — 사실상 **큐레이션 의존**.
- **평점·리뷰 경향**
  - 과금 불만 거의 없음 (구독자 풀). "콘텐츠 볼륨 부족", "아케이드 빠지면 못 함" 류가 주.
- **ASO 접근 전략**
  - 검색 키워드 최적화 비중 **낮음** — 트래픽은 Apple Arcade 탭·에디토리얼 피처에서 70%+ (Apptweak/SplitMetrics 언급).
  - 대신 피처링 획득이 사실상의 ASO: "originality, quality, creativity, fun, all-ages appeal" 의 Apple 큐레이션 기준 충족이 핵심. (heuristic — 공식 가이드 내부 지표는 비공개.)
  - 이후 Apple Arcade 졸업 시 F2P/Premium 재출시 전환 케이스 → 메타데이터 완전 재설계 필요.

출처: [Apple Arcade Dev](https://developer.apple.com/apple-arcade/) / [SplitMetrics Apple Arcade 설명](https://appradar.com/aso-glossary/apple-arcade) / [Apple Arcade April 2026 Lineup (9to5Mac)](https://9to5mac.com/2026/03/11/apple-arcades-april-lineup-adding-two-of-the-most-acclaimed-recent-indie-games/) — 2026-04-13 확인

---

### Premium 유료 (Monument Valley, Stardew Valley, Retro Bowl, Balatro mobile 등)

- **제목·서브타이틀**
  - 서브타이틀에 "Full game", "Pay once", "No ads. No IAP." 가 자주 등장. 업계 용어로 "Paymium 반대" — 구매 장벽을 정당화.
  - Apple App Store 의 "Pay Once & Play" 피처 섹션이 존재하며, 이곳에 노출되는 것이 Premium 의 주요 ASO 이벤트.
- **스크린샷·캡션**
  - 아트 디렉션·내러티브·퍼즐 구조 전시 중심. "Award-winning", "Critically acclaimed", "Hand-drawn" 같은 품질 수식어 빈번.
  - "Play offline", "No internet required" 도 가치 포인트.
- **아이콘·비주얼**
  - 아트북 표지에 가까움 — 캐릭터·상징 이미지. 브랜드 일관성 강함(시즌 교체 거의 없음).
- **평점·리뷰 경향**
  - 가격 대비 가치에 민감 — "too short for the price", "worth every penny" 로 갈림.
  - 버그·기기 호환성 불만이 F2P 대비 상대적으로 치명적(환불 요구 직결).
- **ASO 접근 전략**
  - 설치 유입 **양보다 가치 설득 CVR** 최적화. 가격 장벽 때문에 CVR 이 F2P 대비 수배 낮음 — 첫 3장 + 영상 + 리뷰 문구가 구매 결정을 좌우.
  - Balatro 케이스(데모→입소문) 처럼 스토어 자체보다 **외부 커뮤니티/스트리머 오버랩** 이 더 강한 드라이버 (Game Developer, GamesRadar 인터뷰). heuristic: 데모/라이트 버전이 효과적이나 모바일 스토어에서는 Lite·Free Trial 분리가 제약 많음.

출처: [Freemium vs Premium (TyrAds)](https://tyrads.com/freemium-vs-premium/) / ["Pay Once & Play" App Store 섹션 (Pocket Gamer)](https://pocketgamer.com/articles/063865/pay-once-play-section-on-app-store-features-games-without-in-app-purchases) / [Balatro 마케팅 (Game Developer)](https://www.gamedeveloper.com/marketing/the-methodical-marketing-beats-behind-overnight-success-balatro) / [Balatro demo 입소문 (GamesRadar)](https://www.gamesradar.com/games/roguelike/balatro-was-a-pain-in-the-ass-to-market-but-it-started-getting-better-once-players-started-cracking-open-the-demo-so-they-could-play-forever/) — 2026-04-13 확인

---

### Hybrid (무료 + 프리미엄 옵션 / Remove Ads IAP / Battle Pass)

- **제목·서브타이틀**
  - 제목은 F2P 와 동일하게 설계. 서브에 암묵적으로 "Play your way" 류 자유도 메시지.
- **스크린샷·캡션**
  - 광고·과금 정보는 거의 비노출. 대신 Battle Pass 시즌·코스메틱·이벤트 사진으로 "페이어가 얻는 차별 경험" 을 전시.
  - "Remove Ads" IAP 가 핵심일 경우 리뷰 응답에서 안내가 표준.
- **아이콘·비주얼**
  - F2P+IAP 와 유사. 시즌 아이콘 교체 가능 (AAA 한정, `indie_not_applicable`).
- **평점·리뷰 경향**
  - "광고 너무 많음 → Remove Ads 결제했더니 또 광고" 류 구조적 불만이 빈번. 상업적 밸런스 설계가 리뷰를 지배.
- **ASO 접근 전략**
  - 2025 이후 "flexibility — 단일 모델이 아닌 결합" 이 기본 (ASOMobile). 광고·IAP·구독·배틀패스를 하나의 게임이 병행하는 케이스가 상위 매출 공통. heuristic: "non-payer 는 광고로, payer 는 프리미엄 경험으로" 가 디자인 원칙 (Pushwoosh).
  - ASO 는 F2P+IAP 전략을 따르되, 상점 카피에 "ad-free option available" 을 명시하는 게 리뷰 리스크 감소에 도움 (heuristic).

출처: [ASOMobile 2025](https://asomobile.net/en/blog/mobile-market-money-app-monetization-in-2025/) / [Pushwoosh Hybrid 원칙](https://www.pushwoosh.com/blog/optimize-ad-monetization-mobile-game/) / [MobileAction — how free apps make money](https://www.mobileaction.co/blog/how-do-free-apps-make-money/) — 2026-04-13 확인

---

## 스튜디오 규모 축

### Solo (1인 — Balatro 급)

- **IP·브랜드 의존도**
  - 0 에 가까움. 장르 키워드·커뮤니티 훅에 전적으로 의존. "roguelike deckbuilder", "poker roguelike" 류 롱테일.
- **현실적 리소스**
  - 트레일러·스크린샷 품질 한계 존재. Balatro 조차 초기 "fancy trailers 도 amazing screenshots 도 없었다" (GamesRadar) — **게임플레이 GIF 루프 + 짧은 자막** 이 현실적 상한.
  - ASO 도구 예산: GrowASO ($49/yr), AstroASO ($9/mo), Komori ($19.99/mo) 수준.
- **리뷰·응답 운영**
  - 24시간 대응 불가. 우선순위는 ① 평점 낮은 리뷰 중 버그 제보, ② 환불 분쟁 가능성 있는 리뷰. 템플릿화 + 주 1~2회 배치 응답이 현실적 (heuristic).
- **AAA 따라하면 안 되는 것**
  - 시즌·이벤트마다 아이콘 교체 (`indie_not_applicable`)
  - 유료 CPP 매칭 트래픽 최적화 (Apple Ads 예산 기반) (`indie_not_applicable`)
  - 글로벌 10개+ 언어 로컬라이제이션 동시 출시 (`indie_not_applicable`, Tier 1 우선 — 서비스 범위 문서 참조)
  - 월간 배틀패스·시즌 메타데이터 리프레시

### Indie (2~20인)

- **IP·브랜드 의존도**
  - 장르 + 과거 타이틀 브랜드(있다면). 대부분 장르 키워드 중심.
- **현실적 리소스**
  - 내부 디자이너 1명·외주 트레일러 가능. 스크린샷 10장 풀셋·1~2개 CPP·영상 1편이 현실적 상한.
  - Tier 1 로컬라이제이션 (EN/KR/JP/CN 간체 정도) 까지 타협점.
- **리뷰·응답 운영**
  - 주 2~3회 배치 응답 + 이슈 기반 트리거 응답. Google Play Reply API 자동화 도입 임계점.
- **AAA 따라하면 안 되는 것**
  - Solo 와 동일 범위. 추가로 **매주 A/B 테스트 로테이션** 은 표본 부족으로 노이즈가 판단을 지배 (heuristic) — 월 단위 테스트가 현실적.

### Mid (중견 퍼블리셔 — 한국의 컴투스·웹젠·슈퍼플래닛 레벨, 글로벌 미드코어 스튜디오)

- **IP·브랜드 의존도**
  - 자사 IP 인지도 중간 — 기존 플레이어 재유입 + 신규 장르 유입 동시 공략.
- **현실적 리소스**
  - CPP 3~5개, Apple Search Ads 예산 있음. 글로벌 Tier 1+2 (EN/KR/JP/CN/TW/DE/FR) 까지 가능.
  - 크리에이티브 A/B 를 스토어 수준·광고 수준에서 모두 진행.
- **리뷰·응답 운영**
  - CS 팀 분리 가능. 24시간 이내 응답 체계 가능.
- **AAA 따라하면 안 되는 것**
  - 매주 아이콘 교체는 여전히 리스크(브랜드 일관성 훼손).
  - 글로벌 피처링 협상은 Apple/Google 파트너 매니저 접점 있을 때만 의미 있음 — 없으면 AAA 전용 (`indie_not_applicable`).

### AAA / IP (HoYoverse, Supercell, King, Niantic)

- **IP·브랜드 의존도**
  - 압도적. 제목 = 검색 볼륨 자체. "Clash Royale", "Candy Crush" 가 일반 명사급 쿼리.
- **예산·도구 (`indie_not_applicable` 플래그)**
  - 20~35개 CPP 풀세트, 국가별 스토어 리스팅 분기, 시즌·콜라보마다 아이콘·스크린샷·영상 전체 교체 (Clash Royale 월간 시즌 — 2019년 7월 Pass Royale 도입 이후 표준). `indie_not_applicable`
  - Apple Search Ads 대규모 입찰 + CPP 매칭으로 CAC 최적화. `indie_not_applicable`
  - 전 세계 30+ 언어 동시 로컬 + 문화 맥락 분기. `indie_not_applicable`
- **리뷰·응답 운영**
  - 전담 CS, 자동화 + 휴먼 오버라이드 2층 구조. 24시간 다국어 대응.
- **AAA 전용 전략 요약**
  - 시즌마다 아이콘·배너 교체 (월 단위 리프레시)
  - 국가·언어·고객 세그먼트별 CPP 10개+ 운영
  - 외부 콜라보 마케팅으로 피처링·에디토리얼 확보
  - 전부 `indie_not_applicable` — 인디가 답습 시 **표본 부족으로 노이즈 학습** + **브랜드 일관성 훼손** + **예산 소진**의 3중 손실.

출처: [Clash Royale Wikipedia — monthly seasons & Pass Royale](https://en.wikipedia.org/wiki/Clash_Royale) / [Apptweak CPP 가이드](https://www.apptweak.com/en/aso-blog/guide-to-custom-product-pages-cpp) / [Adjust — CPP + Apple Search Ads](https://www.adjust.com/blog/custom-product-pages-app-store/) / [Medium — Google Play big-team bias](https://medium.com/@mymultimediasolutions/google-play-is-now-only-for-big-development-teams-solo-devs-beware-caf4ffd39902) / [AppFollow — 리뷰 응답 실무](https://appfollow.io/blog/how-to-respond-to-google-play-reviews) — 2026-04-13 확인

---

## 인디 적용 가능성 태그 예시

| 전략 | 태그 | 근거 |
|---|---|---|
| 시즌마다 아이콘 교체 | `indie_not_applicable` | Supercell Pass Royale 등 AAA 월간 시즌 운영 전제, 브랜드 일관성 훼손 위험 |
| 유료 CPP 광고 매칭 (Apple Search Ads) | `indie_not_applicable` | 예산 의존, CPP 35개 한도를 채울 트래픽 세그먼트가 필요 |
| 국가별 10+ 언어 동시 출시 | `indie_not_applicable` (서비스는 **Tier 1 한정**, `project_service_scope` 참조) | 글로벌 로컬라이제이션 팀 전제 |
| 월간 크리에이티브 A/B 로테이션 | `indie_not_applicable` (표본 부족) | Solo·Indie 는 월 단위 이하로는 노이즈 |
| 첫 3장 스크린샷 hook 품질 강화 | **전 규모 적용 가능** | 65% 의 스토어 트래픽이 검색에서 오고 스크린샷이 즉시 노출 (Apptweak/Storemaven) |
| 장르 키워드 롱테일 최적화 | **전 규모 적용 가능, 인디에게 특히 중요** | IP 검색 볼륨 없는 인디는 장르 키워드가 유일한 유입 경로 |
| Premium 타이틀의 "No Ads / Pay Once" 서브카피 | **Premium·Hybrid(IAP-remove-ads) 적용** | Apple "Pay Once & Play" 섹션 존재, 가치 설득 직결 |
| 리뷰 응답 템플릿화 + 주 1~2회 배치 | **Solo·Indie 권장** | AppFollow 실무 가이드, 자동화 도입 임계점 |
| 대형 IP 콜라보 피처링 협상 | `indie_not_applicable` | Apple/Google 파트너 매니저 접점 전제 |
| 장르 오버랩 스트리머 타겟 외부 UA | **Solo·Indie 권장 (heuristic)** | Balatro 사례 — 스토어 ASO 와 보완재 |

---

## 서비스 가이드 생성 시 분기 체크리스트 (요약)

1. 업로드 게임의 **수익모델** 을 먼저 판별 (개발자 제공 또는 휴리스틱 — IAP 개수·가격·"Remove Ads" 존재 여부).
   - F2P+광고 → 설치량 최대화·첫 3장 결과 화면 hook
   - F2P+IAP → 엔드게임 콘텐츠 폭 전시·장기 소셜 훅
   - 구독 → ASO 비중 축소·큐레이션 피처 준비
   - Premium → "Pay Once / No Ads" 명시·가치 설득 CVR 최적화
   - Hybrid → F2P+IAP 기본 + "ad-free option" 카피 추가
2. **스튜디오 규모** 를 판별 (팀 크기·과거 타이틀·예산 입력).
   - Solo·Indie → 모든 AAA 전용 플래그 제거, Tier 1 로컬라이제이션, 월 단위 A/B
   - Mid → CPP·Tier 2 로컬 포함 권장
   - AAA → 본 서비스 타겟 아님 (`project_service_scope` 에 따라 인디 우선)
3. 국가별 수용도 질문은 **Markets 문서 참조** 로 라우팅, 여기서 중복하지 않음.
