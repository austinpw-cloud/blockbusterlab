# blockbusterlab — 인디게임닷컴 ASO 자동화 서비스

인디게임 개발자를 대상으로 한 **ASO(앱스토어 최적화) 분석·제작 서비스**. 인디게임닷컴 공식 파트너, (주)블록버스터랩 운영.

- **운영 URL**: https://indiegame-opal.vercel.app
- **브랜드 도메인 (예정)**: blockbusterlab.com
- **현재 Phase**: Phase 1 (ASO 서비스) — MVP 주요 기능 구축 완료, Library L1~L3 실측·통합 대기

---

## 저장소 구조

```
.
├── docs/                  — 기획·설계·운영 문서 (Source of Truth)
├── website/               — Next.js 16 웹 애플리케이션
│   ├── src/app/           — App Router 페이지·API
│   ├── src/lib/           — AI·ASO·Reference Library·Scraper 모듈
│   └── supabase/
│       └── migrations/    — DB 스키마 Source of Truth (001~006)
└── README.md              — 이 파일
```

---

## 진입점 문서

작업 시작 전 아래 순서로 읽기:

1. **[docs/README.md](docs/README.md)** — 문서 인덱스 (역할·링크)
2. **[docs/11-next-session-resume.md](docs/11-next-session-resume.md)** — 다음 세션 재개 가이드 (우선순위·금지사항)
3. **[docs/02-current-state.md](docs/02-current-state.md)** — 현재 구현 상태
4. **[docs/07-aso-service-spec.md](docs/07-aso-service-spec.md)** — ASO 서비스 스펙 (Phase 1 마스터)

추가:
- **설계 근거**: `docs/12-library-analysis-design.md` (Reference Library 3층 구조)
- **ASO 지식 체계**: `docs/aso/knowledge.md`
- **DB 실체**: `website/supabase/migrations/` (문서보다 migration 파일이 우선)

---

## 개발 시작

```bash
cd website
npm install
npm run dev
```

환경변수(`.env.local`) 필요. 키 목록은 `docs/02-current-state.md` 및 `website/.env.example` 참조.

---

## 작업 규칙 (`CLAUDE.md` · `AGENTS.md` 참조)

- 큰 범위 변경은 반드시 사용자에게 확인 후 진행
- 모듈은 기능별로 분리
- 요청이 명확하지 않을 때 추론보다 확인 우선
- **고객 대면 영역에서 "AI" 언급 금지**
