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

## 2026-04-13 (Day 3)

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
