# blockbusterlab — 인디게임닷컴 ASO 자동화 서비스

인디게임 개발자를 대상으로 한 **ASO(앱스토어 최적화) 분석·제작 서비스**. 인디게임닷컴 공식 파트너, (주)블록버스터랩 운영.

- **운영 URL**: https://blockbusterlab.com
- **현재 Phase**: Phase 1 (ASO 서비스) — 운영 진입 완료 (2026-04-29)

## Phase 1 운영 상태

- **Reference Library**: 90 게임 / 13 axis 패턴 (high·medium·low confidence)
- **Stage 8 ASO 분석**: Opus 4.6 + Library 통합, 의뢰당 ~$2.5
- **Stage 9 스크린샷 제작**: 평가 → 가이드 OR composite 분기 구조
- **어드민 백오피스 6 메뉴**: 주문 / 결과물 / Library / 고객 / 통계 / 설정
- **인프라**: Vercel + Supabase + Resend (이메일) + GoDaddy (도메인)

## 저장소 구조

```
.
├── docs/                  기획·설계·운영 문서 (Source of Truth)
│   ├── aso/               ASO 지식 체계 (knowledge.md + raw-notes)
│   └── archived/          폐기된 옛 문서
├── website/               Next.js 앱 (Vercel Root Directory)
│   ├── src/app/           App Router 페이지·API
│   │   ├── admin/         관리자 백오피스
│   │   ├── api/           REST + dev 엔드포인트
│   │   └── apply/         고객 신청 폼
│   ├── src/lib/
│   │   ├── ai/            ASO 분석 엔진 (aso-analyzer)
│   │   ├── reference-library/  Library L1~L3 분석 모듈
│   │   ├── screenshot/    Stage 9 스크린샷 제작
│   │   └── scraper/       스토어 메타·이미지 수집
│   └── supabase/migrations/    DB 스키마 (001~008)
└── .github/workflows/     CI (TS check + build)
```

## 진입점 문서

작업 시작 전 아래 순서로 읽기:

1. **[docs/README.md](docs/README.md)** — 문서 인덱스
2. **[docs/11-next-session-resume.md](docs/11-next-session-resume.md)** — 다음 세션 재개 가이드
3. **[docs/02-current-state.md](docs/02-current-state.md)** — 현재 구현 상태
4. **[docs/12-library-analysis-design.md](docs/12-library-analysis-design.md)** — Reference Library v2 설계
5. **[docs/aso/knowledge.md](docs/aso/knowledge.md)** — ASO 원리·하드룰·축 프레임

DB 실체는 `website/supabase/migrations/` (문서보다 마이그레이션 파일 우선).

## 로컬 개발

```bash
cd website
npm install
npm run dev
```

`.env.local` 필요 항목:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `ANTHROPIC_API_KEY`

## 작업 규칙 (`CLAUDE.md` · `AGENTS.md` 참조)

- 큰 범위 변경은 반드시 사용자에게 확인 후 진행
- 모듈은 기능별로 분리
- 요청이 명확하지 않을 때 추론보다 확인 우선
- **고객 대면 영역에서 "AI" 언급 금지**

---

© 2026 (주)블록버스터랩
