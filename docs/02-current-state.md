# 현재 상태 분석

> **최종 업데이트**: 2026-04-14 (Stage 8 Library-first 통합 · 리뷰·평점 의존 제거 · A-1/A-2 가드 반영)

## 라이브 현황

- **Production URL**: https://indiegame-opal.vercel.app
- **도메인 (예정)**: blockbusterlab.com (연결 대기)
- **상태**: Phase 1 MVP 주요 기능 + Stage 8 Library-first 통합 코드 완료. **L1~L3 분석 실행 → Stage 8 실동작 검증 → 루노소프트 end-to-end 검증** 순으로 남음

---

## 기술 스택

| 영역 | 기술 | 상태 |
|------|------|------|
| 프레임워크 | Next.js 16.2.3 (Turbopack) | OK |
| UI | React 19 + Tailwind v4 | OK |
| 애니메이션 | Framer Motion | OK |
| DB | Supabase (PostgreSQL) Free | 여유 |
| Storage | Supabase Storage Free | 여유 (~270MB/1GB) |
| Auth | Supabase Auth (매직링크) | OK |
| AI | Anthropic Claude (Opus 4.6 + Sonnet 4.6 + Haiku 4.5) | OK |
| Scraping (Google Play) | google-play-scraper | 고해상도 이슈 해결 |
| Scraping (Apple App Store) | iTunes Lookup API (fetch 직접) | 2026-04-14 추가, 외부 의존성 없음 |
| Rendering | (폐기) Puppeteer → composite 렌더러 | OK |
| Validation | Zod v4 | OK |
| 배포 | Vercel Hobby | 300초 한도 (Pro 업글 대기) |

---

## 페이지 현황

| 경로 | 상태 | 비고 |
|------|------|------|
| `/` | ✅ | 홈 |
| `/services`, `/pricing`, `/portfolio` | ✅ | ASO NOW / 나머지 준비 중 |
| `/apply` + `/apply/submitted/[num]` | ✅ | 신청 폼 + Google Play URL 자동 수집 |
| `/admin/login` · `/admin` · `/admin/orders/[id]` | ✅ | 매직 링크 + 주문 관리 |

---

## API 라우트

| 경로 | 상태 |
|------|------|
| `/api/health` | OK |
| `/api/orders` POST | OK |
| `/api/admin/auth/*` | OK |
| `/api/admin/orders` · `/api/admin/orders/[id]/files` | OK |
| `/api/dev/generate-screenshots` | OK (Stage 9 재설계 완료) |
| `/api/dev/reference-library/collect` | OK |
| `/api/dev/reference-library/analyze?levels=1,2,3` | OK (L1+L2+L3 파이프라인) |
| `/api/dev/reference-library/synthesize` | OK (L3 단건/Tier A) |
| `/api/dev/reference-library/patterns` | OK (조회 디버그) |
| `/api/dev/reference-library/curate` | OK (타겟 50, 실측 45 큐레이션, dry_run 지원) |

---

## Stage 구현 현황

### ✅ 완료
- Stage 1~5: 기반 인프라 · 신청 폼 · 주문 API · Google Play 수집 · 웹사이트
- **Stage 6**: 관리자 백오피스 + 인증
- **Stage 8**: ASO 분석 엔진 v2.3 (Opus + Library 주축·유사 게임 + Google Play·Apple App Store 양 스토어 실시간 + Vision + 글로벌 프레임 + 축별 변주 + Opus 출력 하드 룰 검증). 리뷰·평점 의존 제거, Library-first 통합, 양 스토어 분기 완료 (2026-04-14)
- **Stage 9**: 스크린샷 제작 (평가 → 분기 → 오버레이 composite 구조 재설계 완료)
- **ASO 지식 체계**: `docs/aso/knowledge.md` + `principles.ts` 동기화
- **Library 3층 구조 설계**: `docs/12-library-analysis-design.md` v2.7
- **마이그레이션 006**: `reference_games` 축 태깅 + `library_patterns` 테이블 적용
- **L1 모듈**: `analyze-icon.ts`·`analyze-text.ts`·기존 `analyze.ts` (슬롯)
- **L2 모듈**: `analyze-game.ts` (Opus, ASO 수법 해석 프레이밍)
- **L3 모듈**: `synthesize-patterns.ts` (Opus, Tier A=장르×시장 40조합)
- **오케스트레이터**: `orchestrator.ts` 및 엔드포인트 3개
- **큐레이션**: `curate.ts` (3경로 · IP/AAA 필터 · 자동 태깅 · dry_run)

### 🔄 부분 구축
- **Reference Library**: 설계·수집·분석 모듈 전부 준비 완료. **큐레이션 execute 실행으로 45개 수집 완료 (타겟 50 중 case_study 5개 비어있음), L1~L3 분석 실행 대기**
- **Stage 8 → Library 통합** ✅ **코드 통합 완료** (`pattern-query.ts` 신규). 실동작 검증은 L1~L3 실행으로 `library_patterns` 채워진 후 가능

### ⏸ 미완
- Stage 7: 이메일 알림 (Resend)
- 고객 대시보드 `/dashboard`
- 결제 시스템
- 의뢰 처리 중 온디맨드 확장 관리자 승인 UI (설계 §6.3, 미구현)

---

## 주요 자산

### 코드 모듈
```
src/lib/
├── supabase/                  ✅
├── auth/                      ✅
├── aso/                       ✅ principles.ts = knowledge.md 동기화
│   ├── constants.ts
│   ├── schema.ts
│   ├── orders.ts
│   ├── status.ts
│   └── principles.ts          ★ 2026-04-13 재작성
├── scraper/                   ✅
│   ├── google-play.ts
│   ├── competitor-fetch.ts
│   ├── image-ingest.ts
│   ├── highres.ts             ★ CDN 고해상도 헬퍼
│   └── reviews.ts
├── ai/                        ✅
│   ├── client.ts
│   ├── models.ts              (Opus/Sonnet/Haiku)
│   ├── aso-analyzer.ts
│   └── prompts/aso-generation.ts
├── reference-library/         ★ 전면 구축 완료 (2026-04-13)
│   ├── collect.ts
│   ├── curate.ts              ★ 타겟 50 / 실측 45 큐레이션 + IP 필터
│   ├── curated-lists.ts       ★ AAA/IP whitelist, 키워드
│   ├── tag-game.ts            ★ 자동 태깅 (수익·규모·장르·시장)
│   ├── analyze.ts             (L1 슬롯)
│   ├── analyze-prompt.ts
│   ├── analyze-icon.ts        ★ (L1 아이콘)
│   ├── analyze-icon-prompt.ts ★
│   ├── analyze-text.ts        ★ (L1 텍스트)
│   ├── analyze-text-prompt.ts ★
│   ├── analyze-game.ts        ★ (L2 Opus)
│   ├── analyze-game-prompt.ts ★
│   ├── synthesize-patterns.ts ★ (L3 Opus, n≥4 규칙 가드)
│   ├── synthesize-patterns-prompt.ts ★
│   ├── pattern-query.ts       ★ 주문 Library 조회 (2026-04-14)
│   └── orchestrator.ts        ★ L1~L3 조정
└── screenshot/                ✅ Stage 9 재설계 완료
    ├── library-coverage.ts
    ├── judge-materials.ts
    ├── upload-guide.ts
    ├── overlay-design.ts
    ├── composite-renderer.ts
    └── generate.ts
```

### DB 스키마 (deployed)
- 001: `orders`·`customers`·`deliverables` 등 8개
- 002: `admin_users` 시드
- 003: `reference_games`·`reference_screenshots`·`genre_playbooks`
- 004: `deliverable_type` enum 확장 (`upload_materials_guide`)
- 005: `reference_games` country 필드·복합 UNIQUE·aso_analysis·reviews_summary·monetization·video_url
- **006**: `reference_games` 축 태깅 (selection_basis·target_markets·monetization_model·studio_size·icon_analysis·text_analysis) + `library_patterns` 테이블

### Storage 버킷
- `order-materials` (private) — 고객 업로드
- `deliverables` (private) — 결과물
- `reference-library` (private) — Library 자산 (아이콘·스크린샷)

---

## 알려진 제약

| 제약 | 심각도 | 해결 시점 |
|------|-------|---------|
| Vercel Hobby 300초 | 운영 타임아웃 위험 | Pro 업글 (첫 고객) |
| Supabase Free 1GB | 여유 ~730MB. Library 200+ 확장 시 한계 | Pro 업글 (commission_driven 누적 후) |
| CASE_STUDY_APP_IDS 비어있음 | 5개 케이스 스터디 수동 큐레이션 필요 | 별도 리서치 |
| Apple App Store 수집 | 현재 Google Play only | 차후 확장 |
| 중국 Android 서드파티 스토어 | Phase 2 | — |

---

## 다음 세션 지침

`docs/11-next-session-resume.md` 참조.

요약 (2026-04-14 기준):
1. 마이그레이션 006 적용 완료 확인 ✅
2. 큐레이션 execute 실행 완료 (45/45 수집, case_study 5 공석) ✅
3. Stage 8 → Library-first 통합 코드 완료 (`pattern-query.ts`, 2026-04-14) ✅
4. `/api/dev/reference-library/analyze?levels=1,2,3` 로 L1~L3 파이프라인 실행 — **다음 최우선**
5. `library_patterns` 조회로 초기 합성 결과 확인
6. Stage 8 실동작 검증 (L1~L3 완료 후 Library 주축·유사 게임 실제 반영 확인)
7. 루노소프트 게임 end-to-end 검증
