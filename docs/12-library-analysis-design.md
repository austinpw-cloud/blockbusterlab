# Reference Library — 분석·활용 설계 (G4)

> 작성: 2026-04-13 (v2 · 전면 재작성)
> 선행: `docs/aso/knowledge.md` (공통 원리·축 프레임), `docs/aso/raw-notes/` (원자료)
> 전임 v1: 장르 × 국가 Top 10 가정 — **폐기**

---

## 1. 목적과 위치

Reference Library 는 **ASO 가 잘 된 게임들의 현재 패턴**을 귀납 관찰로 수집·축적해, 의뢰 게임 가이드에 근거를 공급하는 **누적 지식 자산**이다. 단순한 참조 데이터셋이 아니라, 서비스가 의뢰를 처리할 때마다 발견되는 "ASO 가 잘 된 이유" 의 분석·특징이 쌓이면서 **ASO 전략·가이드·문법에 관한 지식과 인사이트가 넓어지고 깊어지는** 구조.

초기 ~50개로 출발하되, 의뢰 처리 중 분석이 필요한 경쟁작·참고 게임(대개 원래 상위 큐레이션에 포함되어야 했으나 효율상 초기 50개에 포함하지 않았던 매출·인기 상위 게임들)이 발견되면 수집·분석 결과가 Library 에 영구 귀속된다. 의뢰를 처리할수록 Library 가 업그레이드된다.

`docs/aso/knowledge.md` 가 **원리·하드룰·축 프레임** 을 담당한다면, Library 는 **관찰 · 패턴 · 인사이트** 의 3층 구조로 "현재 어떤 패턴·규칙이 통하는가" 의 증거와 의사결정 지식을 담당한다.

### Library 3층 구조

| 층 | 무엇 | 저장 위치 | 쓰임 |
|---|---|---|---|
| ① 관찰 | 게임별 raw 분석 (아이콘·스크린샷·텍스트·L2 게임 종합) | `reference_games` + `reference_screenshots` | 구체 근거 조회 |
| ② 패턴 | 축 조합별 관찰 집계 | `library_patterns.patterns` (집계 필드) | 의뢰 분석의 기본 프레임 |
| ③ 인사이트 | 패턴을 넘는 의사결정 규칙·edge case·안티패턴·축 상호작용·commission 학습 | `library_patterns.patterns` (인사이트 필드) | "언제·어떻게 적용/깨뜨리나" 의 전문성 |

③ 을 별도 테이블로 분리하지 않고 `library_patterns` JSONB 에 내재화한다. 인사이트가 대개 특정 축 조합과 엮여있고, 별도 테이블은 조기 추상화로 판단.

### 지식 흐름

```
knowledge.md         →  원리·하드룰·축 프레임
Reference Library    →  관찰·패턴·인사이트 (누적 심화)
의뢰 게임 가이드      ←  (프레임 × 증거 × 인사이트 × 의뢰 게임 고유 특성)
의뢰 처리 학습        →  인사이트 필드에 피드백 → Library 업그레이드
```

## 2. 핵심 설계 변경 (v1 폐기 이유)

| 항목 | v1 (폐기) | v2 (이 문서) |
|---|---|---|
| 수집 단위 | 장르 × 국가 Top 10 고정 | **전역 큐레이션 pool ~50개** |
| 장르 분포 | 강제 균등 | **자연 분포** (매출 상위 pool 에서 자연스럽게) |
| 산출물 | 장르별 플레이북 | **축 조합별 패턴** (장르 × 시장 × 수익모델 × 규모) |
| 확장 | 사전 일괄 | **의뢰 처리 중 4가지 트리거(표본 부족·경쟁작 보강·참고 레퍼런스·시장 확장)로 온디맨드 추가** → Library 영구 누적 |
| 분석 최종 산출 | 게임 단위 분석 | **패턴 합성 레이어** (L3) 가 서비스 판독 1차 |

## 3. 큐레이션 기준 — 초기 ~50개

"ASO 가 잘 된 게임" 은 직접 측정 어렵다. **ASO 성과의 proxy** 로 찾는다. 게임 품질·디자인 상(GOTY·Apple Design Awards 등) 은 ASO 와 무관하므로 **사용하지 않는다**.

| 경로 | 쿼터 | ASO proxy 로서의 이유 |
|---|---|---|
| **매출·다운로드 차트 상위** | 35개 | 스토어 방문자가 설치로 전환되는 것 = ASO 성과. KR / US / JP grossing Top 50 합산 dedupe. |
| **장르 키워드 검색 상위** | 10개 | 검색 상위 노출 = ASO 가 실제로 작동. 매출 차트 아래 중소형 게임도 포착 |
| **ASO 케이스 스터디 인용** | 5개 | Apptweak·Phiture·Storemaven 블로그가 ASO 작업 사례로 explicit 분석한 게임 |

### IP·AAA 퍼블리셔 필터 (v2.6 추가)

매출 상위라도 **IP·브랜드 파워로 매출이 나오는 게임은 ASO 분석 가치가 낮다** (팬·매니아 유입으로 설치됨 → ASO 수법 효과 검증 불가). 수집 시 2단 필터로 제외:

1. **AAA 퍼블리셔 필터** — 자체 IP 파워 퍼블리셔 whitelist 매칭 시 제외
   - 제외 유지: HoYoverse · Tencent · NetEase · Supercell · King · Blizzard · EA · NCSoft · Nexon · Netmarble · Nintendo · Square Enix · Konami · Bandai Namco · Pokemon Co · Disney · Shift Up · Kuro Games 등
   - Tencent 서브 브랜드(Proxima Beta · Level Infinite · TiMi) 및 HoYoverse(Cognosphere) 포함
   - **제외 취소** (ASO 기반 성장으로 재분류, mid 로 이동 · 수집 대상): Dream Games · Peak Games · Playrix · Moon Active · Scopely · Voodoo · Supersonic · Homa · Jam City · Supercent · Sybo · Outfit7 · Century Games · Magic Tavern 등

2. **IP 프랜차이즈 제목 키워드 필터** — 제목에 라이선스 IP 키워드 포함 시 제외
   - Pokemon · Yu-Gi-Oh · Dragon Ball · Disney · Marvel · Star Wars · Minecraft · Roblox · Monopoly · Final Fantasy · Dragon Quest · Fate · Genshin · Honkai · Wuthering · Lineage · MapleStory · AION · Candy Crush · Clash · Brawl Stars · NBA/NFL/FIFA/MLB · Call of Duty · PUBG · Fortnite · Free Fire · Monster Strike · Angry Birds · CookieRun 등 (영·한·일·중 혼용)

### 평점·리뷰 기반 필터 **없음**

**게임 평점·유저 리뷰 테마는 ASO 분석과 무관** 하므로 큐레이션 필터에 쓰지 않는다. 오히려 "평점 낮은데 매출 상위" 게임은 순수 ASO 효과의 극단 사례로 분석 가치가 있음. 하이퍼캐주얼 장르가 자연스럽게 이 범주를 포괄 (별도 플래그 불필요).

**중국 처리**: 본토 판호 필요로 인해 매출 상위는 **Apple App Store 중국 스토어프론트** 또는 **해외판(HK/TW/SG)** 또는 **TapTap 글로벌** 에서 수집. 중국 전용 Android 서드파티 스토어는 Phase 2.

**각 게임 태깅 필수**
- 장르 (primary + optional secondary)
- 강한 시장들 (`target_markets[]`: KR / US / JP / CN 중 일부)
- 수익모델 (`f2p_ad` / `f2p_iap` / `subscription` / `premium` / `hybrid`)
- 스튜디오 규모 (`solo` / `indie` / `mid` / `aaa`)
- 선별 근거 (`revenue_top` / `indie_exemplar` / `commission_driven` / `case_study` / `keyword_search`). v2.5 이후 `editor_choice` · `award` 제거 — 게임 품질 프록시이지 ASO 프록시 아님.

## 4. 저장 구조

### 4.1 기존 테이블 활용
- `reference_games` 유지. (country, app_id) UNIQUE 유지 — 한 게임이 여러 국가에서 수집되면 여러 행(현지화 버전별).
- `reference_screenshots` 유지.

### 4.2 마이그레이션 006 (신규)

```sql
ALTER TABLE reference_games
  ADD COLUMN IF NOT EXISTS selection_basis TEXT,
    -- revenue_top | indie_exemplar | commission_driven | case_study | keyword_search
    -- (editor_choice · award 는 v2.5 이후 폐기. migration 006 주석에는 남아있으나 실제 타입에서 제거됨)
  ADD COLUMN IF NOT EXISTS target_markets TEXT[],
    -- 이 게임이 강한 시장들 (KR/US/JP/CN). country 와 별개 — country 는 수집 위치, target_markets 는 글로벌 영향 범위.
  ADD COLUMN IF NOT EXISTS monetization_model TEXT,
    -- f2p_ad | f2p_iap | subscription | premium | hybrid
  ADD COLUMN IF NOT EXISTS studio_size TEXT,
    -- solo | indie | mid | aaa
  ADD COLUMN IF NOT EXISTS icon_analysis JSONB,
  ADD COLUMN IF NOT EXISTS icon_analyzed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS icon_analysis_cost_usd DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS text_analysis JSONB,
  ADD COLUMN IF NOT EXISTS text_analyzed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS text_analysis_cost_usd DECIMAL(10,6);

CREATE TABLE IF NOT EXISTS library_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  axis_key TEXT NOT NULL,
    -- 정규화된 키. 예: "genre=puzzle;market=kr;monetization=f2p_iap;studio_size=indie"
    -- NULL 은 '조건 무시' 의미: "genre=puzzle;market=*;monetization=*;studio_size=*" 도 가능
  genre TEXT NOT NULL,
  market TEXT,
  monetization_model TEXT,
  studio_size TEXT,
  patterns JSONB NOT NULL,
    -- 관찰된 패턴 구조화 (§5.3)
  sample_game_ids UUID[] NOT NULL,
  sample_size INT NOT NULL,
  confidence TEXT NOT NULL,
    -- high (n>=8) | medium (n>=4) | low (n>=2). n<2 저장 금지
  synthesized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synthesis_cost_usd DECIMAL(10,6),
  model_used TEXT,
  UNIQUE (axis_key)
);

CREATE INDEX IF NOT EXISTS library_patterns_genre_idx ON library_patterns(genre);
CREATE INDEX IF NOT EXISTS library_patterns_market_idx ON library_patterns(market);
CREATE INDEX IF NOT EXISTS library_patterns_monet_idx ON library_patterns(monetization_model);
```

## 5. 분석 3 레이어

### 5.1 L1 — 관찰 (raw evidence)

**기존 `analyze.ts` + 신규 모듈들**

각 게임에 대해:
- **아이콘 분석** (신규 `analyze-icon.ts`): Vision 1회. 출력 → `reference_games.icon_analysis`
  - 컴포지션 (캐릭터 얼굴 / 오브젝트 / 로고 / 게임플레이)
  - 색 (dominant + accent)
  - 캐릭터 존재·비중
  - 스타일 (3D / 2D / 픽셀 / 플랫 / 포토 / 타입 only / mixed)
  - 무드 · recognizability · 디자인 기법
  - first_impression_goal · what_makes_it_work

- **스크린샷 분석** (기존 `analyze.ts`): 슬롯별 Vision. 출력 → `reference_screenshots.analysis` (기존 유지)
  - `docs/aso/knowledge.md` §4.1 의 축 중심으로 스키마 정리

- **텍스트 분석** (신규 `analyze-text.ts`): Sonnet 1회 (Vision 없음). 출력 → `reference_games.text_analysis`
  - title: 길이 · 기법 · 노림 키워드 · 언어 스타일
  - subtitle / short_description: hook 유형 · 키워드 · CTA 유무
  - full description 첫 250자: 훅 기법 · 구조 · 키워드 밀도 · **스토어 에셋 내 사회적 증거 표현** (개발자가 설명문에 넣은 수상·다운로드 수·언론 인용 등. 유저 리뷰·평점은 분석 대상 아님) · localization 품질
  - 교차 일관성 · notable ASO moves

**비용 (게임 1개당)**
- 아이콘: ~$0.02
- 스크린샷 7장: ~$0.15
- 텍스트: ~$0.015
- L1 합계: ~$0.19

### 5.2 L2 — 게임 단위 ASO 수법 합성 (per-game synthesis)

**신규 `analyze-game.ts`**

**분석 관심의 한정 — 중요**: L2 는 "왜 이 게임이 Top 인가"(= 게임성·운영·IP·광고 등 ASO 밖 요인 포함) 를 다루지 **않는다**. 오직 **"이 게임이 ASO 를 어떻게 했길래 잘 작동했나 — 다른 게임이 참고·재사용할 수 있는 ASO 수법은 무엇인가"** 에 집중. 게임 자체의 품질은 분석 대상 아님.

L1 결과 + 게임 메타(제목·설명·수익모델·영상 URL) 를 **Opus 4.6** 으로 합성. Opus 를 쓰는 이유는 L3 패턴과 의뢰 가이드가 L2 해석 위에 얹히기 때문에 Library 의 **인사이트 품질 바닥**을 결정하는 단계이기 때문.

출력 → `reference_games.aso_analysis`

스키마:
```jsonc
{
  "positioning": "ASO 메타데이터·자산에서 드러나는 한 줄 포지셔닝",
  "aso_success_approach": "이 게임이 ASO 를 어떻게 했길래 잘 작동했는지 2~3문장. 게임성·IP 등 ASO 밖 요인 금지",
  "core_hook": "자극하는 유저 욕구 (ASO 자산이 전달하는 hook)",
  "emotional_appeal": "스토어 자산이 유발하는 주 감정 + 유발 요소",
  "monetization_alignment": "수익모델이 ASO 메시징(제목·서브·스크린샷 캡션·설명)에 어떻게 반영되는가",
  "retention_promise": "ASO 자산에서 암시된 장기 플레이 유인 (서브 카피·스크린샷에 드러난 시즌·컬렉션·소셜 등)",
  "icon_strategy_summary": "L1 아이콘 분석 요약 + 이 게임의 아이콘 ASO 수법",
  "screenshot_sequence_flow": "첫 3장 → 중반 → 후반 스토리텔링. 어떤 ASO 수법으로 CVR 를 만드나",
  "description_hook_summary": "L1 텍스트 분석 요약 + 이 게임의 설명문 ASO 수법",
  "reusable_aso_techniques": [
    "다른 게임이 참고·모방 가능한 구체적 ASO 수법 3~5개. 각 항목은 '무엇을·어떻게' 수준으로 실행 가능하게"
  ],
  "indie_applicability": {
    "replicable": ["인디가 답습 가능한 ASO 수법"],
    "aaa_only": ["AAA 전용 — 인디 답습 금지 (예: 월간 아이콘 교체·유료 CPP 매칭)"]
  },
  "market_fit_notes": "이 게임의 ASO 자산이 target_markets 에서 통하는 언어·비주얼·수익 관점 근거 (ASO 관점에서만)"
}
```

**비용: ~$0.30~0.50/게임 (Opus 4.6).** Sonnet 대비 비싸지만 L2 해석 깊이가 Library 품질 상한을 결정하기 때문에 Opus 선택.

### 5.3 L3 — 패턴 합성 (aggregation, 핵심)

**신규 `synthesize-patterns.ts`**

특정 축 조합에 해당하는 게임들의 L1+L2 결과를 Opus 로 합성 → `library_patterns` 행 생성·갱신.

출력 JSONB 구조:
```jsonc
{
  "axis_scope": {
    "genre": "puzzle",
    "market": "kr",
    "monetization_model": "f2p_iap",
    "studio_size": "indie"
  },
  "sample": { "size": 8, "games": ["...title list..."] },
  "confidence": "medium",

  "icon": {
    "common": {
      "composition": "캐릭터 얼굴 중심 62%, 게임 요소 중심 25%, 로고 13%",
      "dominant_color_families": ["warm_gold", "deep_navy"],
      "style": "2d_illustration 위주",
      "shared_techniques": ["drop_shadow", "thick_stroke"]
    },
    "variations": ["minority 패턴 설명"],
    "avoid": ["이 조합에서 관찰되지 않는 안티패턴"]
  },

  "title_subtitle": {
    "common_patterns": ["장르 키워드 포함 80%", "한글+영문 병기 60%"],
    "hook_types": ["benefit_statement 50%", "feature_callout 30%"],
    "market_specific_cues": ["..."]
  },

  "screenshots": {
    "count_distribution": "중위값 7장 (6~8)",
    "first_three_structure": "1. 코어 메카닉 hook → 2. 성장·진행 훅 → 3. 차별화·사회적 증거",
    "caption_presence": "100% (첫 3장 모두)",
    "orientation": "세로 95%",
    "notable_visual_techniques": ["..."]
  },

  "description": {
    "first_250_hook_types": ["benefit_bullet 50%", "story_hook 30%"],
    "keyword_density_signals": ["반복 키워드 경향"],
    "social_proof_usage": "수상·다운로드 수 인용 빈도"
  },

  "video": {
    "presence_rate": 0.75
    // 초기: 영상 유무 비율만. 길이·스타일 분석은 Phase 2.
  },

  "monetization_alignment": {
    "ad_messaging": "...",
    "iap_messaging": "...",
    "remove_ads_cta": "..."
  },

  "common_pitfalls_observed": ["..."],
  "contradictions": [
    { "claim_a": "...", "claim_b": "...", "notes": "..." }
  ],

  "indie_applicability_notes": {
    "replicable_from_this_cohort": ["..."],
    "aaa_only_strategies_excluded": ["..."]
  },

  // ─── 인사이트 필드 (의사결정 지식, 누적 심화) ───
  "decision_rules": [
    // "X 조건이면 Y 패턴 적용" 형태의 규칙
    { "when": "의뢰 게임이 하이브리드 장르", "then": "2차 장르 패턴 우선 적용", "evidence_games": ["..."] }
  ],
  "edge_cases_and_exceptions": [
    // 공식을 의도적으로 깨는 게 맞는 케이스
    { "pattern_broken": "캐릭터 얼굴 아이콘", "condition": "구체적 오브젝트 매력으로 유입", "evidence_games": ["..."] }
  ],
  "anti_patterns_observed": [
    // 반복 관찰되는 실패 패턴
    { "description": "첫 3장에 스토리 인트로만 배치", "why_fails": "즉시 이해 실패 → 이탈", "evidence_games": ["..."] }
  ],
  "cross_axis_interactions": [
    // 다른 축과의 상호작용
    { "interacts_with": "수익모델 F2P+광고", "rule": "광고 관련 카피는 아이콘에 노출 금지", "evidence_games": ["..."] }
  ],
  "commission_derived_insights": [
    // 실제 의뢰 처리에서 배운 것
    {
      "commission_id": "uuid",
      "insight": "...",
      "trigger_condition": "의뢰 게임 특성 X",
      "confirmed_by_delivery": true,
      "added_at": "2026-04-XX"
    }
  ]
}
```

**합성 트리거**
- 초기 Library 구축 완료 시 (전 축 조합 일괄)
- Library 에 `revenue_top` 또는 `indie_exemplar` 5개 이상 추가될 때 배치
- 의뢰 처리 중 축 조합 미존재 감지 시 온디맨드

**비용**: Opus 4.6 합성 ~$0.30/조합. 총 조합 수(장르 10 × 시장 4 × 수익 5 × 규모 3 = 600)는 너무 많음.

**실용적 접근: 계층적 합성**
1. **Tier A — 조밀 조합 (genre + market 만)**: ~40개 조합. 첫 합성 대상.
2. **Tier B — 조밀 조합 + 수익**: 표본이 4+ 생길 때만 합성.
3. **Tier C — 4축 전부 지정**: 의뢰가 실제 요구할 때 온디맨드.

즉 `library_patterns.market` · `monetization_model` · `studio_size` 는 `NULL` 로 남는 행이 많고, 그 의미는 "해당 축 무시 = 집계 전체 평균". 의뢰 처리 시 **가장 구체적인 조합부터 조회 → 없으면 상위 조합으로 fallback**.

## 6. 의뢰 처리 통합

### 6.1 흐름 (Stage 8 재설계)

```
의뢰 접수
  ↓
[분류] 장르(1차+2차) · target_markets · 수익모델 · 스튜디오 규모 판정
  ↓
[의뢰 게임 분석] 스토어 페이지 · 업로드 자료 · 고유 특성·재미 포인트 추출
  ↓
[Library 조회] library_patterns (패턴 + 인사이트 필드) 
   + 직접 매칭 reference_games
   (축 조합 fallback · 유사 특성 매칭)
  ↓
[확장 필요성 판정] 4가지 트리거 중 해당 시 → 온디맨드 확장 (§6.3)
   T1 축 조합 표본 부족 / T2 직접 경쟁작 보강
   T3 적용 참고 레퍼런스 / T4 시장 확장
  ↓
[확장이 있었다면] Library 누적 후 재조회
  ↓
[가이드 합성] principles.ts + Library 패턴 + 인사이트(decision_rules·edge_cases·anti_patterns) + 의뢰 게임 분석
  ↓
[산출물] 4-part 구조 (권장안 · 근거 · 인디 적용도 · 예외·대안)
  ↓
[인사이트 추출] 이번 의뢰에서 배운 것 요약 (§6.4)
  ↓
해당 축 조합의 library_patterns.commission_derived_insights 에 추가
```

### 6.2 비용 절감 효과

- 기존 Stage 8: 경쟁작 Vision 매 의뢰 호출 → ~$1.77/의뢰
- 신규: Library 조회 (DB) + 의뢰 게임만 라이브 분석 → ~$0.30~0.50/의뢰
- 단, Library 자체 구축·패턴 합성 초기 투자 필요 (§7)

### 6.3 온디맨드 확장 (Library 누적 업그레이드 메커니즘)

**기본 원칙**: 의뢰 게임 분석은 **1차로 Library 활용**. 다만 의뢰 게임이 **추가 조사가 필요하다고 판단되는 상황**에선 경쟁작이든 참고 게임이든 더 수집·분석하고, 그 결과가 자동으로 Library 에 누적되어 다음 의뢰부터는 이미 확장된 Library 를 쓴다. 서비스가 처리한 의뢰 수만큼 Library 가 풍부해지는 구조.

**확장 트리거 (4가지 유형)**

| 유형 | 언제 | 수집 대상 |
|---|---|---|
| **T1 · 축 조합 표본 부족** | 의뢰의 (장르·시장·수익모델·규모) 조합 `sample_size < 4` 또는 `confidence = low` | 해당 조합 상위 매출 차트 + ASO 혁신 사례 후보 |
| **T2 · 직접 경쟁작 보강** | 의뢰 게임과 기능·포지셔닝이 직접 경쟁하는 상위 게임이 Library 에 없거나 수가 부족 | 의뢰 게임 스토어 기반 "Similar apps" + 자동 탐색된 상위 경쟁작 |
| **T3 · 적용 참고 레퍼런스** | 의뢰 게임의 고유 특성·재미(예: 하이브리드 장르·독특한 메카닉·특정 아트 스타일)에 적용하기 좋은 사례가 필요 | 해당 특성의 상위 매출·ASO 혁신 사례 (장르·시장 경계 넘을 수 있음. 단 수상·에디터스 초이스는 선정 기준 아님 — v2.5) |
| **T4 · 시장 확장 요청** | 의뢰 게임이 Library 에 약한 시장 타겟 (예: 일본 진출인데 JP 강한 게임 부족) | 해당 시장 상위 게임 |

각 트리거 유형은 **서로 독립적으로 트리거 가능** — 한 의뢰에서 T2 + T3 동시 요청도 정상.

**확장 흐름**

1. 의뢰 처리 파이프라인이 트리거 유형 + 근거를 명시 (자동 판정 + 필요 시 분석자 판단)
2. 각 유형에 맞는 후보 게임 탐색:
   - T1: 축 조합 매칭 상위 매출 차트
   - T2: 의뢰 게임 스토어 "Similar apps" + 키워드 검색 상위
   - T3: 의뢰 게임 특성 기술 → LLM 이 Library 및 공개 차트에서 유사 사례 추천
   - T4: 타겟 시장 차트 상위
3. **관리자 승인 게이트** — 후보 리스트 + 비용 예상 제시, 승인/편집/거부
4. 승인 시 수집 + L1 + L2 실행 → `reference_games` 에 `selection_basis = 'commission_driven'` + 트리거 유형 기록
5. L3 재합성 트리거 (영향받은 축 조합만)
6. 갱신된 Library 로 의뢰 처리 재개 → 고객 산출물에 근거로 활용

**Library 업그레이드 누적 효과**

- 각 확장은 Library 에 **영구 귀속** — 이후 다른 의뢰에서 동일 축·특성·시장 조회 시 재활용
- 시간이 갈수록 T1 (표본 부족) 트리거는 감소, T2·T3 (의뢰별 고유 특성) 만 남음
- **Library 품질은 처리 의뢰 수에 비례해 향상** — 초기 50개 → 누적 처리로 지속 확장
- `commission_driven` 게임은 대개 **원래 큐레이션 기준(매출·인기·ASO 혁신 사례)에 들 만한 자격이 있지만 효율상 초기에 포함하지 않았던 게임들**. 따라서 누적은 "편향" 이 아니라 **정당한 지식 확장**. 서비스가 돌수록 ASO 전략·문법·인사이트가 넓고 깊어지는 게 이 설계의 핵심 효과
- 확장되는 후보는 **초기 큐레이션과 동일한 품질 기준** 을 만족해야 함: 매출·인기 상위, ASO 관점의 명확한 참고 가치 (v2.5 이후 "수상"은 단독 선정 기준 아님)

**품질 보호 장치**

- 관리자 승인 게이트로 후보 리스트·비용 예상 검토 (자동 무한 확장 금지)
- 후보 선정 기준: 매출·인기 상위 차트, 또는 의뢰 게임 고유 특성의 명확한 참고 사례 중 하나 이상 만족 (v2.5: 수상·에디터스 초이스는 게임 품질 프록시이지 ASO 프록시 아님)
- 한 의뢰에서 확장되는 게임 수 상한 (예: 최대 10개) — 남용 방지
- 확장된 게임의 L1~L2 분석은 기존 게임과 동일한 품질 기준으로 검증·저장

### 6.4 의뢰 처리에서 인사이트 추출·누적

의뢰 처리의 마지막 단계에서 이번 의뢰 특유의 배운 것을 구조화해 해당 축 조합의 `library_patterns.commission_derived_insights` 에 추가한다.

**추출 대상 (LLM 이 아래 질문에 답하면서 자동 생성)**
1. 새로 수집된 경쟁작·레퍼런스 게임에서 발견한 패턴이 기존 Library 를 **확장**하거나 **수정**하는가
2. 이번 의뢰에서 공식을 의도적으로 깬 케이스가 있었는가 (edge_case 후보)
3. 패턴을 적용한 결과 실패 가능성이 보이는 지점 (anti_pattern 후보)
4. 축끼리 예상 외 상호작용이 있었는가 (cross_axis_interactions 후보)
5. 재사용 가능한 의사결정 규칙 (decision_rules 후보)

**저장 형식**: §5.3 `commission_derived_insights` 배열에 append. 각 항목에 `commission_id`·`trigger_condition`·`added_at` 필수.

**정제 주기**: `commission_derived_insights` 가 5개 이상 누적되면 L3 재합성 시 Opus 가 이들을 정식 `decision_rules`·`edge_cases_and_exceptions`·`anti_patterns_observed` 로 승격하고 원 raw 항목은 `confirmed_by_delivery=true` 인 경우에만 보존.

**피드백 루프 (선택적)**
- 관리자가 산출물 품질 평가 시 "이 권장이 실제로 통했는가" 체크박스 → 연결된 인사이트에 `confirmed_by_delivery: true/false`
- `confirmed_by_delivery=false` 가 일정 수 누적된 인사이트는 다음 합성 시 검토 대상

이 메커니즘으로 Library 는 단순 데이터 저장소가 아니라 **서비스 경험이 축적되는 지식 자산** 이 된다. 서비스가 의뢰를 처리할수록 빠르고·효율적이고·전문적으로 작동하는 게 이 설계의 핵심.

## 7. 초기 구축 비용·기간 시뮬레이션

### 7.1 ~50개 Library 구축

| 단계 | 비용 | 기간 |
|---|---|---|
| 수집 (스크래퍼 + Storage) | 거의 0 (API·스토리지) | ~1일 |
| L1 (50 게임 × $0.19, Sonnet 조합) | ~$10 | 수 시간 (병렬) |
| L2 (50 게임 × $0.30~0.50, Opus) | ~$15~25 | 수 시간 |
| L3 패턴 합성 (Tier A 40조합 × $0.30, Opus) | ~$12 | 1~2시간 |
| **합계** | **~$37~47** | **2~3일** |

**표본 밸런스 주의**: 50개를 40조합(장르 10 × 시장 4)에 분포시키면 대부분 조합이 `low (n≥2)` 또는 표본 부족으로 skip. 초기에는 소수 핵심 조합만 `medium (n≥4)` 이상. **의뢰 처리 중 온디맨드 확장(§6.3)으로 점차 채우는** 것이 설계 의도.

### 7.2 의뢰당 비용
- 기존: ~$1.77
- 신규: ~$0.40
- **절감폭**: $1.37/의뢰 → 30건 처리 시 초기 투자 회수

### 7.3 성장 단계
- 의뢰 30건 누적 후 Library 동시 확장 → 150개
- 의뢰 100건 누적 후 → 200개 + Tier B 합성 일부 (수익모델 축까지)
- AAA 규모는 의도적으로 제외 (서비스 대상 아님)

## 8. 모듈 구조

```
website/src/lib/reference-library/
  collect.ts                  (기존 — selection_basis · target_markets · monetization · studio_size 태깅 추가)
  analyze.ts                  (기존 — L1 스크린샷, 스키마 정리)
  analyze-prompt.ts           (기존)
  analyze-icon.ts             (신규 — L1 아이콘 Vision)
  analyze-icon-prompt.ts      (신규)
  analyze-text.ts             (신규 — L1 텍스트, Vision 없음)
  analyze-text-prompt.ts      (신규)
  analyze-game.ts             (신규 — L2 합성)
  analyze-game-prompt.ts      (신규)
  synthesize-patterns.ts      (신규 — L3 패턴 합성)
  synthesize-patterns-prompt.ts (신규)
  orchestrator.ts             (신규 — L1~L3 파이프라인 조정, skipIfAnalyzed)
  pattern-query.ts            (신규 — 의뢰 처리 시 axis_key fallback 조회)
  expansion.ts                (신규 — 온디맨드 확장 후보 탐색·승인 대기)
```

## 9. 엔드포인트·관리자 UI

- `GET /api/dev/reference-library/collect` — 수집 트리거 (기존 확장, 큐레이션 기준 분기)
- `GET /api/dev/reference-library/analyze` — L1~L3 파이프라인 (`levels=1,2,3` · `skip_analyzed=true`)
- `POST /api/dev/reference-library/synthesize` — 특정 축 조합 L3 재합성
- `GET /api/dev/reference-library/patterns?axis=...` — 조회 디버그
- 관리자 UI: 온디맨드 확장 승인 큐 뷰 추가

## 10. 구현 순서 (제안)

| 단계 | 산출물 | 선행 |
|---|---|---|
| **S1** | 마이그레이션 006 (reference_games 확장 + library_patterns 테이블) | 없음 |
| **S2** | `analyze-icon.ts` + 프롬프트 | S1 |
| **S3** | `analyze-text.ts` + 프롬프트 | S1 |
| **S4** | `analyze-game.ts` (L2) — L1 결과 소비 | S2, S3 |
| **S5** | `synthesize-patterns.ts` (L3) — L2 결과 집계 | S4 |
| **S6** | `orchestrator.ts` + 엔드포인트 | S2~S5 |
| **S7** | 큐레이션 45개 수집 완료 ✅ (타겟 50 중 case_study 5 공석). L1~L3 실행 대기 | S6 |
| **S8** | `pattern-query.ts` + Stage 8 통합 ✅ **코드 완료 (2026-04-14)**. 실동작 검증은 S7 L1~L3 실행 후 | S7 |
| **S9** | `expansion.ts` + 관리자 UI 승인 큐. **A-2 가드로 자동 DB 저장 차단 중** (`LIBRARY_AUTO_EXPANSION_ENABLED=false`) | S7 |
| **S10** | 루노소프트 6개 게임 중 1개로 end-to-end 검증 | S8 |

## 11. 결정사항 (사용자 확인 완료)

| # | 항목 | 결정 |
|---|---|---|
| A | 텍스트 분석 L1 vs L2 중복? | **둘 다 유지** — L1 은 기법·구조의 정적 추출, L2 는 "왜 이 훅이 먹히는지" 해석. 역할 분리. |
| B | 영상 분석 | **초기: 영상 유무만 체크** (`has_video: boolean`). 길이·Vision 분석은 Phase 2. |
| C | 패턴 합성 범위 | **Tier A = 장르 × 시장 = 40조합만 초기 합성**. 수익모델·규모는 의뢰 요구 시 온디맨드. |
| D | 장르 매칭 방식 | **1차 장르 우선 조회 → 없으면 2차 fallback**. |
| E | commission_driven 편향? | **편향 아님** — 추가되는 게임은 원래 상위 큐레이션 품질인데 효율상 초기에 빠졌던 게임들. 누적은 정당한 지식 확장. 단 후보 선정 시 품질 기준(매출·인기·ASO 관점 명확한 참고 가치) 만족 필수. v2.5 이후 "수상"은 단독 선정 기준 아님. |
| F | 중국 서드파티 Android 스토어 | **수집 안 함**. 초기: Apple 중국 / 해외판(HK·TW·SG) / TapTap 글로벌만. |

## 12. 남은 지식 공백과의 연결

knowledge.md §끝 "남은 공백 7가지" 중 Library 가 담당:
1. **장르별 아이콘·스크린샷·서브타이틀 현행 패턴** → L3 결과
2. **풀블리드·캡션 유무 대규모 정량표** → L1 스크린샷 스키마에 `caption.present` · `full_bleed` 축 추가 필요
3. **In-App Event install uplift 구체 %** → Library 는 수치 측정 못 함. 스토어 외부 분석 필요 (별도)
4. **App Store Tags 지역 확대 / HIG 아이콘 스펙 / Description 한도 / Ask Play 실체** → Library 범위 밖. Apple/Google 공식 추적 과제

## 13. 다음 액션

1. 본 문서 사용자 리뷰 및 열린 질문 확정 (§11)
2. S1 마이그레이션 006 작성·적용
3. S2~S10 순차 구현
4. 완료 후 v1 스케치(`docs/11-next-session-resume.md` 내 Library 관련 기록)와 동기화

---

## 변경 이력

- v2 (2026-04-13): 전면 재작성. v1 장르 × 국가 Top 10 가정 폐기. 전역 큐레이션 pool + 축 조합 패턴 합성 + 온디맨드 확장 구조로 전환.
- v2.1 (2026-04-13): 온디맨드 확장 트리거 4유형(표본 부족·경쟁작 보강·참고 레퍼런스·시장 확장)으로 확대. Library 누적 업그레이드 성격을 §1 과 §6.1 에 명시.
- v2.2 (2026-04-13): 사용자 검토 결과 반영. 열린 질문 6개 → 결정사항으로 잠금. commission_driven 확장은 편향이 아닌 정당한 지식 확장으로 프레이밍 변경.
- v2.3 (2026-04-13): Library 3층 구조(관찰·패턴·인사이트) 명시. 인사이트는 `library_patterns` JSONB 에 내재화. L3 스키마에 decision_rules·edge_cases·anti_patterns·cross_axis_interactions·commission_derived_insights 추가. §6.4 의뢰 처리에서 인사이트 추출·누적 섹션 신설.
- v2.4 (2026-04-13): L2 프레이밍을 '왜 Top 인가' 에서 **'ASO 를 어떻게 했길래 잘했나'** 로 좁힘 (게임성·운영·IP 등 ASO 밖 요인 제외). L2 모델을 Sonnet → **Opus 4.6** 으로 상향. L2 출력 스키마에 `aso_success_approach` · `reusable_aso_techniques` 명시. 초기 구축 비용 $41 → $61~81.
- v2.5 (2026-04-13): 큐레이션 규모 100개 → **50개** 로 축소. 수상작 카테고리 전면 제거 (게임 품질 상은 ASO proxy 아님). 3경로 재정비 (매출 35 + 검색 10 + 케이스 스터디 5). 초기 구축 비용 $37~47 로 감소.
- v2.6 (2026-04-13): **ASO 본질 명확화** — "게임성을 판단하는 게 아니라 부각하는 기술". L2·L3 에서 **리뷰·평점 입력 전면 제거** (게임성·운영 중심 신호라 ASO 해석에 방해). L2 출력에 `first_impression_hooks`·`curiosity_triggers`·`download_conviction_mechanics` 신설. 큐레이션에 **IP·AAA 퍼블리셔 + IP 프랜차이즈 키워드 2단 필터** 적용 — IP 파워로 매출 나오는 게임은 ASO 분석 가치 낮으므로 제외. Dream Games·Playrix 등 ASO 기반 성장 퍼블리셔는 mid 로 재분류해 수집 대상 포함. "평점↓·매출↑" 게임은 별도 플래그 없이 자연 포함 (하이퍼캐주얼 카테고리가 포괄).
- v2.7 (2026-04-14): **Library 철학 명시 + Stage 8 통합 코드 완료**. (a) **Library 는 항상 존재하는 종합 ASO 기준 축** — 의뢰 게임과 1:1 매칭이 아닌 합성된 기준. "Library 없을 때" 개념 자체를 제거. `fallback_level` 은 주축 매칭의 **세밀도** (specific_4axis → genre_market_monetization → genre_market → genre_only → none), 무매칭이 아님. (b) `pattern-query.ts` 신규 — 주축 조회 + 유사 게임 최대 3개. (c) Stage 8 (`aso-analyzer.ts` · `aso-generation.ts`) 이 Library 를 실제로 **주 프레임**으로 사용하도록 통합. 우선순위 `Library 주축 > 유사 게임 > 경쟁작 > 장르 벤치마크`. (d) 리뷰·평점 의존 제거 (`includeReviews: false`, why_they_top·community_signals 삭제). (e) **A-1 L3 규칙 생성 가드** — n<4 에서 `decision_rules`·`anti_patterns_observed`·`edge_cases_and_exceptions`·`cross_axis_interactions` 4필드는 빈 배열 강제. (f) **A-2 Library 자동 확장 저장 차단** — `LIBRARY_AUTO_EXPANSION_ENABLED=false` 하드 가드, 관리자 승인 UI 구현 전까지 자동 DB 누적 금지.
- v1 (2026-04-13 이전): 삭제됨. Git 히스토리에 보존.
