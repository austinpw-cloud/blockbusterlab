-- =====================================================================
-- Reference Library — ASO 품질 기준을 제공하는 사전 구축 라이브러리
--
-- 1회성 구축 + 분기별 업데이트.
-- 주문 처리 시 이 데이터를 조회해 재사용 → 비용/품질/일관성 향상.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. reference_games — 레퍼런스 게임 메타
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE reference_games (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre               TEXT NOT NULL,                -- 내부 장르 ID (puzzle, rpg, ...)
  app_id              TEXT NOT NULL UNIQUE,          -- Google Play package id
  title               TEXT NOT NULL,
  developer           TEXT,
  gplay_genre         TEXT,                          -- Google Play 공식 장르
  rating              DECIMAL(3,2),
  ratings_count       INTEGER,
  installs            TEXT,                          -- "100,000,000+"
  min_installs        BIGINT,
  store_url           TEXT,

  -- 텍스트 요소 (프롬프트/분석용)
  short_description   TEXT,
  full_description    TEXT,

  -- Storage에 저장된 아이콘 경로
  icon_storage_path   TEXT,
  icon_original_url   TEXT,

  -- Vision 분석된 아이콘 요약 (JSON)
  icon_analysis       JSONB,

  -- 수집 정보
  rank_position       INTEGER,                       -- Top 차트 내 순위 (수집 시점)
  collection_run_id   TEXT,                          -- 수집 배치 ID (추적용)
  scraped_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reference_games_genre ON reference_games(genre);
CREATE INDEX idx_reference_games_rank ON reference_games(genre, rank_position);

-- ─────────────────────────────────────────────────────────────────────
-- 2. reference_screenshots — 스크린샷 & Vision 분석
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE reference_screenshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id             UUID NOT NULL REFERENCES reference_games(id) ON DELETE CASCADE,
  slot_number         INTEGER NOT NULL,              -- 스토어 슬롯 1,2,3...

  storage_path        TEXT NOT NULL,                 -- Storage 경로
  original_url        TEXT,
  width               INTEGER,
  height              INTEGER,
  file_size           BIGINT,

  -- Vision 분석 결과 (구조화된 JSON)
  -- {
  --   layout_pattern, purpose_signal,
  --   typography: { headline, subtitle, accent },
  --   color_palette: { background, text, accents },
  --   background_treatment,
  --   image_treatment,
  --   decorative_elements: [...],
  --   visual_hierarchy,
  --   what_makes_it_work,
  --   replicable_recipe,
  --   quality_score
  -- }
  analysis            JSONB,
  analysis_cost_usd   DECIMAL(10,6),
  analyzed_at         TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reference_screenshots_game ON reference_screenshots(game_id);
CREATE INDEX idx_reference_screenshots_slot ON reference_screenshots(game_id, slot_number);

-- ─────────────────────────────────────────────────────────────────────
-- 3. genre_playbooks — 장르별 종합 플레이북
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE genre_playbooks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre               TEXT NOT NULL UNIQUE,

  -- Vision 합성 결과 (구조화)
  -- {
  --   executive_summary,
  --   slot_archetypes: [{ slot, purpose, layout_pattern, common_elements }],
  --   typography_system: { headline, subtitle, accent },
  --   color_systems: [{ mood, palette }],
  --   decorative_vocabulary: [{ element, usage_pattern }],
  --   image_treatments,
  --   quality_bar: { must_have, avoid, aspirational },
  --   html_css_snippets: [{ name, code }]
  -- }
  playbook            JSONB,

  source_screenshots_count  INTEGER,
  source_games_count        INTEGER,
  synthesis_cost_usd        DECIMAL(10,4),
  synthesized_at            TIMESTAMPTZ,
  version                   INTEGER DEFAULT 1,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 4. 갱신 트리거
-- ─────────────────────────────────────────────────────────────────────
CREATE TRIGGER update_reference_games_updated_at
  BEFORE UPDATE ON reference_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_genre_playbooks_updated_at
  BEFORE UPDATE ON genre_playbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────
-- 5. RLS (공개 읽기 + 관리자만 쓰기)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE reference_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads reference games"
  ON reference_games FOR SELECT USING (TRUE);
CREATE POLICY "Admins write reference games"
  ON reference_games FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND is_active = TRUE)
  );

ALTER TABLE reference_screenshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads reference screenshots"
  ON reference_screenshots FOR SELECT USING (TRUE);
CREATE POLICY "Admins write reference screenshots"
  ON reference_screenshots FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND is_active = TRUE)
  );

ALTER TABLE genre_playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads genre playbooks"
  ON genre_playbooks FOR SELECT USING (TRUE);
CREATE POLICY "Admins write genre playbooks"
  ON genre_playbooks FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND is_active = TRUE)
  );

-- ─────────────────────────────────────────────────────────────────────
-- 6. Storage 버킷 — reference-library (private)
-- ─────────────────────────────────────────────────────────────────────
-- Supabase Dashboard → Storage → "New bucket":
--   Name: reference-library
--   Public: OFF
-- 위 버킷은 SQL로 생성 불가. 대시보드에서 수동 생성 필요.
