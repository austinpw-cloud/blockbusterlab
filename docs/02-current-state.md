# 현재 상태 분석

> **최종 업데이트**: 2026-04-13

## 라이브 현황

- **Production URL**: https://indiegame-opal.vercel.app
- **도메인 (예정)**: blockbusterlab.com (연결 대기)
- **상태**: Phase 1 MVP (ASO 서비스) 주요 기능 대부분 구현, 스크린샷 생성은 재설계 필요

---

## 기술 스택

| 영역 | 기술 | 상태 |
|------|------|------|
| 프레임워크 | Next.js 16.2.3 | OK |
| UI | React 19 + Tailwind v4 | OK |
| 애니메이션 | Framer Motion | OK |
| DB | Supabase (PostgreSQL) Free | 여유 500MB |
| Storage | Supabase Storage Free | 여유 800MB |
| Auth | Supabase Auth (매직링크) | OK |
| AI | Anthropic Claude API | 크레딧 $3.91 |
| Scraping | google-play-scraper | 해상도 이슈 미해결 |
| Rendering | Puppeteer | 재설계 필요 |
| Validation | Zod v4 | OK |
| 배포 | Vercel Hobby | 300초 한도 문제 |

---

## 페이지 현황

| 경로 | 상태 | 비고 |
|------|------|------|
| `/` | ✅ | 홈, 정직한 정보 |
| `/services` | ✅ | ASO NOW / 나머지 준비 중 |
| `/pricing` | ✅ | Phase 1 가격 |
| `/portfolio` | ✅ | Founding Partner 모집 |
| `/apply` | ✅ | ASO 신청 폼 + Google Play URL 자동 수집 |
| `/apply/submitted/[num]` | ✅ | 완료 페이지 |
| `/admin/login` | ✅ | 매직 링크 |
| `/admin` | ✅ | 주문 목록 |
| `/admin/orders/[id]` | ✅ | 주문 상세 |

---

## API 라우트

| 경로 | 인증 | 상태 |
|------|------|------|
| `/api/health` | - | OK |
| `/api/orders` POST | - | OK (주문 접수) |
| `/api/admin/auth/*` | - | OK (매직 링크) |
| `/api/admin/orders` | 관리자 | OK (목록 조회) |
| `/api/admin/orders/[id]/files` | 관리자 | OK (파일 조회) |
| `/api/dev/generate-screenshots` | 없음 (dev) | ⚠️ 재설계 필요 |
| `/api/dev/reference-library/collect` | 없음 (dev) | OK |
| `/api/dev/reference-library/analyze` | 없음 (dev) | OK |

---

## Stage 구현 현황

### ✅ 완료된 Stage
- Stage 1: 기반 인프라 (Supabase, Vercel, 환경변수)
- Stage 2: 고객 신청 폼 (파일 업로드 + Google Play 자동 수집)
- Stage 3: 주문 접수 API (Zod 검증 + 파일 업로드)
- Stage 4: Google Play 자동 수집 (google-play-scraper)
- Stage 5: 웹사이트 콘텐츠 정직화
- **Stage 6: 관리자 백오피스 (`/admin`) + 인증**
- **Stage 8: AI 분석 엔진 v2 (Opus + 경쟁작 + Vision)**

### 🔄 부분 구축
- **Reference Library**: 퍼즐 Top 3만 수집/10장 분석됨, 나머지 미완
- Stage 9 스크린샷 생성: 2번 시도 모두 실패 → 전면 재설계 필요

### ⏸ 미완
- Stage 7: 이메일 알림 (Resend)
- 고객 대시보드 `/dashboard`
- 결제 시스템

---

## 주요 자산

### 코드 모듈
```
src/lib/
├── supabase/           ✅ 클라이언트 3분리
├── auth/               ✅ 관리자 인증
├── aso/                ✅ 주문 + 분석 v2
│   ├── constants.ts    (장르/타겟/패키지)
│   ├── schema.ts       (Zod)
│   ├── orders.ts       (주문 생성)
│   ├── status.ts       (상태 전환)
│   └── (analyzer, prompts)
├── scraper/            ⚠️ 해상도 이슈
│   ├── google-play.ts
│   ├── competitor-fetch.ts
│   └── image-ingest.ts
├── ai/                 ✅ v2 분석 OK
│   ├── client.ts       (스트리밍 지원)
│   ├── models.ts
│   ├── aso-analyzer.ts
│   ├── prompts/
│   └── benchmarks/
├── reference-library/  🔄 수집/분석 완성, 데이터 부분만
│   ├── collect.ts
│   ├── analyze.ts
│   └── analyze-prompt.ts
└── screenshot/         ⚠️ 전면 재설계 필요
    ├── template.ts     (폐기 예정)
    ├── renderer.ts     (composite로 수정 필요)
    ├── generate.ts     (분기 로직 추가 필요)
    ├── ai-design.ts    (폐기 또는 재작성)
    └── ai-design-prompt.ts (폐기 또는 재작성)
```

### DB 스키마 (deployed)
- 001: orders, customers, deliverables 등 8개 테이블
- 002: admin_users 시드
- 003: reference_games, reference_screenshots, genre_playbooks

### Storage 버킷
- `order-materials` (private) — 고객 업로드
- `deliverables` (private) — 결과물
- `reference-library` (private) — Top 게임 벤치마크 자료

---

## 알려진 제약

| 제약 | 심각도 | 해결 시점 |
|------|-------|---------|
| Vercel Hobby 300초 | 운영에서 AI 분석 타임아웃 | Pro 업글 (첫 고객) |
| Supabase Free 1GB | 여유 800MB, 주문 쌓이면 한계 | Pro 업글 (500건 후) |
| Anthropic 크레딧 부족 | Reference Library 완성하려면 $10+ 필요 | 즉시 충전 필요 |
| Google Play CDN URL 해상도 | 수집 이미지 품질 낮음 | 다음 세션 수정 |
| 스크린샷 생성 아키텍처 | 근본 접근 틀림, 재설계 | 다음 세션 최우선 |

---

## 다음 세션 지침

`docs/11-next-session-resume.md` 참조 (재개 가이드).

요약:
1. 이미지 해상도 수정 (15분)
2. Stage 9 재설계 (평가 → 분기 → composite)
3. Reference Library 완성 ($14 충전 + 1시간)
4. 주문 파이프라인 라이브러리 기반으로 전환
5. 루노소프트 테스트
