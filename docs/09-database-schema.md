# 데이터베이스 스키마 설계 (개요)

> **역할 재정의 (2026-04-13)**: 본 문서는 **초기 스키마 설계 아이디어** 와 **high-level 개요** 만 담는다. 실제 적용된 스키마·제약·RLS 정책은 아래가 **Source of Truth**:
>
> **→ `website/supabase/migrations/001_initial_schema.sql` ~ `006_library_patterns_and_insights.sql`**
>
> 본 문서가 낡았을 때 우선순위는 migrations 파일. 본 문서는 설계 의도·ER 관계 파악용.
>
> ## 마이그레이션 파일 요약
>
> | 번호 | 파일 | 핵심 내용 |
> |---|---|---|
> | 001 | initial_schema | `customers`·`admin_users`·`orders`·`order_files`·`deliverables`·`revision_requests`·`aso_benchmarks` 등 핵심 테이블 + RLS |
> | 002 | seed_admin | 관리자 계정 시드 |
> | 003 | reference_library | `reference_games`·`reference_screenshots`·`genre_playbooks` + RLS |
> | 004 | upload_materials_guide | `deliverable_type` enum 에 `upload_materials_guide` 추가 |
> | 005 | reference_library_extensions | `reference_games.country` + 복합 UNIQUE · `aso_analysis`·`reviews_summary`·`monetization`·`video_url` · `last_refreshed_at` |
> | 006 | library_patterns_and_insights | `reference_games` 축 태깅 (selection_basis·target_markets·monetization_model·studio_size·icon_analysis·text_analysis) + `library_patterns` 테이블 |
>
> ## 초기 설계와 실제의 주요 차이
>
> - ❌ `aso_benchmarks` 단일 테이블 (초기 기획) → ✅ `reference_games` + `reference_screenshots` + `library_patterns` 3분리 (실제). 설계 근거는 `docs/12-library-analysis-design.md`.
> - 이하 본문은 초기 기획 내용 그대로 보존. 참고용으로만 읽을 것.

---

## 테이블 구조 개요 (초기 기획)

```
┌─────────────────┐       ┌─────────────────┐
│   customers     │       │   admin_users   │
│  (고객 계정)    │       │  (관리자 계정)  │
└────────┬────────┘       └─────────────────┘
         │
         │ 1:N
         ↓
┌─────────────────┐
│     orders      │
│  (주문)         │
└────────┬────────┘
         │
         │ 1:N
         ↓
┌─────────────────┐       ┌─────────────────┐
│ order_files     │       │  deliverables   │
│ (고객 업로드)   │       │  (결과물)       │
└─────────────────┘       └─────────────────┘
```

### 추가 참조 테이블
- `aso_benchmarks` — 장르별 Top 게임 벤치마크 데이터
- `media_outlets` — 매체 DB (Phase 2)
- `revision_requests` — 수정 요청

---

## 핵심 테이블 SQL

### 1. customers (고객)

```sql
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  studio_name     TEXT NOT NULL,
  phone           TEXT,
  country         TEXT DEFAULT 'KR',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_auth_user ON customers(auth_user_id);
```

### 2. admin_users (관리자)

```sql
CREATE TABLE admin_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('publisher', 'editor', 'operator')),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 데이터 (계정 생성 후 수동 INSERT)
-- INSERT INTO admin_users (auth_user_id, email, name, role) VALUES
--   ('...', 'jms@blockbusterlab.com', '정무식', 'publisher'),
--   ('...', 'lim@blockbusterlab.com', '임재청', 'editor');
```

### 3. orders (주문)

```sql
CREATE TYPE order_status AS ENUM (
  'pending',          -- 접수됨
  'processing',       -- 분석/생성 중
  'qc',               -- QC 대기
  'delivered',        -- 전달 완료
  'revision',         -- 수정 요청 중
  'completed',        -- 최종 완료 (30일 후 자동)
  'cancelled'         -- 취소됨
);

CREATE TYPE service_type AS ENUM (
  'aso',              -- Phase 1
  'press_release',    -- Phase 2
  'translation'       -- Phase 3
);

CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        TEXT UNIQUE NOT NULL,         -- 예: "BBL-20260412-0001"
  customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- 서비스 정보
  service_type        service_type NOT NULL,
  package_tier        TEXT,                          -- 'start' | 'basic' | 'global' 등
  
  -- 게임 정보 (ASO 공통)
  game_title          TEXT NOT NULL,
  game_genre          TEXT,
  store_url_android   TEXT,
  store_url_ios       TEXT,
  core_features       TEXT,                          -- 핵심 특징 3가지 (개행 구분)
  target_market       TEXT,                          -- 'korea' | 'global' | 'japan' | 'china'
  additional_notes    TEXT,                          -- 강조/피하고 싶은 포인트
  
  -- 상태 관리
  status              order_status NOT NULL DEFAULT 'pending',
  
  -- 결제 정보
  price_krw           INTEGER,
  payment_status      TEXT DEFAULT 'pending',        -- 'pending' | 'paid' | 'refunded'
  payment_method      TEXT,                          -- 'bank_transfer' | 'card' | 'other'
  payment_memo        TEXT,
  is_founding_partner BOOLEAN DEFAULT FALSE,
  
  -- 일정
  due_date            TIMESTAMPTZ,                   -- 납기일 (접수 +5영업일)
  delivered_at        TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  
  -- 담당자
  assigned_editor_id  UUID REFERENCES admin_users(id),
  
  -- 메타
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_service_type ON orders(service_type);
```

### 4. order_files (고객 업로드 파일)

```sql
CREATE TYPE file_category AS ENUM (
  'screenshot',       -- 스크린샷
  'logo',             -- 로고
  'trailer',          -- 트레일러
  'gameplay_video',   -- 게임플레이 영상
  'character_art',    -- 캐릭터 아트
  'ui_asset',         -- UI 에셋
  'other'             -- 기타
);

CREATE TABLE order_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  category        file_category NOT NULL,
  file_name       TEXT NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  storage_path    TEXT NOT NULL,                    -- Supabase Storage path
  public_url      TEXT,
  display_order   INTEGER DEFAULT 0,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_files_order ON order_files(order_id);
```

### 5. deliverables (결과물)

```sql
CREATE TYPE deliverable_type AS ENUM (
  'aso_text',                 -- ASO 텍스트 결과물 (제목/서브타이틀/소개문구/키워드)
  'aso_screenshots',          -- ASO 스크린샷 이미지 세트
  'aso_guide',                -- 스크린샷 제작 가이드
  'aso_analysis_report',      -- 분석 리포트
  'press_release',            -- 보도자료 (Phase 2)
  'translation',              -- 번역 결과물 (Phase 3)
  'editor_message',           -- 편집장 환영 메시지
  'package_zip'               -- 전체 압축 패키지
);

CREATE TABLE deliverables (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type                deliverable_type NOT NULL,
  
  -- 텍스트 결과물용
  content             JSONB,                       -- 구조화된 텍스트 결과물
  
  -- 파일 결과물용
  storage_path        TEXT,
  public_url          TEXT,
  file_size           BIGINT,
  
  -- 상태
  status              TEXT DEFAULT 'draft',        -- 'draft' | 'qc_pending' | 'approved' | 'delivered'
  version             INTEGER DEFAULT 1,            -- 수정 시 버전 증가
  
  -- 메타
  generated_at        TIMESTAMPTZ DEFAULT NOW(),
  approved_by         UUID REFERENCES admin_users(id),
  approved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliverables_order ON deliverables(order_id);
CREATE INDEX idx_deliverables_type ON deliverables(type);
```

### 6. revision_requests (수정 요청)

```sql
CREATE TABLE revision_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  request_number  INTEGER NOT NULL,                 -- 1회차, 2회차
  requested_by    UUID REFERENCES customers(id),
  request_text    TEXT NOT NULL,
  status          TEXT DEFAULT 'pending',           -- 'pending' | 'in_progress' | 'completed'
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revision_requests_order ON revision_requests(order_id);
```

---

## ASO 벤치마크 데이터 테이블

### 7. aso_benchmarks (장르별 벤치마크)

```sql
CREATE TABLE aso_benchmarks (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre                   TEXT NOT NULL,              -- 'puzzle' | 'rpg' | 'action' 등 9개
  game_title              TEXT NOT NULL,
  developer               TEXT,
  platform                TEXT NOT NULL,              -- 'ios' | 'android'
  rank_position           INTEGER,                    -- 장르 내 순위
  
  -- 텍스트 요소
  title_keywords          TEXT[],
  subtitle                TEXT,
  description_first_252   TEXT,
  
  -- 비주얼 요소
  icon_colors             TEXT[],                     -- 주요 색상 팔레트
  icon_style              TEXT,                       -- 'character_centric' | 'logo_forward' 등
  screenshot_count        INTEGER,
  screenshot_orientation  TEXT,                       -- 'portrait' | 'landscape' | 'mixed'
  has_preview_video       BOOLEAN,
  
  -- 메트릭
  rating                  DECIMAL(2,1),
  download_count          TEXT,                       -- "890M" 등 문자열
  
  -- 출처
  source_url              TEXT,
  last_verified           DATE,
  
  -- 메타
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aso_benchmarks_genre ON aso_benchmarks(genre);
CREATE INDEX idx_aso_benchmarks_platform ON aso_benchmarks(platform);
```

---

## Row Level Security (RLS)

### 고객 테이블: 본인 데이터만 접근

```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own data"
  ON customers FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Customers can update own data"
  ON customers FOR UPDATE
  USING (auth.uid() = auth_user_id);
```

### 주문 테이블: 본인 주문만 + 관리자는 전체

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all orders"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid() AND is_active = TRUE
    )
  );
```

### order_files, deliverables도 같은 패턴

```sql
-- 고객은 자신의 주문 파일만 조회
-- 관리자는 전체 조회/수정

-- (동일 패턴 반복, 생략)
```

---

## Storage 버킷 구조

Supabase Storage에 다음 버킷 생성:

```
buckets/
├── order-materials/         # 고객 업로드 (공개 X)
│   └── {order_id}/
│       ├── screenshots/
│       ├── logo.png
│       └── misc/
│
└── deliverables/            # 결과물 (고객만 접근)
    └── {order_id}/
        ├── aso_screenshots/
        ├── aso_text.json
        ├── guide.pdf
        └── package.zip
```

---

## 초기 SQL 마이그레이션 파일

모든 위 SQL을 하나의 파일로 저장:
- `website/supabase/migrations/001_initial_schema.sql`

Supabase에 연결 후 실행 방법:
```bash
# 방법 1: Supabase Studio에서 SQL Editor로 붙여넣고 실행
# 방법 2: Supabase CLI 사용
npx supabase db push
```

---

## 확장 계획 (Phase 2/3)

### Phase 2: 보도자료 서비스 추가

```sql
-- 매체 DB
CREATE TABLE media_outlets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  url             TEXT,
  tier            TEXT,                              -- 'tier1' | 'tier2' | 'tier3'
  region          TEXT,                              -- 'kr' | 'en' | 'jp' | 'cn' 등
  email           TEXT,
  contact_method  TEXT,                              -- 'email' | 'form' | 'individual'
  is_active       BOOLEAN DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 배포 기록
CREATE TABLE press_distributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id),
  media_outlet_id UUID REFERENCES media_outlets(id),
  sent_at         TIMESTAMPTZ,
  sent_status     TEXT,
  opened_at       TIMESTAMPTZ,
  coverage_url    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 3: 번역 서비스 추가

번역 서비스는 기존 orders 테이블에 `service_type = 'translation'`으로 기록하고, 번역 특화 필드는 `deliverables.content` JSONB에 저장.

---

## 다음 단계

1. [ ] Supabase 프로젝트 생성 완료 후 위 SQL 실행
2. [ ] Storage 버킷 생성 (order-materials, deliverables)
3. [ ] 관리자 계정(정무식/임재청) 생성 후 admin_users 수동 INSERT
4. [ ] 초기 ASO 벤치마크 데이터 import (ASO-bible 문서 기반)
