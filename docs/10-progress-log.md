# 진행 로그 (Progress Log)

이 문서는 실제 개발 진행 상황과 주요 결정 사항을 시간순으로 기록합니다.
기획 문서(01~08)와 별개로 "무엇이 언제 완료되었는지" 추적합니다.

---

## 2026-04-12 (Day 1)

### 브랜드/법인 확정
- **서비스 브랜드**: blockbusterlab (주식회사 블록버스터랩)
- **포지셔닝**: 인디게임닷컴 공식 파트너
- **도메인**: blockbusterlab.com (GoDaddy 등록 완료, Vercel 연결 대기)
- **이메일**: bbl@blockbusterlab.com

### 인프라 구축
| 항목 | 계정 | 상태 |
|------|------|------|
| Supabase | 블록버스터랩 (bbl@blockbusterlab.com) | blockbusterlab-aso 프로젝트 생성 (Seoul 리전) |
| Vercel | 개인 (austinpw-cloud) | indiegame 프로젝트 유지 (Transfer는 추후) |
| GitHub | 개인 | 코드 저장소 (Transfer는 추후) |
| Anthropic | - | API 키 미발급 (필요 시) |
| Resend | - | 미가입 (Phase 2에서 가입) |

**결정**: 전체 계정 이전은 유료 고객 확보 시점까지 보류. Claude Code는 파일/env 기반이라 계정 혼동 없음.

### DB 스키마 구축
- 7개 테이블 생성 (`customers`, `admin_users`, `orders`, `order_files`, `deliverables`, `revision_requests`, `aso_benchmarks`)
- Enum 4개 (`order_status`, `service_type`, `file_category`, `deliverable_type`)
- RLS 정책 설정 (고객은 본인 데이터만, 관리자는 전체)
- 트리거 (주문번호 자동 생성 `BBL-YYYYMMDD-NNNN`, 납기일 자동 +5일, updated_at 자동 갱신)
- Storage 버킷 2개 (`order-materials`, `deliverables`, 모두 private)

마이그레이션 파일: `website/supabase/migrations/001_initial_schema.sql`

### 코드베이스 — Phase 1 ASO 서비스 MVP 구현 완료

**모듈 구조 (per CLAUDE.md rule #2)**:

```
src/
├── lib/
│   ├── supabase/       # 클라이언트/서버/관리자 3분리
│   ├── aso/            # constants, schema, orders 비즈니스 로직
│   └── scraper/        # Google Play 스크래퍼 + 이미지 수집
│
├── components/
│   ├── ui/             # 재사용 컴포넌트 (FormField, TextInput, TextArea,
│   │                   #  Select, TagSelector, FileDropzone)
│   └── apply/          # 신청 폼 섹션 컴포넌트 (6개)
│
└── app/
    ├── apply/          # ASO 전용 신청 폼 (전면 재설계)
    ├── apply/submitted/[orderNumber]/   # 접수 완료 페이지
    ├── api/orders/     # 주문 접수 POST 엔드포인트
    ├── api/admin/      # 관리자 임시 엔드포인트 (인증 추후)
    ├── api/health/     # 헬스 체크
    ├── services/       # 서비스 소개 (ASO 활성, 나머지 "준비 중")
    ├── pricing/        # Phase 1 가격 (스타트 20만원)
    └── portfolio/      # "준비 중" + Founding Partner 모집 안내
```

### 주요 기능 구현

**고객용 (공개 접근)**
- `/apply` — ASO 서비스 신청 폼 (6개 섹션, 파일 업로드 지원)
- `/apply/submitted/[orderNumber]` — 주문번호 + 다음 단계 안내

**주문 접수 파이프라인**
- `POST /api/orders` — multipart/form-data 받아 주문 생성
- Zod 스키마 검증 → 고객 upsert → 주문 생성 → 파일 저장
- **Google Play URL만 입력 시 자동 수집** (google-play-scraper)
  - 제목/개발사/장르/평점/설명/스크린샷/아이콘 자동 추출
  - 외부 이미지 다운로드 → Supabase Storage 업로드
  - 파일 없이도 주문 완성 가능
- 오류 시 주문 rollback (DB)

**관리자용 (임시, 인증 없음)**
- `GET /api/admin/orders` — 전체 주문 목록
- `GET /api/admin/orders/[orderId]/files` — 주문별 파일 + Signed URL

### 웹사이트 콘텐츠 정직화
- 가짜 통계 제거 (200+ 매체, 25+ 언어 등 → 실제 수치로)
- 가짜 고객사 로고 / 가짜 후기 제거
- "전문가 경력 20년+, 매체 100+, 지원 언어 10개, 납기 5영업일"로 교체
- "Why blockbusterlab" 섹션 신규 (4가지 차별점)
- "Founding Partner Program" 섹션 신규
- 서비스/가격 페이지: ASO NOW + 보도자료/번역 "준비 중" 표시

### Vercel 배포
- 환경변수 등록 (Production + Development)
- `indiegame-opal.vercel.app` 도메인 유지
- 여러 차례 배포 성공

### End-to-End 테스트 결과
- ✅ 수동 파일 업로드 주문: `BBL-20260412-0001`
- ✅ 루노소프트 32용사키우기 URL 자동 수집: `BBL-20260412-0002` (스크린샷 24장 + 아이콘)
- ✅ 운영 환경 브레드틀린그림찾기 URL: `BBL-20260412-0003` (24 + 1)

### 참고 문서 반영
- ASO 벤치마크 데이터 (`ASO-bible-by-genre-2026.md`) — DB `aso_benchmarks` 테이블에 import 예정
- 매체 데이터베이스 (`docs/06-media-database.md`) — Phase 2 배포 시 활용 예정

---

## 다음 세션 예정 작업

우선순위:
1. **관리자 백오피스 UI** (`/admin`) + 인증
2. **이메일 알림** (Resend 연동) — 접수 확인 + 담당자 알림
3. **AI 분석 엔진** (Anthropic API) — ASO 텍스트/스크린샷 자동 생성

추가 검토 필요:
- 스크린샷 파이프라인 (HTML 템플릿 + Puppeteer 렌더링)
- 결과물 전달 플로우 (압축 패키지 다운로드)
- 고객 대시보드 (`/dashboard`)
- blockbusterlab.com 도메인 Vercel 연결

---

## 알려진 제약 및 향후 개선

| 제약 | 영향 | 개선 계획 |
|------|------|---------|
| Vercel Hobby 4.5MB 업로드 한도 | 대용량 파일 업로드 불가 | 직접-to-Storage 업로드로 전환 |
| 관리자 API 인증 없음 | URL 노출 시 모든 주문 조회 가능 | Phase 1 완료 전 인증 추가 필수 |
| 로컬/운영 동일 Supabase 사용 | 테스트/실제 데이터 섞임 | 유료 고객 시점에 분리 |
| Anthropic API 미연동 | AI 분석 생성 불가 | 관리자 백오피스 완료 후 연동 |

---

## 2026-04-12 (Day 2)

### Stage 6 관리자 백오피스 완성 (배포됨)
- `/admin/login` Supabase Auth 매직 링크
- `/admin` 주문 목록
- `/admin/orders/[id]` 상세 페이지 (자료 미리보기, 상태/결제 변경)
- admin_users 테이블 + Route Group 인증 구조
- 기존 임시 `/api/admin/*` 엔드포인트에 인증 추가
- 운영 배포 및 동작 확인

### Stage 8 AI 분석 엔진 (v1 완성 → v2 품질 업그레이드)

**v1 초기 구현**:
- Claude Opus 4.6 + 장르별 벤치마크 (하드코딩) + 업로드 이미지 Vision
- 6분 소요, $0.63/건
- 결과: 괜찮지만 일반론적

**v2 품질 업그레이드**:
- 경쟁작 실시간 스크래핑 + Vision 주입
- 깊은 추론 프롬프트 (Phase 1-6 자기검증)
- 스트리밍 API 적용 (10분+ 응답 지원)
- max_tokens 32K로 확장
- **결과**: 32용사키우기 분석에서 반전 인사이트 5개 도출
  - "Google Play 장르가 시뮬레이션으로 잘못 등록됨" (치명적 실수 발견)
  - "스크린샷 8·9 합동전투 장면이 뒤로 매몰됨"
  - "레트로 RPG 서브타이틀이 오히려 독"
  - "곽철용 밈 파워 미활용"
  - "아이콘이 단일 캐릭터 관습 따르는데 이 게임은 32명 차별점"
- 실제 경쟁작명 인용 (애니멀 버스터즈, 드래곤네스트 월드, 황제의 검)
- 비용: $1.77/건 / 시간: 6분 6초
- **⚠️ Vercel Hobby 300초 한도 초과 — 로컬에서만 실행 가능**

### Stage 9 스크린샷 생성 (2번의 실패 → 재설계 필요)

**v1 고정 템플릿 (실패)**:
- Hero/Feature/Showcase/Callout 4개 템플릿 제작
- AI 분석 결과 데이터만 주입
- 결과: 천편일률, 박스에 글자 넣은 아마추어 수준 (5/10)

**v2 AI 전체 생성 (실패, 근본 방향 틀림)**:
- AI가 Vision으로 경쟁작 보고 전체 HTML/CSS 생성
- Puppeteer로 1080×1920 렌더링
- 결과: 장식 개선됐으나 7/10, 여전히 Top 게임 수준 아님
- **근본 문제**: AI가 "이미지를 그리는" 방식 자체가 틀림
  - 게임 스크린샷을 박스에 넣고 캔버스 전체를 새로 디자인
  - 게임 그래픽 왜곡 발생
  - 저해상도 이미지가 더 나빠 보임

**근본 재설계 결정 (사용자 지적 후)**:
- 스크린샷은 게임 플레이 캡처임 (개발자가 업로드)
- 우리가 하는 일: 게임 스크린샷 + 선택적 오버레이
- 오버레이만 디자인, 게임 이미지는 1080×1920 전체 배경
- 자료 평가 → 가이드 OR 제작 분기 워크플로우 필요

### 이미지 해상도 이슈 (미해결)
- Google Play CDN URL에 해상도 파라미터 없어 저해상도 수집
- 업로드된 스크린샷이 실제 스토어보다 뭉개짐 (BBL-20260412-0002 확인)
- 수정 필요: URL에 `=w2400-h4267` 리사이즈 파라미터 추가

---

## 2026-04-13 (Day 3) — 오전 세션: Reference Library 1차 설계

> 같은 날(04-13) 작업이 두 세션으로 이어짐. Day 3 = 오전 설계·수집 테스트, Day 4 = 오후 전면 재설계.

### Reference Library 아키텍처 확정

**문제 인식**:
- 매 주문마다 경쟁작 Vision 재분석은 비효율 ($2-3/건)
- 같은 Top 게임을 100번째 주문에서도 반복 분석

**설계**:
- 사전 1회 Top 게임 심층 분석 → Reference Library
- 주문 처리 시 라이브러리 조회만 (비용 10배 절감)
- 의뢰 게임 특수성 있으면 추가 분석 → 라이브러리 확장

### Reference Library 구축 (부분 완성)

**DB 스키마 (마이그레이션 003)**:
- reference_games (메타)
- reference_screenshots (Vision 분석 JSON)
- genre_playbooks (장르별 합성)
- Storage: `reference-library` 버킷

**수집/분석 모듈**:
- `collect.ts` — 장르별 Top N 게임 + 스크린샷 다운로드
- `analyze.ts` — Sonnet 4.6 Vision 분석
- `analyze-prompt.ts` — 구조화된 디자인 토큰 추출 프롬프트
- 개발 테스트 엔드포인트 2개

**실행 결과 (샘플 테스트)**:
- 퍼즐 Top 3 수집: 33장 다운로드 성공 (Royal Kingdom, Tile King, 1개 더)
- Vision 분석 10장: 품질 검증 완료 ($0.22)
- Royal Kingdom 카피 텍스트 정확 추출 ("왕을 도우세요!" 등)
- 레이아웃/색상/효과 구분 정확
- 예상 비용 재계산: $14 전체 (Sonnet 기준, 예상 $30의 절반)

### 서비스 워크플로우 재정의 (사용자 설계)

**워크플로우**:
```
1차 업로드 → 평가 → 분기
  ├─ 자료 부족 → 가이드 문서 (재업로드 요청)
  └─ 자료 충분 → 슬롯별 소스 선택 + 오버레이 디자인 + 제작
```

이것이 실제 ASO 서비스의 올바른 구조. 
업로드 평가 모듈이 서비스의 핵심 가치.

### 주요 학습

1. **스크린샷 아키텍처 원칙** — 게임 캡처는 그대로, 오버레이만 디자인
2. **ASO 문서가 Source of Truth** — ASO-bible-by-genre-2026.md + ASO-optimization-guide-2026.md가 설계 기준
3. **서비스 워크플로우** — 평가 후 분기, 무조건 제작 금지
4. **Reference Library 증분 성장** — 특수 게임마다 라이브러리 확장

### 다음 세션 작업 (우선순위)

세부 내용은 `docs/11-next-session-resume.md` 참조:

1. 이미지 해상도 수정 (URL 파라미터)
2. Stage 9 재설계 (평가 → 분기 → 오버레이 composite)
3. Reference Library 완성 ($14 크레딧 충전 필요)
4. 주문 파이프라인 라이브러리 기반으로 전환
5. 루노소프트 실제 테스트

### 현재 잔액/비용 현황
- Anthropic 크레딧: ~$3.91 남음 (시작 $4.13, 사용 $0.22)
- Supabase Storage: 약 150-200 MB 사용 중 (1GB 한도)
- Vercel: Hobby 플랜 유지
- 오늘까지 총 AI 분석 비용: 약 $3 (여러 번 테스트 포함)

---

## 2026-04-14 (Day 5) — 문서 정리 + Stage 8 리뷰·평점 의존 제거

### 문서 정합성 정리 (1~6단계)
- `markets.md` Google Play 제목 50자 → 30자 (공식 한도 기준 오류 수정)
- `10-progress-log` Day 순서 오류 (Day 3 뒤 Day 2) → Day 4로 교정, 세션 부제 추가
- `12-library-analysis-design` 100개 표현 전수 → 50개 통일, `reviews_summary`·`community_signals`·"리뷰 요약" v2.6 원칙 잔재 제거 (4곳)
- `02`·`05`·`11`·`09` 수치 통일 (타겟 50 / 실측 45, case_study 5 공석)
- `09` 상단 요약표 001 migration 실제 테이블 목록과 일치 (aso_benchmarks 추가)
- `PROTOTYPE.md` 상단에 historical 경고 블록 추가
- `07-aso-service-spec.md` 재구성: §0 라벨링 규약([현재]/[런칭 목표]/[장기]), §4 서비스 플로우 태깅, §5 composite 재설계 반영 (Puppeteer 템플릿 흐름 폐기)
- 루트 `README.md` 전면 재작성 (프로젝트 개요 + 진입점)
- `12`의 "관찰층 raw 분석"에서 리뷰 삭제, 153 "사회적 증거"를 "스토어 에셋 내" 로 명확화

### Stage 8 리뷰·평점 의존 전면 제거 (코드)

Codex 2차 검증에서 발견: 문서는 "평점·리뷰는 ASO 분석 대상 아님" 원칙을 명시했는데, Stage 8 v2.1 코드(2026-04-12 Day 2에 구축)는 여전히 리뷰·평점을 프롬프트에 먹이고 있었음. **전략 오염** — ASO 서비스를 "게임 품질·운영 평가" 쪽으로 끌고 가는 원인.

수정:
- `aso-analyzer.ts`: 본 게임·경쟁작 스크랩에서 `includeReviews: true` 제거 (2곳). `AsoResult.competitors_analyzed` 타입에서 `why_they_top`·`community_signals`·`praise_themes`·`complaint_themes` 제거 → `aso_success_approach`·`monetization_alignment` ASO 수법 축으로 대체
- `aso-generation.ts`: 입력 스키마에서 `scraped_rating`·`scraped_reviews` 제거, 시스템 프롬프트에 "ASO 는 게임을 부각하는 기술, 리뷰·평점 테마는 분석 대상 아님" 원칙 명시, 본 게임·경쟁작 프롬프트에서 리뷰 블록·평점 라인·장르 평균 평점 제거, 출력 스키마에서 리뷰 관련 필드 제거
- `google-play.ts`·`competitor-fetch.ts`: `includeReviews` 기본값 `true` → `false` (필요 시 opt-in)

검증: `tsc --noEmit` 통과. 실제 Stage 8 실행 검증은 다음 세션 L1~L3 실행 시 함께.

### Codex 전략 피드백 대응 — A등급 가드 2개

Codex 3차 검토 결과. **서비스 설계 리스크**로 지적된 항목 중 즉시 차단 가능한 2개 적용:

**A-1. L3 최소 표본 가드** (`synthesize-patterns.ts` · `synthesize-patterns-prompt.ts`)
- 기존: `n≥2` low confidence 에서도 `decision_rules`·`anti_patterns_observed`·`edge_cases_and_exceptions`·`cross_axis_interactions` 생성
- 위험: 2~3개 샘플로 "규칙" 을 만드는 건 예외의 일반화
- 수정: `allow_rules = n≥4` 플래그를 프롬프트에 주입 + 파싱 후 안전망으로 `n<4` 시 규칙 4필드 강제 `[]`. 관찰 요약(icon·title·screenshots·description 등)은 그대로 저장

**A-2. Library 자동 확장 DB 저장 차단** (`library-coverage.ts`)
- 기존: Opus 판단 → `collectSpecificGames` + `analyzeUnanalyzedScreenshots` 자동 실행 → 영구 저장
- 위험: 관리자 승인 게이트가 설계만 있고 구현 안 됨. Opus 오판정이 Library 에 영구 귀속되면 편향 축적
- 수정: `LIBRARY_AUTO_EXPANSION_ENABLED = false` 하드 가드. 후보만 로그·반환(`status: "pending_approval"`), 실제 수집·분석·저장 스킵. 승인 UI 구현 시 플래그 토글

`augmentation` 타입에 `status: "applied" | "pending_approval" | "skipped_no_targets"` 추가.

### Codex 피드백 중 중기·장기 과제 (일부 처리)

- **B-1. Library-first 주문 생성기 통합** ✅ **이번 세션 처리** (아래 참조)
- **B-2. Opus 프롬프트 분할** — 한 번에 전 결과물 요구 구조. 비용·품질 트레이드오프 논의 필요
- **C-1~C-4** — 실측 루프 · 키워드 수요 데이터 · 휴먼 QA · Apple App Store. Phase 1.5+

### B-1. Library-first 주문 생성기 통합 (서비스의 해자 복원)

**확정된 설계 철학** (사용자 명시):
- **Library 는 항상 존재하는 종합 ASO 기준 축**. 초기 구축된 `reference_games` 전체가 Library 그 자체.
- **의뢰 게임과 1:1 매칭되는 Library 게임은 원래부터 없음** — Library 는 합성된 기준이지 유사 게임 검색기가 아님.
- Library 게임 수 ↑ = 기준 품질 ↑.
- **Library 만으로 부족하다 판단될 때 추가 수집·분석** → 가이드 품질 향상 + Library 영구 누적 (= `library-coverage.ts` 담당. 현재 A-2 가드로 자동 DB 저장만 차단).

**신규 `pattern-query.ts`** (`/lib/reference-library/`)
- 주축 조회: `library_patterns` 축 조합 fallback. `fallback_level` 로 매칭 세밀도 표시 (`specific_4axis` → `genre_market_monetization` → `genre_market` → `genre_only` → `none`). 무매칭이 아닌 매칭 세밀도.
- 보조 조회: 같은 genre 의 L2 완료 `reference_games` 중 target_market 겹치는 것 우선 3개. aso_analysis 핵심 필드만 추출 (positioning·aso_success_approach·core_hook·emotional_appeal·reusable_aso_techniques·indie_applicability·monetization_alignment).
- 폴백 체인 로그 반환 (디버깅).

**`aso-analyzer.ts` 통합**
- scraper 후 Library 조회 단계 삽입. `AsoGenerationInput.library` 로 전달.
- Library 주축 있으면 실시간 경쟁작 수 5→3 축소 (Library=장르 기준 · 경쟁작=현재 시장 옆자리 역할 구분).
- `fallback_level === "none"` (장르 `library_patterns` 0건 극단 상태) 시 경고 로그. 정상 운영에서 발생해선 안 됨.

**`aso-generation.ts` 프롬프트 확장**
- 시스템 프롬프트에 **"Library 는 항상 존재 / 1:1 매칭이 아닌 종합 기준 / fallback_level 은 매칭 세밀도일 뿐"** 명시.
- 우선순위: **Library 주축 > 유사 게임 > 경쟁작 > 장르 벤치마크**.
- `fallback_level` 은 내부 메타 — 결과물 문구에 노출 금지.
- `buildLibrarySection()` 신규: primary_pattern JSON + similar_games 의 aso_core 렌더.
- 장르 벤치마크 블록 헤더를 "최하위 우선순위" 로 재라벨링.

**실행 검증**: `tsc --noEmit` 통과. 실제 동작은 L1~L3 실행으로 `library_patterns` 가 채워진 후 검증 가능.

**다음 우선순위**: L1~L3 파이프라인 실행 (`analyze?levels=1,2,3`, ~$37~47) → `library_patterns` 실측 데이터 구축 → B-1 통합 실동작 검증.

> 구현 과정 메모: 초기 구현에서 `library_state: "empty"|"partial"|"full"` 3단계 프레이밍을 시도했으나 사용자 지적으로 교정. "Library 없을 때" 개념 자체가 틀림 — Library 는 항상 존재한다는 전제로 일관. Git 히스토리에 과도기 흔적.

### ChatGPT 3차 검증 대응 — 잔여 정합성 충돌 제거

ChatGPT 검토에서 B-1 완료 후 남은 5개 충돌 지적:
1. `07-aso-service-spec.md:19` "Library→Stage 8 통합" 이 미구현 목록에 포함된 상태. → "코드 완료, 실동작 검증만 남음" 으로 문구 교체
2. `05-roadmap.md:54` Step 2 제목이 완료 여부 불명확. → "코드 완료 (2026-04-14), 실동작 검증은 Step 1 L1~L3 실행 후" 로 명확화
3. `11-next-session-resume.md:146` 재개 예시가 "curate execute 실행하자" 로 끝나 Step 1 (L1~L3 실행) 과 불일치. → 재개 예시 2개 다 L1~L3 실행 지시로 교체
4. `12-library-analysis-design.md` `selection_basis` 철학 모순: 본문 v2.5 changelog 에 "수상작 카테고리 전면 제거" 명시인데 L79·91 에 `editor_choice`·`award` 잔존. **코드까지 일괄 정리**:
   - `tag-game.ts` `SelectionBasis` 타입에서 `editor_choice`·`award` 제거
   - `curate.ts` 3곳의 카운터 객체에서 제거 (dead code)
   - `12` L79·91 에 철학 명시 + "v2.5 이후 폐기" 주석
   - 온디맨드 확장 기준 (§6.3 트리거, §E "commission_driven 편향") 의 "수상" 언급을 "ASO 관점 참고 가치" 로 교체 (스토어 에셋 내 수상 언급 ≠ 큐레이션 기준으로서의 수상)
5. `02`·`05`·`11` 헤더 "최종 업데이트: 2026-04-13" 가 본문(04-14 반영) 과 불일치. → 세 파일 모두 04-14 로 갱신 + 변경 내용 한 줄 요약

**검증**: `tsc --noEmit` 통과. ChatGPT 지적 5건 모두 처리 완료.

### ChatGPT 4차 검증 대응 — 잔여 표기 불일치 제거

1. `02-current-state.md` 내부 Stage 8 상태 자기모순 (L9 "Stage 8 Library 통합 남음" vs L77 "코드 완료"). → L9·L173 을 "코드 완료 + 실동작 검증은 L1~L3 후" 로 통일
2. 재개·현재상태·로드맵 3 문서 간 Stage 8 버전 표기 불일치 (`11` v2.1 · `02` v2.2). → `11`·`05` 모두 v2.2 로 갱신 (Library 주축·유사 게임·리뷰 제거 반영 반영)
3. `07:4` 헤더 "2026-04-13 갱신" 문구가 본문 04-14 변경과 불일치. → "2026-04-14 갱신" 으로 교체 + 변경 내용 요약
4. `docs/README.md:22` Library 분석 설계 버전이 v2.6 으로 고정. → v2.7 로 갱신 (설계 문서와 동기화)
5. `07:30` "한국어 기반 ASO 서비스 사실상 유일" 단정을 근거 없이 쓰던 것을 완화 — 구체 비교 대상(Appfigures·Apptweak·Phiture 등)·차별화 축 명시 + "시장 조사 근거는 별도 검증 필요" 주석

**검증**: `tsc --noEmit` 통과. ChatGPT 4차 지적 5건 모두 처리 완료.

### ChatGPT 5차 검증 대응 — 잔여 표기 불일치 제거

1. `02:67` · `05:33` · `11:24` 에서 Library 설계 문서 참조가 v2.6 으로 고정. → `02`·`05` 는 v2.7 로 교체, `11` 은 역사 맥락 살려 "04-13 당시 v2.6, 현재 v2.7" 로 병기
2. `02:168` "요약 (2026-04-13 기준)" 이 본문 04-14 기준 항목들과 어긋남. → "2026-04-14 기준" 으로 교체

**검증**: `tsc --noEmit` 통과. 설계 문서 버전 참조 전 문서 동기화 완료.

### 코드 전반 점검 1단계 — 보안·정적 검증 복구 (S1·S2·S3)

ChatGPT·Explore 에이전트 교차 검토 결과 중 **보안·lint 관련 즉시 처리 필요 항목** 3건 처리:

**S1 · 오픈 리다이렉트 취약점 차단** (`app/api/admin/auth/callback/route.ts`)
- 기존: `next` 쿼리 값을 그대로 `new URL(nextPath, req.url)` 에 주입 → 외부 절대 URL·protocol-relative URL 리다이렉트 가능
- 수정: `isSafeAdminPath()` 검증 — `/` 시작 + `//` 차단 + `/\\` 차단 + **admin 영역 경로만 허용** (`/admin`·`/admin/...`·`/admin?...`). 나머지는 기본값 `/admin` 으로 강제

**S2 · 주문 입력 검증 강화** (`lib/aso/schema.ts` · `app/api/orders/route.ts`)
- `store_url_android` 를 단순 URL 검증에서 **Google Play URL 정규식 검증** 으로 강화 (`^https://play\.google\.com/store/apps/details\?.*id=...`)
- `validateFilesForCategory()` 헬퍼 신규 — 카테고리별 **MIME 화이트리스트** + **최대 개수** 서버 enforce
- 상수 추가: `MAX_LOGO_COUNT = 5` · `MAX_OTHER_COUNT = 10` (기존 `MAX_SCREENSHOT_COUNT = 15` 도 실제 enforce 됨)

**S3 · lint 에러 복구** (`components/ThemeToggle.tsx` · `components/ui/FileDropzone.tsx`)
- ThemeToggle: `useEffect` 내 setState → **lazy initial state** 로 교체 (`getInitialTheme()` 함수 주입). DOM sync 전용 effect 만 유지. Hydration mismatch 는 `suppressHydrationWarning` 로 억제
- FileDropzone: blob URL 프리뷰의 `<img>` 경고는 `eslint-disable-next-line` 주석으로 억제 (`next/image` 는 blob·10x10 썸네일에 최적화 가치 없음)

**검증**: `npm run lint` 통과 (0 error, 0 warning) · `tsc --noEmit` 통과.

### 코드 전반 점검 2단계 — 문서 철학 잔재 정리 (D1·D2·D3·D4·D5)

**D1 · `collect.ts` 리뷰 수집 중단**
- `fetchReviewSamples` import 제거. 2곳의 호출·`reviews_summary`·`reviews_collected_at` insert 필드 전부 삭제
- `extractMonetizationHint` 는 ASO 메시징 해석에 필요해 유지
- DB `reviews_summary` 컬럼은 dead column 상태로 유지 (수집 중단만). 정식 drop 은 후속 migration 007 에서

**D2 · 운영 메타 vs ASO 판단 입력 경계 분리**
- `scraper/google-play.ts` `GooglePlayAppInfo` 타입의 `rating`·`ratings_count`·`reviews` 필드에 **⚠ ASO 분석 입력 금지** JSDoc 경고 추가 (운영 메타·관리자 UI 용도만 명시)
- `lib/aso/orders.ts` 의 `additional_notes` 생성에서 평점 라인 제거. additional_notes 는 Stage 8 프롬프트로 흘러가므로 리뷰·평점 누출 차단

**D3 · `analyze-game.ts` 주석 정리**
- 파일 상단 주석에서 "L1 결과 + 게임 메타 + **리뷰** + 수익모델" → "**리뷰 제거**, 수익모델 힌트만". v2.6 이후 원칙 명시
- 프롬프트 본체는 이미 v2.6 반영 상태 (negative 지시문 유지)

**D4 · `GENRE_BENCHMARKS` 역할 재정의**
- 파일 상단 주석에 **v2.7 우선순위** 명시: Library 주축 > 유사 게임 > 경쟁작 > **이 블록(최하위 폴백)**
- "L1~L3 실행으로 `library_patterns` 가 충분히 채워지면 이 파일 dead code" 언급으로 향후 제거 예고
- 실사용: `aso-analyzer.ts:313` 에서 여전히 호출되지만 프롬프트상 최하위 폴백으로 위치

**D5 · `curate.ts` selection_basis 재검증**
- 타입(`SelectionBasis`) 은 이미 v2.5 유효 5값만 남음 (`editor_choice`·`award` 제거 완료)
- `limits` Record 는 초기 큐레이션 3경로만 (`revenue_top`·`keyword_search`·`case_study`) — 의도대로
- `indie_exemplar`·`commission_driven` 은 온디맨드 확장·예약값이라 `limits` 미포함, `addIfFits` 에서 자동 거부됨 — 정상 동작
- 주석 보강으로 이 의도 명시

**검증**: `npm run lint` 통과 · `tsc --noEmit` 통과.

### 코드 전반 점검 3단계 — Q1 · Q3 (검증 레이어 + 운영 가시성)

**Q1 · Stage 8 Opus 출력 서버 검증 레이어** (신규 `lib/ai/validate-aso-output.ts`)
- 스토어 필드 하드 룰 검증 모듈: 제목 30자 · Apple subtitle 30 · Apple promo 170 · Apple description 4000 · Apple keywords field 100 (+ 콤마 공백 체크) · Google Play short desc 80 · Google Play first 250 · Google Play full 4000
- 키워드 개수 20~30 권장 범위 · 중복 키워드 감지 · 스크린샷 슬롯 5~8 · slot 번호 중복 · ASO 점수 0~100 범위
- `title_candidates` 의 `recommended:true` 정확히 1개여야 함
- 위반은 `error | warning | info` 3단계. **실패해도 저장·반환은 계속** — 운영자가 관리자 UI 에서 violations 확인 후 수동 편집 판단
- `aso-analyzer.ts` 통합: JSON 파싱 직후 `validateAsoOutput()` 호출, violations 를 `deliverables.content._meta.validation` 에 저장 + 로그 출력. `GenerateResult.validation` 필드 추가
- 추가로 `deliverables.content._meta.library_state` (fallback_level · primary_axis_key · similar_games_count) 도 함께 저장 — 관리자 UI 가 어떤 Library 상태로 생성됐는지 추적 가능

**Q3 · Library 실행 상태 가시성 엔드포인트** (신규 `/api/dev/reference-library/status`)
- 한 번 호출로 L1~L3 진행 상황·커버리지 갭·경고 전부 확인
- 응답 구조: `summary` (총계·warnings) · `collected` (장르·국가·장르+시장 breakdown) · `l1_analysis` (icon·text·스크린샷 분석 완료/대기) · `l2_analysis` (aso_analysis 완료 + 장르별) · `l3_patterns` (total · confidence 분포 · rows)
- **커버리지 갭** 탐색: reference_games 가 있지만 library_patterns 는 없는 (genre, market) 조합 표시. `genre-only 폴백 가능` vs `library_patterns 없음` 구분
- 자동 warnings: "reference_games 0건" · "L2 분석 0건" · "library_patterns 0건 (fallback_level=none 발생)" · "커버리지 갭 N 조합"
- prod 에서는 404 (dev 전용)

**검증**: `npm run lint` 통과 (0 error, 0 warning) · `tsc --noEmit` 통과.

### 남은 작업
- ~~**Q2**: 양 스토어 분기 대응~~ ✅ **완료** (아래 섹션)

### 코드 전반 점검 4단계 — Q2 양 스토어 분기 대응

**배경**: 문서 스펙·`AsoResult` 스키마는 이미 Apple/Google 양쪽 결과물(`store_specific.apple_app_store` · `store_specific.google_play`)을 지원. 실제 입력·스크랩 경로가 Android-only 로 고정돼 있어 스토어 불일치 — 이를 정비.

**기술 선택**: `app-store-scraper` npm 패키지 대신 **공식 iTunes Lookup API 직접 호출**. 이유:
- `app-store-scraper` 가 deprecated `request` 에 의존해 critical 취약점 발생 (`form-data`·`qs`·`tough-cookie`)
- iTunes Lookup API (`https://itunes.apple.com/lookup?id=...`) 는 공식·안정적·JSON 응답·추가 의존성 제로

**신규 · 변경**:
1. `lib/scraper/apple-app-store.ts` (신규) — `scrapeAppleAppStore(url, {country})`. iTunes Lookup 기반 메타데이터 + iPhone/iPad 스크린샷 URL 추출. `extractTrackIdFromUrl()` 헬퍼 포함 (국가코드 자동 감지)
2. `lib/aso/schema.ts` — `store_url_apple` 필드 추가. Apple App Store URL 정규식 검증 (`^https://apps\.apple\.com/(?:[a-z]{2}/)?app/(?:[^/]+/)?id\d+`)
3. `supabase/migrations/007_apple_app_store_url.sql` — `orders` 테이블에 `store_url_apple TEXT` 컬럼 추가 + `store_url_android` 에 "Google Play 전용 레거시 네이밍" 주석
4. `lib/aso/orders.ts` — 양 스토어 병렬 스크랩 (`Promise.all`), Google Play / Apple 자동 수집 블록을 각각 `additional_notes` 에 추가, Apple iPhone/iPad 스크린샷도 Storage 저장
5. `api/orders/route.ts` — `store_url_apple` 수신, "둘 중 하나라도 URL 있으면 파일 완화" 조건, 응답에 `scraped_gplay` · `scraped_apple` 분리
6. `ai/aso-analyzer.ts` — `orders` 조회 컬럼에 `store_url_apple` 추가, 양 스토어 병렬 재스크랩, `AsoGenerationInput.apple_scraped` 주입
7. `ai/prompts/aso-generation.ts` — `appleScrapedSection` 신규 (Apple 현재 상태 블록). "두 스토어 필드 구조·카피 관습 다름, `store_specific.*` 를 각 맥락에 맞게 **별도 설계**" 명시 (동일 카피 복붙 금지 규칙)
8. `components/apply/GameInfoSection.tsx` · `app/apply/page.tsx` — Apple URL 입력 필드 + FormState·initialForm·validation 조건 확장

**검증**:
- `tsc --noEmit` 통과
- `npm run lint` 통과 (0 error, 0 warning)
- `npm audit` — 취약점 0
- ⏳ 실동작 검증은 migration 007 DB 적용 후 실제 주문 접수로 확인

**다음 필요 작업 (사용자 측)**: Supabase 에서 `007_apple_app_store_url.sql` 적용 (`orders.store_url_apple` 컬럼 추가). → **2026-04-14 적용 완료** ✅

### Codex 4차 검증 대응 — 운영 화면·카피 정합성 (#1·#2·#3·#4)

Codex 가 지적한 "운영 화면 반영·사용자-facing 약속·카피 정합성" 4건 처리:

**#1 · 이메일 발송 카피 정직화**
- `app/apply/page.tsx` · `app/apply/submitted/[orderNumber]/page.tsx` · `app/pricing/page.tsx` 에서 "이메일로 접수 확인 메일 발송" · "주문 확인 메일에 안내" · "결제 안내를 이메일로" 등 실제 미구현 약속을 **"담당자가 1영업일 내 입력하신 연락처로 직접 연락드립니다"** 로 교체
- Supabase Auth 매직 링크(관리자 로그인) 는 실제 발송 경로라 유지
- Resend 실제 연동은 Stage 7 별도 스프린트로 이관

**#2 · 관리자 UI 에 store_url_apple 반영**
- `api/admin/orders/route.ts` 목록 select 에 `store_url_apple` 추가
- `app/admin/(auth)/orders/[orderId]/page.tsx` 타입·select·렌더에 양 URL 분리 표시 ("Google Play" / "App Store" 라벨)
- iOS 전용 주문이 운영자 화면에서 누락되는 문제 해결

**#3 · services·pricing 카피 Apple 지원 반영**
- `app/services/page.tsx`: "Google Play 스토어 링크만 전달하면" → "Google Play 또는 Apple App Store 링크만... 양 스토어 모두 출시된 경우 각 스토어 필드 구조에 맞춰 별도 설계"
- `app/pricing/page.tsx` FAQ: "스토어에 출시 안 된 게임도 가능한가요?" 에 Apple URL 추가, "iOS ASO는 언제 가능해지나요?" 를 "iOS ASO도 가능한가요?" 로 바꾸고 실제 지원 내용(subtitle 30자·promo text 170자 등) 기술
- 신청 폼과 마케팅 카피 불일치 제거

**#4 · Migration 008 — selection_basis 주석 최신화**
- `migrations/008_selection_basis_comment_update.sql` 신규
- `COMMENT ON COLUMN reference_games.selection_basis` 로 v2.5 이후 유효 5값 명시, `editor_choice`·`award` 제거 이력 기록
- Migration 006 의 SQL 주석은 히스토리라 그대로. 008 이 최신 주석 덮어씀 → 운영자가 DB 주석만 보고 혼선 방지

**검증**: `tsc --noEmit` · `npm run lint` 모두 통과.

**다음 필요 작업 (사용자 측)**: Supabase 에서 `008_selection_basis_comment_update.sql` 적용 (컬럼 주석 덮어쓰기).

### 남은 작업 (순차 진행 예정)

- ~~**D1~D5**: 문서 철학 잔재 정리~~ ✅ **완료** (아래 별도 섹션)
- **Q1**: Opus 출력 서버 검증 레이어 추가 (제목 길이·Apple/Google 필드·키워드 포맷·스크린샷 슬롯)
- **Q2**: 양 스토어 분기 대응 (Android + Apple App Store)
- **Q3**: Library 실행 상태 가시성 로그 강화

---

## 2026-04-13 (Day 4) — 오후 세션: 대규모 재설계

### ASO 지식 체계 구축 (`docs/aso/`)

`ASO-bible-by-genre-2026.md` + `ASO-optimization-guide-2026.md` 검증 → 수치 출처 단일성·IP 의존 편향 등 허점 발견 → 신규 지식 체계로 재정리.

- 4개 연구 에이전트 병렬 조사: Apple 공식 · Google Play 공식 · 업계 벤치마크 · 한·미·일·중 시장 특성 · 수익모델/스튜디오 규모 축
- 결과물:
  - `docs/aso/knowledge.md` (348줄) — 원리·하드룰·공통 원리·축별 변주·의뢰 적용 의사결정
  - `docs/aso/sources.md` — 외부 자료 인덱스
  - `docs/aso/raw-notes/` (5개) — 원자료 추출
  - 기존 ASO 바이블·가이드는 `99-archived/` 이동
- `lib/aso/principles.ts` 재작성 — `knowledge.md` 와 동기화. 신규 `renderIndieApplicabilityRules()`, Tier/상수 재구성

### Reference Library 전면 재설계 (`docs/12-library-analysis-design.md` v2.6)

v1 "장르 × 국가 Top 10 고정" 폐기. 새 프레임:

- **3층 구조**: 관찰(reference_games) · 패턴(library_patterns 집계 필드) · 인사이트(같은 JSONB 의 decision_rules·edge_cases·anti_patterns·cross_axis·commission_derived). 인사이트는 별도 테이블 대신 JSONB 에 내재화.
- **전역 큐레이션 50개** (100개에서 축소): 매출 35 + 검색 10 + 케이스 스터디 5
- **IP·AAA 퍼블리셔 + IP 프랜차이즈 키워드 2단 필터** — 브랜드 파워로 매출 나오는 게임은 ASO 분석 가치 낮으므로 제외
- ASO 기반 성장 퍼블리셔 (Dream Games·Playrix·Voodoo·Century·Magic Tavern) 는 mid 로 재분류 → 수집 대상 포함
- **ASO 의 본질**: 게임성 판단 아닌 부각 기술. L2·L3 에서 리뷰·평점 테마 **완전 제거**
- **온디맨드 확장 4트리거** + 관리자 승인 게이트
- **의뢰 인사이트 누적 루프** — commission_derived_insights 축적 후 L3 재합성 시 정식 규칙 승격

### 마이그레이션 006 적용

- `reference_games`: `selection_basis` · `target_markets[]` · `monetization_model` · `studio_size` · `icon_analysis` · `text_analysis`
- `library_patterns` 테이블 신규: axis_key UNIQUE · patterns JSONB (집계+인사이트) · sample_game_ids · sample_size · confidence · pending_commission_insights
- RLS (003 스타일): 공개 읽기 + 관리자 쓰기

### L1~L3 분석 파이프라인 구현

- **L1**: `analyze-icon.ts`(Sonnet Vision) · `analyze-text.ts`(Sonnet 텍스트) · 기존 `analyze.ts`(슬롯)
- **L2**: `analyze-game.ts` — **Opus 4.6**. 프레이밍 "ASO 를 어떻게 했길래 잘했나". 리뷰 입력·community_signals 출력 제거. 신규 `first_impression_hooks`·`curiosity_triggers`·`download_conviction_mechanics`
- **L3**: `synthesize-patterns.ts` — **Opus 4.6**, Tier A=장르×시장 40조합. 평점·리뷰 관련 완전 제거
- **오케스트레이터**: `orchestrator.ts` (L1 병렬, L2/L3 순차)
- **API 엔드포인트**: `/api/dev/reference-library/analyze?levels=1,2,3` · `synthesize` · `patterns`

### 큐레이션 파이프라인 구현 + 실행

- `curate.ts` + `curated-lists.ts` + `tag-game.ts`
- 3경로 수집 · dedupe · target_markets 병합 · seed rank 정렬 · 장르당 상한 5개
- AAA whitelist 재정의 + IP 프랜차이즈 키워드 필터 + Proxima Beta/Level Infinite 등 서브 브랜드 포함
- dry_run → execute 검증 흐름
- **실제 실행 완료** (2회):
  - 1회차: 44/45 수집 (com.gear2.growslayer GAME_ADVENTURE 장르 매핑 누락으로 1건 실패)
  - GPLAY_CATEGORY_TO_GENRE 에 adventure·board·word 추가
  - 2회차: **45/45 수집 성공, 에러 0**
  - 128개 게임이 IP·AAA 필터로 제외됨 (리니지·Pokemon·Brawl Stars·Genshin 등 정확히 걸러짐)
  - Claude API 비용 $0 (스크래퍼만)
  - 총 소요 시간: 31분 (27분 + 4분)

### 문서 정리 (옵션 B)

- **갱신**: `02-current-state` · `05-roadmap` · `11-next-session-resume` · `docs/README`
- **확장 통합**: `07-aso-service-spec` 이 `08-pre-development-master` 의 핵심 원칙·루노소프트 6개 게임·기술 연결점 흡수
- **재정의**: `03-service-design` 에서 ASO 섹션 제거, Phase 2·3 설계로 한정
- **상단 경고 추가**: `04-technical-architecture` · `09-database-schema` — 초기 기획 기준임을 명시, 최신 Source of Truth 참조 링크
- **아카이브 이동**: `08-pre-development-master` → `docs/archived/`

### 세션 종료 시점 상태

- Library 45개 수집·태깅 완료 (Supabase Storage + reference_games)
- L1~L3 분석 미실행 (다음 세션)
- Stage 8 → Library 통합 미구현 (다음 세션)

### 비용 현황
- 오늘 Claude API 사용: $0 (연구 에이전트 4개는 내장 토큰 — 외부 비용 없음)
- Library 수집 $0
- 다음 세션 L1~L3 실행 시 ~$37~47 예상

### 다음 세션 계획 (우선순위)

`docs/11-next-session-resume.md` 참조. 핵심:
1. `/api/dev/reference-library/analyze?levels=1,2,3` — L1~L3 파이프라인 실행
2. `library_patterns` 조회로 합성 결과 품질 검증
3. Stage 8 → Library 조회 기반 통합 (의뢰당 비용 $1.77 → $0.30~0.50)
4. 온디맨드 확장 UI · 인사이트 누적 루프
5. 루노소프트 end-to-end 검증
