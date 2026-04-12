-- =====================================================================
-- BlockbusterLab ASO Service - Initial Schema
-- Phase 1: ASO Service for Indie Game Developers
-- =====================================================================

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

CREATE TYPE order_status AS ENUM (
  'pending',          -- 접수됨
  'processing',       -- 분석/생성 중
  'qc',               -- QC 대기
  'delivered',        -- 전달 완료
  'revision',         -- 수정 요청 중
  'completed',        -- 최종 완료
  'cancelled'         -- 취소됨
);

CREATE TYPE service_type AS ENUM (
  'aso',              -- Phase 1
  'press_release',    -- Phase 2
  'translation'       -- Phase 3
);

CREATE TYPE file_category AS ENUM (
  'screenshot',
  'logo',
  'trailer',
  'gameplay_video',
  'character_art',
  'ui_asset',
  'other'
);

CREATE TYPE deliverable_type AS ENUM (
  'aso_text',
  'aso_screenshots',
  'aso_guide',
  'aso_analysis_report',
  'press_release',
  'translation',
  'editor_message',
  'package_zip'
);

-- =====================================================================
-- 2. CUSTOMERS
-- =====================================================================

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

-- =====================================================================
-- 3. ADMIN USERS
-- =====================================================================

CREATE TABLE admin_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('publisher', 'editor', 'operator')),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 4. ORDERS
-- =====================================================================

CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        TEXT UNIQUE NOT NULL,
  customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- 서비스 정보
  service_type        service_type NOT NULL,
  package_tier        TEXT,

  -- 게임 정보
  game_title          TEXT NOT NULL,
  game_genre          TEXT,
  store_url_android   TEXT,
  store_url_ios       TEXT,
  core_features       TEXT,
  target_market       TEXT,
  additional_notes    TEXT,

  -- 상태 관리
  status              order_status NOT NULL DEFAULT 'pending',

  -- 결제 정보
  price_krw           INTEGER,
  payment_status      TEXT DEFAULT 'pending',
  payment_method      TEXT,
  payment_memo        TEXT,
  is_founding_partner BOOLEAN DEFAULT FALSE,

  -- 일정
  due_date            TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,

  -- 담당자
  assigned_editor_id  UUID REFERENCES admin_users(id),

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_service_type ON orders(service_type);

-- =====================================================================
-- 5. ORDER FILES (고객 업로드)
-- =====================================================================

CREATE TABLE order_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  category        file_category NOT NULL,
  file_name       TEXT NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  storage_path    TEXT NOT NULL,
  public_url      TEXT,
  display_order   INTEGER DEFAULT 0,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_files_order ON order_files(order_id);

-- =====================================================================
-- 6. DELIVERABLES (결과물)
-- =====================================================================

CREATE TABLE deliverables (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type                deliverable_type NOT NULL,

  content             JSONB,

  storage_path        TEXT,
  public_url          TEXT,
  file_size           BIGINT,

  status              TEXT DEFAULT 'draft',
  version             INTEGER DEFAULT 1,

  generated_at        TIMESTAMPTZ DEFAULT NOW(),
  approved_by         UUID REFERENCES admin_users(id),
  approved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliverables_order ON deliverables(order_id);
CREATE INDEX idx_deliverables_type ON deliverables(type);

-- =====================================================================
-- 7. REVISION REQUESTS
-- =====================================================================

CREATE TABLE revision_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  request_number  INTEGER NOT NULL,
  requested_by    UUID REFERENCES customers(id),
  request_text    TEXT NOT NULL,
  status          TEXT DEFAULT 'pending',
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revision_requests_order ON revision_requests(order_id);

-- =====================================================================
-- 8. ASO BENCHMARKS
-- =====================================================================

CREATE TABLE aso_benchmarks (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre                   TEXT NOT NULL,
  game_title              TEXT NOT NULL,
  developer               TEXT,
  platform                TEXT NOT NULL,
  rank_position           INTEGER,

  title_keywords          TEXT[],
  subtitle                TEXT,
  description_first_252   TEXT,

  icon_colors             TEXT[],
  icon_style              TEXT,
  screenshot_count        INTEGER,
  screenshot_orientation  TEXT,
  has_preview_video       BOOLEAN,

  rating                  DECIMAL(2,1),
  download_count          TEXT,

  source_url              TEXT,
  last_verified           DATE,

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aso_benchmarks_genre ON aso_benchmarks(genre);
CREATE INDEX idx_aso_benchmarks_platform ON aso_benchmarks(platform);

-- =====================================================================
-- 9. UPDATED_AT 자동 업데이트 트리거
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aso_benchmarks_updated_at
  BEFORE UPDATE ON aso_benchmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- customers: 본인만 조회/수정
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own data"
  ON customers FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Customers can update own data"
  ON customers FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- admin_users: 관리자만 조회
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.auth_user_id = auth.uid() AND a.is_active = TRUE
    )
  );

-- orders: 본인 주문 조회 + 관리자 전체
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own orders"
  ON orders FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all orders"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid() AND is_active = TRUE
    )
  );

-- order_files: 같은 정책
ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own order files"
  ON order_files FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all order files"
  ON order_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid() AND is_active = TRUE
    )
  );

-- deliverables: 같은 정책
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own deliverables"
  ON deliverables FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE c.auth_user_id = auth.uid()
    )
    AND status = 'delivered'
  );

CREATE POLICY "Admins manage all deliverables"
  ON deliverables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid() AND is_active = TRUE
    )
  );

-- revision_requests: 본인 주문 수정 요청
ALTER TABLE revision_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own revision requests"
  ON revision_requests FOR ALL
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all revision requests"
  ON revision_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid() AND is_active = TRUE
    )
  );

-- aso_benchmarks: 읽기 전용 (관리자만 수정)
ALTER TABLE aso_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view benchmarks"
  ON aso_benchmarks FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can modify benchmarks"
  ON aso_benchmarks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Admins can update benchmarks"
  ON aso_benchmarks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid() AND is_active = TRUE
    )
  );

-- =====================================================================
-- 11. ORDER NUMBER 자동 생성 함수
-- =====================================================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  date_part TEXT;
  count_today INTEGER;
  new_number TEXT;
BEGIN
  IF NEW.order_number IS NULL THEN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');

    SELECT COUNT(*) + 1 INTO count_today
    FROM orders
    WHERE DATE(created_at) = CURRENT_DATE;

    new_number := 'BBL-' || date_part || '-' || LPAD(count_today::TEXT, 4, '0');
    NEW.order_number := new_number;
  END IF;

  -- 납기일 자동 설정 (접수 시 +5영업일, 주말 제외는 추후)
  IF NEW.due_date IS NULL THEN
    NEW.due_date := NOW() + INTERVAL '5 days';
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
