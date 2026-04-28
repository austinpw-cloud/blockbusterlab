# indiegame.com 웹사이트 프로토타입 문서

> ⚠️ **이 문서는 과거 프로토타입 스냅샷입니다 (historical reference).**
>
> 여기 기술된 수치·로고·후기는 **가상 데이터**이며, "신청 폼 백엔드 미연동" 같은 서술도 현재 상태와 다릅니다. 현재 실제 구현 상태는 다음을 참고:
> - **현재 상태**: `docs/02-current-state.md`
> - **진행 로그**: `docs/10-progress-log.md`
> - **서비스 스펙**: `docs/07-aso-service-spec.md`
>
> 이 문서는 초기 기획 흐름 파악용으로만 유지합니다.

## 1. 개요

indiegame.com은 인디게임사를 위한 B2B 서비스 플랫폼입니다.
보도자료 제작/배포, 게임 콘텐츠 번역, ASO(App Store Optimization) 지원을 유료로 제공하며, 신청서 기반으로 상담 후 서비스를 진행합니다.

- **프로토타입 URL**: https://indiegame-opal.vercel.app
- **기술 스택**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion
- **호스팅**: Vercel

---

## 2. 페이지 구성

### 2.1 메인 페이지 (`/`)

| 섹션 | 내용 |
|---|---|
| Hero | "당신의 게임을 세계에 알리세요" 타이틀, 서브 설명, CTA 버튼 2개 (무료 상담 신청, 서비스 알아보기) |
| 실적 수치 | 지원 게임 150+, 배포 매체 200+, 지원 언어 25+, 파트너사 80+ |
| 클라이언트 로고 | 파트너 스튜디오 8곳 표시 (프로토타입용 가상 데이터) |
| 핵심 서비스 | 보도자료/번역/ASO 3개 서비스 카드, 각 서비스 상세 페이지로 링크 |
| 이용 방법 | 4단계 프로세스: 신청서 제출 → 상담 & 견적 → 작업 진행 → 결과 전달 |
| 고객 후기 | 3개 가상 후기 (위시리스트 3배 증가, 리뷰 점수 상승, 오가닉 다운로드 40% 증가) |
| CTA | "지금 시작하세요" - 무료 상담 신청 유도 |

### 2.2 서비스 상세 페이지 (`/services`)

3개 서비스별 상세 설명을 앵커 링크로 구분:

**보도자료 제작 & 배포 (`#press`)**
- 전문 게임 라이터 배정
- 200+ 매체 배포 네트워크
- 다국어 보도자료 (한/영/일/중)
- 배포 성과 리포트
- 활용 사례: 신작 출시, 업데이트 공지, 수상 발표, 이벤트 홍보

**게임 콘텐츠 번역 (`#translation`)**
- 게임 전문 번역가 네트워크
- 컨텍스트 기반 번역 (빌드 플레이 후 번역)
- LQA(현지화 QA) 포함
- 지속적 업데이트 지원
- 활용 사례: UI/UX, 스토리/대사, 스토어 페이지, 마케팅 소재

**ASO 최적화 (`#aso`)**
- 키워드 리서치 & 최적화
- 스토어 페이지 최적화 (아이콘, 스크린샷, 프리뷰, 설명문)
- A/B 테스트 설계 & 분석
- 경쟁사 & 시장 분석
- 활용 사례: 신규 출시, 오가닉 개선, 글로벌 진출, 스토어 리뉴얼

### 2.3 가격 페이지 (`/pricing`)

**플랜 3종:**

| 플랜 | 가격 | 대상 | 주요 포함 내용 |
|---|---|---|---|
| Starter | 49만원~ / 프로젝트 | 처음 이용하는 스튜디오 | 보도자료 1건, 국내 50+ 배포, 1개 언어 번역(5,000단어), 기본 ASO 리서치 |
| Growth | 129만원~ / 프로젝트 | 글로벌 진출 준비 스튜디오 | 보도자료 3건, 200+ 배포, 3개 언어(15,000단어), LQA, ASO 전체, A/B 테스트 1회, 전담 매니저 |
| Enterprise | 맞춤 견적 | 대규모/지속 서비스 | 무제한 보도자료, 10+ 언어, 문화화 컨설팅, 전용 팀, 슬랙 소통, 월간 미팅 |

**추가 옵션:**
- 추가 언어 번역: 15만원~ / 언어
- 긴급 처리 (48시간): +50%
- 보도자료 추가: 20만원~ / 건
- A/B 테스트 추가: 15만원~ / 회

**FAQ 4개:**
- 무료 상담 프로세스
- 작업 기간 (보도자료 3~5일, 번역 5~15일, ASO 7~10일)
- 결제 방식 (선금 50% / 잔금 50%, 세금계산서 가능)
- 수정 횟수 (기본 2회, Growth 이상 3회)

### 2.4 포트폴리오 페이지 (`/portfolio`)

4개 가상 성공 사례:

| 게임 | 스튜디오 | 서비스 | 주요 성과 |
|---|---|---|---|
| Echoes of the Void | PixelForge | 보도자료+번역+ASO | 위시리스트 300% 증가, 12개 언어, 40곳 매체 보도 |
| Lantern's Path | Starlit Games | 번역+ASO | 일본 다운로드 5배, 전환율 40% 개선, RPG 12위 |
| Circuit Breaker | NeonByte | 보도자료 | IGN 등 50+ 보도, 첫 달 매출 200% 초과 |
| Tiny Kingdoms | Tiny Giant | ASO+번역 | 8개 언어, 글로벌 180% 증가, 평점 4.2→4.6 |

### 2.5 서비스 신청 페이지 (`/apply`)

**폼 필드:**
- 이름 (필수)
- 이메일 (필수)
- 스튜디오/회사명 (필수)
- 게임 제목
- 스토어 페이지/웹사이트 URL
- 관심 서비스 (다중 선택: 보도자료, 번역, ASO)
- 희망 플랜 (Starter / Growth / Enterprise / 미정)
- 예상 예산 (50만 이하 ~ 300만 이상)
- 추가 요청사항 (텍스트영역)

제출 후 완료 화면 표시 (프로토타입에서는 실제 전송 없음, 클라이언트 측 상태 변경만).

---

## 3. 공통 컴포넌트

| 컴포넌트 | 파일 | 설명 |
|---|---|---|
| Header | `src/components/Header.tsx` | 로고, 네비게이션(Services/Pricing/Portfolio), 테마 토글, Start Now CTA, 모바일 햄버거 메뉴 |
| Footer | `src/components/Footer.tsx` | 로고, 서비스 설명, Services/Company 링크, 카피라이트 |
| ThemeToggle | `src/components/ThemeToggle.tsx` | 다크/라이트 테마 전환, localStorage 저장 |
| FadeIn | `src/components/FadeIn.tsx` | 스크롤 등장 애니메이션 (FadeIn, StaggerContainer, StaggerItem) |

---

## 4. 디자인 시스템

### 4.1 테마

**다크 테마 (기본)**
| 토큰 | 값 | 용도 |
|---|---|---|
| background | `#0a0a0f` | 페이지 배경 |
| foreground | `#e8e8ed` | 기본 텍스트 |
| accent | `#6c5ce7` | 주 액센트 (버튼, 강조) |
| accent-light | `#a29bfe` | 보조 액센트 (호버, 하이라이트) |
| surface | `#16161f` | 카드/섹션 배경 |
| border | `#2a2a3a` | 테두리 |
| muted | `#8888a0` | 보조 텍스트 |

**라이트 테마**
| 토큰 | 값 | 용도 |
|---|---|---|
| background | `#ffffff` | 페이지 배경 |
| foreground | `#1a1a2e` | 기본 텍스트 |
| accent | `#5b4cdb` | 주 액센트 |
| accent-light | `#6c5ce7` | 보조 액센트 |
| surface | `#f4f4f8` | 카드/섹션 배경 |
| border | `#d8d8e0` | 테두리 |
| muted | `#6b6b80` | 보조 텍스트 |

### 4.2 애니메이션

- **헤더**: 페이지 로드 시 위에서 슬라이드 인, 네비 링크 밑줄 호버 효과
- **모바일 메뉴**: AnimatePresence로 슬라이드 다운/업, 각 항목 순차 등장
- **스크롤 등장**: FadeIn 컴포넌트로 viewport 진입 시 등장 (방향: up/down/left/right)
- **카드 호버**: y축 이동 + scale 확대, 보더 컬러 변경
- **버튼**: whileHover scale 1.05, whileTap scale 0.95
- **통계 숫자**: 스프링 스케일 애니메이션
- **서비스 아이콘**: 호버 시 좌우 흔들림

---

## 5. 소스 코드 구조

```
website/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 루트 레이아웃 (Header/Footer 포함)
│   │   ├── page.tsx            # 메인 페이지
│   │   ├── globals.css         # CSS 변수, 테마 정의
│   │   ├── favicon.ico
│   │   ├── apply/
│   │   │   └── page.tsx        # 서비스 신청 폼
│   │   ├── portfolio/
│   │   │   └── page.tsx        # 성공 사례
│   │   ├── pricing/
│   │   │   └── page.tsx        # 가격 플랜
│   │   └── services/
│   │       └── page.tsx        # 서비스 상세
│   └── components/
│       ├── FadeIn.tsx          # 애니메이션 컴포넌트
│       ├── Footer.tsx          # 푸터
│       ├── Header.tsx          # 헤더 + 네비게이션
│       └── ThemeToggle.tsx     # 테마 전환 버튼
├── public/                     # 정적 파일
├── package.json                # 의존성 (next, react, framer-motion, tailwindcss)
├── tsconfig.json               # TypeScript 설정
├── next.config.ts              # Next.js 설정
├── postcss.config.mjs          # PostCSS 설정
├── eslint.config.mjs           # ESLint 설정
└── PROTOTYPE.md                # 이 문서
```

---

## 6. 로컬 개발

```bash
cd website
npm install
npm run dev
# http://localhost:3000 에서 확인
```

---

## 7. 배포

현재 Vercel에 배포되어 있습니다.

- **Production URL**: https://indiegame-opal.vercel.app
- **Vercel 프로젝트**: austinpw-clouds-projects/indiegame

재배포:
```bash
cd website
vercel --yes --public
```

indiegame.com 도메인 연결 시 Vercel 대시보드 > Settings > Domains에서 추가 후, 가비아 DNS에서 A 레코드를 `76.76.21.21`로 변경.

---

## 8. 프로토타입 한계 및 다음 단계

### 현재 프로토타입에서 미구현된 사항
- 신청 폼 실제 백엔드 연동 (현재 클라이언트 측 상태 변경만)
- 사용자 인증/대시보드
- 실제 포트폴리오 콘텐츠 및 이미지
- 결제 시스템 연동
- 다국어 지원 (현재 한국어만)
- SEO 메타태그 상세 설정
- 실제 클라이언트 로고 및 후기 데이터

### 다음 단계 제안
1. 콘텐츠 확정: 실제 서비스 설명, 가격, 사례 데이터 반영
2. 폼 백엔드: 이메일 알림 또는 Google Sheets/Notion 연동
3. 이미지/브랜딩: 로고, 게임 스크린샷, 아이콘 디자인
4. 도메인 연결: indiegame.com → Vercel
5. 분석 도구: Google Analytics / Vercel Analytics 연동
