# 다음 세션 재개 가이드

> **마지막 업데이트**: 2026-04-13 (Stage 8 교정 + Stage 9 재설계 + Codex 검증 반영 후)
> **다음 세션 시작 시 이 문서 먼저 읽을 것**

## 현재 어디까지 왔나

### 정상 동작 중 (건드리지 말 것)
- 고객 신청 폼 `/apply` + Google Play URL 자동 수집
- 관리자 백오피스 `/admin` (매직 링크 로그인, 주문 관리, 상태 변경)
- Vercel 배포 (indiegame-opal.vercel.app)

### 완료 (2026-04-13 이번 세션)

#### Stage 8 ASO 분석 엔진 v2.1 — 프롬프트·스키마 교정
- **글로벌 프레임**: 한국 기본 + 일본·미국·중국·대만 확장 (target_market 첫 항목을 country 로 resolve)
- **스토어별 필드 분리**: `store_specific.google_play` (short_description 80) / `store_specific.apple_app_store` (subtitle 30, promotional_text 170, keywords 100 비공개 메타)
- **competitive_insight 10개 신규 축**: why_they_top, core_hook, emotional_appeal, community_signals, monetization_model, retention_promise, icon_design_strategy, screenshot_sequence_flow, description_hook, direct_confrontation_risk
- **반전 인사이트 강제 완화** — "있을 때만 질적으로"
- **AI 언급 금지** 명시 (고객 대면 결과물)
- **페르소나 재프레임**: 두 분(정무식·임재청)은 서비스 주체·공신력, 분석 엔진은 ASO bible·Library·실시간 경쟁작 데이터 기반 판단
- **`lib/aso/principles.ts` 신규** — ASO bible/guide 발췌 공통 주입 모듈 (STORE_FIELD_RULES, GENRE_SLOT_DEFAULTS, MARKET_CHARACTERISTICS, QUALITY_BAR, ASO_CORE_PRINCIPLES)
- **리뷰 수집** 추가 — 상위·하위 평점 혼합 샘플링, 의뢰 게임 + 경쟁작 모두
- **수익모델 힌트** 추가 — IAP·광고·구독 구조 파싱

#### Stage 9 스크린샷 제작 — 전면 재설계
**아키텍처**: 평가 → 분기 (가이드 OR 제작) → 오버레이 레이어 composite

신규 모듈 (`src/lib/screenshot/`):
- `library-coverage.ts` — Library 커버리지 판정 + 엄선 보완 + 영구 upsert. `LibraryNotReadyError` 로 미구축 장르 명시적 차단
- `judge-materials.ts` + prompt — 업로드 자료 평가 (keep/missing 선별적 유지 + sharp 기반 종횡비 실측)
- `upload-guide.ts` — 한국어 마크다운 가이드 (템플릿 조립)
- `overlay-design.ts` + prompt — 게임 원본 보존, 오버레이 레이어만 AI 생성
- `composite-renderer.ts` — 배경 img + 오버레이 composite. `<img>/<iframe>/<video>/<script>` 및 CSS `url()` sanitize
- `generate.ts` 재작성 — 오케스트레이션, `purgePreviousStage9Deliverables` 로 가이드·스크린샷 상호 배타 최신만 유지
- 관리자 UI: `UploadGuideView` 신규, `GenerateScreenshotsButton` 분기 대응

폐기: `ai-design.ts`, `ai-design-prompt.ts`, `ai-html-wrapper.ts`, `reference-images.ts`, `template.ts`

#### 이미지 해상도 수정
- `scraper/highres.ts` 공통 헬퍼 — Google Play CDN URL 에 `=w2400` 파라미터
- 4개 파일 적용: `google-play.ts`, `competitor-fetch.ts`, `image-ingest.ts`, `reference-library/collect.ts`
- 쿼리스트링·해시 분리 안전 처리

#### Reference Library 국가 차원 도입
- `reference_games.country` 필드 추가, `(country, app_id)` 복합 UNIQUE
- Storage 경로 `{country}/{genre}/{appId}/...`
- `aso_analysis`, `reviews_summary`, `monetization`, `video_url`, `last_refreshed_at` 컬럼 추가
- `collect.ts` 3개 함수 (`collectReferenceGamesForGenre`, `collectSpecificGames`, `recollectGenreFromScratch`) 모두 country 일관성
- `analyze.ts` country 필터 추가
- `library-coverage` 가 country 파라미터 받아 (country, genre) 범위만 조회·보완

#### Codex 검증 기반 13개 수정 (Critical 6 + High 2 + Medium 5)
- composite-renderer sanitize / judge aspect ratio 검증 / library 자동 Top 3 fallback 제거 / generate 상호 정리 / Phase 6 셀프체크 완화 / judge 환각 방어 / 마이그레이션 005 idempotent / analyze country 필터 / principles feature_graphic 충돌 해소 / 페르소나 어조 조정 / 004 트랜잭션 주석 / fetchSimilarAppIds·resolveSearchQueryToAppId lang 파라미터화 / highres 쿼리스트링 안전성 · reviews 보충 로직

### 마이그레이션 (Supabase 적용 필요)

순서:
1. **004_upload_materials_guide.sql** — 단독 실행 (ALTER TYPE ADD VALUE 는 트랜잭션 제약)
2. **005_reference_library_extensions.sql** — 005는 idempotent (DO 블록)

## 다음 세션 우선순위

### 1. 마이그레이션 적용 (Supabase Dashboard)
- 004 단독 실행 후 005 실행
- `deliverable_type` enum 에 `upload_materials_guide` 추가 확인
- `reference_games.country` 필드, 복합 UNIQUE 확인

### 2. Reference Library 분석 모듈 확장 (신규 설계)
Stage 8 `competitive_insight` 축을 재활용·확장하는 3단 분석 구조:

**Level 1 — slot-level (기존 analyze.ts 보강)**
- 현재 디자인 토큰 추출에 감정·전략·타겟 욕구 축 추가
- `emotional_signal`, `user_desire_addressed`, `strategic_intent`, `market_universal_appeal`

**Level 2 — game-level (신규, 핵심)**
- `analyze-game.ts` 신규 — 슬롯 분석 + 제목 + 설명문 + 아이콘 + 리뷰 + 수익모델 종합
- Stage 8 `competitive_insight.competitors_analyzed[]` 의 10개 축을 "이 게임 단위" 로 심화
- `reference_games.aso_analysis` JSONB 에 저장
- Sonnet 4.6 (~$0.10/게임)

**Level 3 — icon/text/video 개별 분석**
- `analyze-icon.ts` — 아이콘 Vision
- `analyze-text.ts` — 제목·서브·설명 ASO 기법 추출 (텍스트만)
- `analyze-video.ts` — 홍보 영상 썸네일 Vision (선택)

장르당 비용 (Top 10, country=kr): ~$3
- 슬롯 70장 × $0.022 = $1.5
- 게임 종합 10 × $0.10 = $1.0
- 아이콘 10 × $0.02 = $0.2
- 텍스트 10 × $0.01 = $0.1
- 합계 ~$2.8

### 3. 퍼즐 kr Top 10 구축 (검증용 첫 장르)
```bash
# 1) 기존 퍼즐 3개 드롭 + Top 10 재수집 (고해상도)
# 엔드포인트 or 스크립트 — collect.recollectGenreFromScratch('puzzle', 10, 'kr')

# 2) 스크린샷 + 종합 분석
curl "http://localhost:3000/api/dev/reference-library/analyze?genre=puzzle&country=kr"
# + game-level, icon, text, video 분석 트리거 신규
```

### 4. 품질 수동 검증
- 3~5개 Top 게임의 game-level 분석 JSON 열어서 "왜 매력적인가" 서술이 실제 통찰 있는지
- 한국 시장 특성 반영이 정확한지

### 5. 루노소프트 장르 확장 (통과 시)
- 캐주얼, RPG, 카드 3장르 Top 10 수집·분석 (~$9 추가)
- 루노소프트 6개 게임 중 1개로 end-to-end 테스트
  - 브레드틀린그림찾기(캐주얼/퍼즐) 권장
  - `/api/dev/generate-screenshots?orderId=...`

### 6. 주문 파이프라인 Library 기반 전환
- Stage 8 을 Library 조회 기반으로 전환 ($1.77 → $0.30~0.50)
- Vision 재호출 제거

### 7. 장르 플레이북 합성 (후속)
- `genre_playbooks` 합성 모듈 — 10개 game-level 을 Opus 가 종합
- 장르의 must-have / avoid / aspirational 기준

## 재개 시 첫 명령 예시

```
"다음 세션 재개한다. docs/11-next-session-resume.md 확인했어.
마이그레이션 004/005 Supabase 에 적용됐나 확인하고,
Library 분석 모듈 확장부터 시작하자."
```

또는:

```
"퍼즐 kr Top 10 수집·분석부터 돌려보자."
```

## 과거 폐기된 아이디어 (재현 금지)

- ❌ 고정 템플릿 4개로 스크린샷 만들기 (Hero/Feature/Showcase/Callout)
- ❌ AI가 전체 1080×1920 HTML/CSS 생성하기 (게임 이미지를 박스에 넣는 방식)
- ❌ 업로드 자료를 무조건 사용하려 하기
- ❌ 매 주문마다 경쟁작 Vision 재분석 (너무 비쌈)
- ❌ Library 가 비어있을 때 장르 Top 3 자동 수집 (엄선 원칙 위반)
- ❌ 마케팅 메시지·결과물에 "AI" 언급
- ❌ "국내 200+ 매체 배포" 같은 과장 표현
- ❌ 번역 Tier 2 언어 지원 시도 (편집장 검수 불가)
- ❌ composite 에서 배경 이미지 크롭·리사이즈 (원본 보존 위반, judge 에서 사전 차단)
- ❌ 정무식/임재청을 ASO 실무 전문가로 포지셔닝 (서비스 주체·공신력이 역할)

## 글로벌 ASO 서비스 프레임

이 서비스는 **ASO + 보도자료 작성·배포 + 번역 3축**. Phase 1 은 ASO 우선.

- **타겟 시장**: 한국이 기본. 의뢰의 `target_market` 에 따라 일본·미국·중국·대만 등 확장.
- **스토어**: Google Play + Apple App Store. 필드 차이 엄수 (principles.ts 참조).
- **Reference Library**: 장르 × 국가 복합 차원. 의뢰 처리 전에 구축되어 있어야 함.
- **분석 엔진은 경쟁작 데이터·리뷰·수익모델을 종합해 '왜 Top인가'의 증거 체계를 만든다.**

## 마이그레이션 실행 명령 (참고)

Supabase Dashboard → SQL Editor 에서:

```sql
-- 1. 004 먼저 단독 실행 (새 enum 값 추가)
-- /website/supabase/migrations/004_upload_materials_guide.sql 파일 내용 실행

-- 2. 005 실행 (country 필드 + 확장 컬럼)
-- /website/supabase/migrations/005_reference_library_extensions.sql 파일 내용 실행
```
