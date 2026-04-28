# 다음 세션 재개 가이드

> **마지막 업데이트**: 2026-04-14 (Stage 8 Library-first 통합 코드 완료 · 리뷰·평점 의존 제거 · A-1/A-2 가드)
> **다음 세션 시작 시 이 문서 먼저 읽을 것**

## 지금 어디까지 왔나

### 정상 동작 중 (건드리지 말 것)
- 고객 신청 폼 `/apply` + Google Play URL 자동 수집
- 관리자 백오피스 `/admin` (매직 링크·주문 관리·상태 전환)
- Vercel 배포 (indiegame-opal.vercel.app)
- Stage 8 ASO 분석 엔진 **v2.2** (Opus + Library 주축·유사 게임 + 경쟁작 실시간 + Vision. Library-first 통합·리뷰 제거 반영)
- Stage 9 스크린샷 제작 (평가 → 가이드/제작 분기 → 오버레이 composite)

### 2026-04-13 세션에서 완료한 것

#### A. ASO 지식 체계 구축 (`docs/aso/`)
- `knowledge.md` — ASO 본체 (원리·하드룰·공통 원리·축별 변주·의뢰 적용 의사결정)
- `sources.md` — 외부 자료 인덱스
- `raw-notes/` — Apple·Google·업계·시장·수익모델 조사 원자료 (5개)
- `99-archived/` — 기존 `ASO-bible-by-genre-2026.md`·`ASO-optimization-guide-2026.md` 이동
- `principles.ts` 재작성 — knowledge.md 와 동기화. 신규: `renderIndieApplicabilityRules()`

#### B. Reference Library 전면 재설계 (`docs/12-library-analysis-design.md` — 04-13 당시 v2.6, 현재 v2.7)
- **3층 구조** 명시: 관찰(reference_games) · 패턴(library_patterns 집계 필드) · 인사이트(library_patterns 동일 JSONB 의 decision_rules·edge_cases·anti_patterns·cross_axis·commission_derived)
- **큐레이션 50개** (100개에서 축소): 매출 35 + 검색 10 + 케이스 스터디 5
- **IP·AAA 퍼블리셔 + IP 프랜차이즈 키워드 2단 필터** — IP 파워로 매출 나오는 게임은 분석 가치 낮으므로 제외
- ASO 기반 성장 퍼블리셔 (Dream Games·Playrix·Voodoo·Century·Magic Tavern 등) 는 mid 로 재분류 → 수집 대상 포함
- **평점·리뷰 분석 대상 아님** — ASO 는 게임성 판단 아닌 부각 기술
- **온디맨드 확장 4트리거** (표본 부족·경쟁작·참고 레퍼런스·시장 확장) + 관리자 승인 게이트
- **의뢰 인사이트 누적 루프** — `commission_derived_insights` 축적 후 L3 재합성 시 정식 규칙 승격

#### C. 마이그레이션 006 적용 완료
- `reference_games`: selection_basis · target_markets[] · monetization_model · studio_size · icon_analysis · text_analysis
- `library_patterns` 테이블: axis_key UNIQUE, genre NOT NULL, market/monetization/studio nullable, patterns JSONB (집계+인사이트), sample_game_ids, sample_size, confidence, pending_commission_insights
- RLS (003 스타일): 공개 읽기 + 관리자 쓰기

#### D. L1~L3 분석 파이프라인 모듈 구현
- **L1**: `analyze-icon.ts`(Sonnet Vision) · `analyze-text.ts`(Sonnet) · 기존 `analyze.ts`(슬롯)
- **L2**: `analyze-game.ts` — **Opus**, 프레이밍 "ASO 를 어떻게 했길래 잘했나" · 리뷰 입력·community_signals 출력 제거 · first_impression_hooks/curiosity_triggers/download_conviction_mechanics 신설
- **L3**: `synthesize-patterns.ts` — **Opus**, Tier A=장르×시장 40조합 · 평점·리뷰 관련 전부 제거
- **오케스트레이터**: `orchestrator.ts` (L1 병렬, L2/L3 순차)
- **엔드포인트**: `/api/dev/reference-library/analyze?levels=1,2,3` · `synthesize` · `patterns`

#### E. 큐레이션 파이프라인 (`curate.ts`)
- 3경로 수집 + dedupe + target_markets 병합 + seed rank 정렬
- 장르당 최대 5개 상한, (국가×장르) GROSSING Top 3 은 seed 로 우선
- `curated-lists.ts`: AAA whitelist 재정의, mid whitelist 확장, IP 프랜차이즈 키워드
- `tag-game.ts`: 자동 태깅 (monetization_model·studio_size·genre·target_markets)
- 엔드포인트: `/api/dev/reference-library/curate?dry_run=true|execute=true`
- **execute 실행 완료 (2회)**: 후보 260 → IP/AAA 필터 제외 128 → 45/45 수집 성공 (Royal Match·Gardenscapes·Toon Blast·Coin Master 등 순수 ASO 성공작 중심). case_study 5 공석

#### F. 문서 정리 (옵션 B 실행)
- 02-current-state · 05-roadmap · 11-next-session-resume · docs/README 갱신
- 07-aso-service-spec 확장 통합 (08 흡수)
- 03-service-design ASO 섹션 제거, Phase 2·3 설계로 재정의
- 08-pre-development-master → `docs/archived/` 이동
- 04-technical-architecture · 09-database-schema 역할 재정의
- (이 세션 종료 후 작업 이어서 진행)

---

## 다음 세션 우선순위

### Step 1 — Library L1~L3 분석 실행 (큐레이션 45개 수집 완료)

**1-1. 큐레이션 execute 완료 상태 ✅**
- 45/45 수집 성공 (case_study 5 공석)
- 각 게임 스크린샷·아이콘 → Supabase Storage + `reference_games` 태깅 저장 완료
- 재수집 필요 시 `/api/dev/reference-library/curate?execute=true` 재실행

**1-2. L1~L3 파이프라인 실행 (~$37~47 Claude API)**
```bash
curl "http://localhost:3000/api/dev/reference-library/analyze?levels=1,2,3"
```
- L1: 아이콘(Sonnet) + 텍스트(Sonnet) + 스크린샷 슬롯(Sonnet) 병렬
- L2: 게임 단위 Opus 합성 (~$0.30~0.50/게임)
- L3: Tier A 40조합 Opus 패턴 합성 (~$0.30/조합)

**1-3. 결과 확인**
```bash
curl "http://localhost:3000/api/dev/reference-library/patterns?genre=puzzle" | jq
```
- `sample_size`·`confidence`·`patterns` 필드 품질 검토
- 표본 부족으로 skip 된 조합 확인

### Step 2 — Stage 8 → Library 통합 ✅ **완료 (2026-04-14)**
- [x] `pattern-query.ts` 신규: axis_key fallback 조회 (specific_4axis → genre_market_monetization → genre_market → genre_only). 주축 + 유사 게임 반환
- [x] 의뢰 처리 Stage 8 에 Library 조회 단계 삽입 (`aso-analyzer.ts`)
- [x] Library 주축 있으면 경쟁작 수 5→3 축소 (중복 완화, Library 는 장르 기준 · 경쟁작은 현재 시장 옆자리 역할 구분)
- [x] `aso-generation.ts` 프롬프트에 Library 섹션 주입, 우선순위 "Library 주축 > 유사 게임 > 경쟁작 > 장르 벤치마크"
- [x] 리뷰·평점 의존 전면 제거 (`includeReviews: false`, why_they_top·community_signals·praise/complaint 삭제)
- **남은 검증**: L1~L3 실행 완료 후 `library_patterns` 실측 데이터로 실동작 확인 (Step 1 완료가 전제)
- 의뢰당 비용 효과 실측은 Step 1 완료 후 측정

**핵심 철학 (Stage 8 통합 후 불변)**
- Library 는 항상 존재 (초기 구축 reference_games = Library 자체)
- 의뢰 게임과 1:1 매칭되는 Library 게임은 원래부터 없음 — Library 전체가 종합 ASO 기준
- fallback_level 은 주축 매칭 세밀도 (무매칭이 아님). 내부 메타라 결과물 문구 노출 금지
- 유사 게임은 보강 참고용, 1:1 모방 금지

### Step 3 — 온디맨드 확장 UI
- `expansion.ts` 신규: 4트리거 감지·후보 탐색
- 관리자 승인 큐 페이지 (`/admin/library/expansion-queue`)
- 승인 시 수집·L1·L2 실행 → `commission_driven` 태깅
- L3 재합성 트리거 (`pending_commission_insights` 5+)

### Step 4 — 의뢰 인사이트 누적 루프
- 의뢰 처리 후 LLM 이 `commission_derived_insights` 추출
- 해당 축 조합 `library_patterns` 에 누적
- 관리자 산출물 품질 평가 UI → `confirmed_by_delivery` 플래그

### Step 5 — 루노소프트 end-to-end 검증

---

## 중요 원칙 (잊지 말 것)

1. **ASO 는 게임성 판단이 아니라 부각 기술** — 평점·리뷰 테마는 분석 대상이 아님
2. **IP·AAA 퍼블리셔 게임은 Library 수집 대상 아님** — IP 파워로 매출 나오므로 ASO 수법 검증 불가
3. **commission_driven 확장은 편향이 아닌 지식 확장** — 원래 상위 큐레이션 품질인데 효율상 초기에 빠진 게임이 대부분
4. **관리자 승인 게이트 필수** — 자동 무한 확장 금지, 비용·품질 보호
5. **Library 3층** — 관찰(reference_games) · 패턴(library_patterns 집계) · 인사이트(같은 JSONB 내재화)
6. **AI·자동·알고리즘 단어는 고객 대면 영역에서 절대 금지**
7. **중국 본토는 별도 트랙** — 판호 요구. 해외판·TapTap 글로벌 중심

---

## 과거 폐기된 아이디어 (재현 금지)

- ❌ 수상작·GOTY·에디터스 초이스 카테고리로 Library 수집 (게임 품질 상이지 ASO 상 아님)
- ❌ 평점·리뷰 테마 기반 필터 / L2·L3 분석
- ❌ IP·AAA 퍼블리셔 게임을 Library 에 포함
- ❌ 장르 × 국가 Top 10 고정 수집 (v1 폐기)
- ❌ `aso_contrarian_signal` 별도 플래그 (하이퍼캐주얼 카테고리로 자연 포괄)
- ❌ 고정 템플릿 스크린샷 / AI 가 이미지 그림 생성
- ❌ 매 의뢰마다 경쟁작 Vision 재호출 (Library 조회로 전환)
- ❌ 번역 Tier 2 언어 지원 (편집장 검수 불가)
- ❌ 고객 대면 문서에 "AI"·"자동"·"알고리즘" 언급

---

## 재개 시 첫 명령 예시

```
"다음 세션 재개한다. docs/11-next-session-resume.md 확인.
Step 1 — L1~L3 파이프라인 실행으로 library_patterns 채우자.
/api/dev/reference-library/analyze?levels=1,2,3 호출."
```

또는:

```
"Library 45개 수집은 이미 완료. 지금은 L1~L3 분석만 돌리면 돼.
analyze?levels=1,2,3 실행하고 library_patterns 조회로 품질 검증까지."
```
