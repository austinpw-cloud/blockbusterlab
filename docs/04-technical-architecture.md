# 기술 아키텍처

## 시스템 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                        클라이언트                             │
│  Next.js 16 (App Router) + React 19 + Tailwind + Framer     │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ 랜딩페이지│ │ 신청 폼  │ │ 고객     │ │ 어드민       │   │
│  │ (현재)   │ │ (현재)   │ │ 대시보드 │ │ 대시보드     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    Next.js API Routes
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                     백엔드 서비스                             │
│                          │                                    │
│  ┌───────────┐  ┌────────┴───────┐  ┌──────────────────┐   │
│  │ 주문 관리  │  │  AI 파이프라인  │  │  배포/알림 시스템  │   │
│  │ API       │  │                │  │                  │   │
│  │           │  │ ┌────────────┐ │  │ - 매체 이메일    │   │
│  │ - 접수    │  │ │보도자료 생성│ │  │ - 고객 알림     │   │
│  │ - 상태관리│  │ │ (Claude)   │ │  │ - 편집장 알림   │   │
│  │ - 결과전달│  │ ├────────────┤ │  │ - Telegram 봇   │   │
│  │           │  │ │편집 번역   │ │  │ - WordPress     │   │
│  │           │  │ │ (Claude)   │ │  │   자동 게시     │   │
│  │           │  │ ├────────────┤ │  │                  │   │
│  │           │  │ │ASO 분석    │ │  └──────────────────┘   │
│  │           │  │ │ (Claude +  │ │                          │
│  │           │  │ │  벤치마크) │ │                          │
│  │           │  │ └────────────┘ │                          │
│  └───────────┘  └────────────────┘                          │
│        │                │                                    │
│        └────────┬───────┘                                    │
│                 │                                            │
│          ┌──────┴──────┐                                     │
│          │  Database   │                                     │
│          │  (Supabase) │                                     │
│          │             │                                     │
│          │ - 주문      │                                     │
│          │ - 고객      │                                     │
│          │ - 결과물    │                                     │
│          │ - ASO DB    │                                     │
│          └─────────────┘                                     │
└──────────────────────────────────────────────────────────────┘

외부 서비스:
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐
│ Claude API │ │ Resend     │ │ Vercel     │ │ Supabase │
│ (AI 엔진) │ │ (이메일)   │ │ (배포+Blob)│ │ (DB+Auth)│
└────────────┘ └────────────┘ └────────────┘ └──────────┘
```

---

## API 설계

### 주문 관리 API

```
POST   /api/orders              # 서비스 신청 접수
GET    /api/orders              # 주문 목록 (어드민)
GET    /api/orders/:id          # 주문 상세
PATCH  /api/orders/:id          # 주문 상태 업데이트
POST   /api/orders/:id/deliver  # 결과물 전달
```

### AI 파이프라인 API

```
POST   /api/ai/press-release    # 보도자료 초안 생성
POST   /api/ai/translate        # 편집 번역
POST   /api/ai/aso-analyze      # ASO 자동 분석
POST   /api/ai/aso-suggest      # ASO 개선안 생성
POST   /api/ai/keywords         # 키워드 추천
```

### 파일 관리 API

```
POST   /api/upload              # 파일 업로드 (아이콘, 스크린샷)
GET    /api/files/:id           # 파일 다운로드
```

### 알림 API

```
POST   /api/notify/editor       # 편집장에게 검수 요청
POST   /api/notify/customer     # 고객에게 결과 전달
```

---

## 데이터 모델

### orders (주문)

```sql
CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  email         TEXT NOT NULL,
  studio_name   TEXT NOT NULL,
  game_title    TEXT,
  store_url     TEXT,
  services      TEXT[] NOT NULL,        -- ['press', 'translation', 'aso']
  plan          TEXT NOT NULL,           -- 'starter' | 'growth' | 'enterprise'
  budget        TEXT,
  notes         TEXT,
  status        TEXT DEFAULT 'pending',  -- pending → in_review → in_progress
                                         -- → editor_review → delivered
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### deliverables (결과물)

```sql
CREATE TABLE deliverables (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES orders(id),
  type          TEXT NOT NULL,           -- 'press_release_ko' | 'press_release_en'
                                         -- | 'aso_report' | 'translation' | 'keywords'
  content       JSONB,                   -- AI 생성 결과물
  status        TEXT DEFAULT 'draft',    -- draft → editor_approved → delivered
  editor_notes  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### aso_benchmarks (ASO 벤치마크)

```sql
CREATE TABLE aso_benchmarks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre         TEXT NOT NULL,            -- 'puzzle' | 'rpg' | 'action' | ...
  game_title    TEXT NOT NULL,
  platform      TEXT NOT NULL,            -- 'ios' | 'android'
  title_keywords TEXT[],
  subtitle      TEXT,
  icon_colors   TEXT[],
  icon_style    TEXT,
  screenshot_count INT,
  screenshot_orientation TEXT,
  has_video     BOOLEAN,
  rating        DECIMAL(2,1),
  downloads     TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## AI 파이프라인 상세

### 보도자료 생성 파이프라인

```python
# 1. 시스템 프롬프트 (편집장 스타일)
system = EDITOR_STYLE_PROMPT  # 기존 기사 100건에서 추출한 스타일

# 2. 입력 정보 구조화
user_input = {
    "game_title": "...",
    "studio": "...",
    "genre": "...",
    "features": ["...", "...", "..."],
    "description": "...",
    "release_date": "...",
    "platform": "..."
}

# 3. Claude API 호출 (Sonnet — 속도+비용 최적)
response = anthropic.messages.create(
    model="claude-sonnet-4-6",
    system=system,
    messages=[{
        "role": "user",
        "content": f"다음 정보로 보도자료를 작성해주세요:\n{json.dumps(user_input)}"
    }]
)

# 4. 비용: 기사 1건당 약 $0.01~0.05
```

### 편집 번역 파이프라인

```python
# 게임 용어 사전을 컨텍스트로 제공
GAME_TERMS_DB = {
    "방치형": "idle",
    "가챠": "gacha",
    "과금": "in-app purchase",
    "스테이지": "stage/level",
    ...
}

system = """
게임 산업 전문 편집 번역가입니다.
직역이 아닌 영문 독자 맥락의 편집 번역을 합니다.
게임 업계 용어를 정확하게 사용합니다.
ASO 키워드를 자연스럽게 포함합니다.
"""

# 번역 시 게임 용어 사전과 ASO 키워드 목록을 함께 제공
```

### ASO 분석 파이프라인

```python
# 1. 장르 분류
genre = classify_genre(game_info)

# 2. 벤치마크 로드
benchmarks = db.query("SELECT * FROM aso_benchmarks WHERE genre = ?", genre)

# 3. 각 항목 분석 (규칙 기반 + AI 보조)
title_score = analyze_title(game_title, genre, benchmarks)
subtitle_score = analyze_subtitle(subtitle, genre, benchmarks)
icon_score = analyze_icon_with_ai(icon_image, genre, benchmarks)  # Claude Vision
screenshot_score = analyze_screenshots_with_ai(screenshots, genre, benchmarks)
description_score = analyze_description(description, genre, benchmarks)

# 4. 종합 리포트 생성
total = title_score + subtitle_score + icon_score + screenshot_score + description_score

# 5. 개선안 생성 (Claude API)
suggestions = generate_suggestions(game_info, analysis_results, benchmarks)
```

---

## 데이터 흐름

### 주문 접수 → 결과 전달 전체 흐름

```
[고객]
  │ 서비스 신청 폼 제출
  ↓
[POST /api/orders]
  │ DB 저장 + 이메일 알림 (고객 확인 + 편집장 알림)
  ↓
[편집장 어드민]
  │ 주문 확인 → 상담/견적 → 승인
  ↓
[AI 파이프라인 자동 실행]
  │
  ├── 보도자료 서비스 선택 시:
  │   POST /api/ai/press-release → 초안 생성 → DB 저장
  │
  ├── 번역 서비스 선택 시:
  │   POST /api/ai/translate → 번역 생성 → DB 저장
  │
  └── ASO 서비스 선택 시:
      POST /api/ai/aso-analyze → 분석 리포트 → DB 저장
      POST /api/ai/aso-suggest → 개선안 생성 → DB 저장
  ↓
[편집장 검수]
  │ 어드민에서 AI 결과물 리뷰 → 수정/승인
  ↓
[POST /api/orders/:id/deliver]
  │ 결과물 확정 → 고객 이메일 알림
  ↓
[고객 대시보드]
  │ 결과물 확인 + 다운로드
  ↓
[보도자료 배포] (해당 시)
  │ 200+ 매체 이메일 자동 발송
  │ indiegame.com 자동 게시
  ↓
[성과 리포트] (14일 후)
```

---

## 인프라 선택 근거

| 기술 | 선택 이유 |
|------|----------|
| **Next.js 16** | 이미 사용 중, API Routes + Server Actions 활용 |
| **Supabase** | PostgreSQL + Auth + Realtime + Storage 올인원, 무료 티어 충분 |
| **Claude API** | 한국어+영어 품질 최고, Vision(아이콘/스크린샷 분석) 지원 |
| **Resend** | 개발자 친화적 이메일 API, 무료 100통/일 |
| **Vercel** | 이미 배포 중, Edge Functions + Analytics |
| **Vercel Blob** | 파일 업로드/스토리지, Vercel 통합 |

### 예상 운영 비용 (월간)

| 항목 | 비용 | 비고 |
|------|------|------|
| Vercel Pro | $20/월 | 프로덕션 배포 |
| Supabase Free | $0 | 500MB DB, 1GB Storage |
| Claude API | $10~50/월 | 주문 건수에 비례, 건당 ~$0.05 |
| Resend | $0~20/월 | 무료 100통/일, 초과 시 과금 |
| 도메인 | 이미 보유 | indiegame.com |
| **합계** | **$30~90/월** | 초기 단계 |
