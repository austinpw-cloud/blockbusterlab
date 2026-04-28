-- =====================================================================
-- Reference Library — 3층 구조(관찰·패턴·인사이트) 전환 + 축별 메타 태깅
--
-- 배경 (2026-04-13):
--   docs/12-library-analysis-design.md v2.3 기반. 기존 Library 를
--   "장르 × 국가 Top 10 고정" 에서 "전역 큐레이션 pool + 축 조합 패턴
--   + 누적 인사이트" 로 전환.
--
--   1. reference_games 에 축 태깅(선별근거·타겟시장·수익모델·규모) 및
--      L1 분석(아이콘·텍스트) 컬럼 추가.
--   2. library_patterns 테이블 신규 — 축 조합(genre × market × monetization
--      × studio_size)별 관찰 집계와 인사이트(decision_rules·edge_cases·
--      anti_patterns·cross_axis·commission_derived)를 함께 담음.
--
--   idempotent: 전부 IF NOT EXISTS / DO 블록 사용. 005 와 동일 스타일.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. reference_games 축 태깅 + L1 분석 컬럼
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE reference_games
  -- 선별 근거: revenue_top | editor_choice | award | indie_exemplar | commission_driven
  ADD COLUMN IF NOT EXISTS selection_basis TEXT,

  -- 이 게임이 강한 시장 배열 (KR/US/JP/CN 중 일부). country 는 수집 위치,
  -- target_markets 는 글로벌 영향 범위로 의미가 다름.
  ADD COLUMN IF NOT EXISTS target_markets TEXT[],

  -- 수익모델 분류값. f2p_ad | f2p_iap | subscription | premium | hybrid
  -- 기존 monetization JSONB (05 에서 추가) 는 raw hints, 이 컬럼은 분류 라벨.
  ADD COLUMN IF NOT EXISTS monetization_model TEXT,

  -- 스튜디오 규모. solo | indie | mid | aaa
  ADD COLUMN IF NOT EXISTS studio_size TEXT,

  -- L1 아이콘 Vision 분석
  ADD COLUMN IF NOT EXISTS icon_analysis JSONB,
  ADD COLUMN IF NOT EXISTS icon_analyzed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS icon_analysis_cost_usd DECIMAL(10,6),

  -- L1 텍스트(제목·설명) 분석 (Vision 없음)
  ADD COLUMN IF NOT EXISTS text_analysis JSONB,
  ADD COLUMN IF NOT EXISTS text_analyzed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS text_analysis_cost_usd DECIMAL(10,6);

-- 축 태깅 조회·합성 성능
CREATE INDEX IF NOT EXISTS idx_reference_games_monetization
  ON reference_games(monetization_model);
CREATE INDEX IF NOT EXISTS idx_reference_games_studio_size
  ON reference_games(studio_size);
CREATE INDEX IF NOT EXISTS idx_reference_games_selection_basis
  ON reference_games(selection_basis);
CREATE INDEX IF NOT EXISTS idx_reference_games_target_markets
  ON reference_games USING GIN (target_markets);

-- ─────────────────────────────────────────────────────────────────────
-- 2. library_patterns 테이블 — 축 조합별 패턴 + 인사이트
--
-- axis_key 형식: "genre=<g>;market=<m>;monetization=<mo>;studio_size=<s>"
--   - 축이 '조건 무시' 일 때는 해당 자리에 '*' 사용
--   - 예: "genre=puzzle;market=kr;monetization=*;studio_size=*" (Tier A)
--   - 의뢰 조회 시 가장 구체적 → 상위 조합으로 fallback
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS library_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 정규화된 축 조합 키 (UNIQUE). 조회 fallback 의 기준.
  axis_key TEXT NOT NULL,

  -- 개별 축 값 (조회·필터용). NULL = 해당 축 무시.
  genre TEXT NOT NULL,
  market TEXT,
  monetization_model TEXT,
  studio_size TEXT,

  -- 관찰 집계 + 인사이트를 함께 담는 JSONB.
  -- 스키마: docs/12-library-analysis-design.md §5.3
  --   집계: icon, title_subtitle, screenshots, description, video, monetization_alignment 등
  --   인사이트: decision_rules, edge_cases_and_exceptions, anti_patterns_observed,
  --             cross_axis_interactions, commission_derived_insights
  patterns JSONB NOT NULL,

  -- 이 패턴 합성에 사용된 reference_games UUID 배열
  sample_game_ids UUID[] NOT NULL,
  sample_size INT NOT NULL CHECK (sample_size >= 2),

  -- high (n>=8) | medium (n>=4) | low (n>=2)
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),

  synthesized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synthesis_cost_usd DECIMAL(10,6),
  model_used TEXT,

  -- commission_derived_insights 누적 카운트 — 일정 수 도달 시 재합성 트리거
  pending_commission_insights INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- axis_key UNIQUE — 조건부 추가 (ADD CONSTRAINT IF NOT EXISTS 미지원)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'library_patterns_axis_key_unique'
  ) THEN
    ALTER TABLE library_patterns
      ADD CONSTRAINT library_patterns_axis_key_unique UNIQUE (axis_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_library_patterns_genre
  ON library_patterns(genre);
CREATE INDEX IF NOT EXISTS idx_library_patterns_market
  ON library_patterns(market);
CREATE INDEX IF NOT EXISTS idx_library_patterns_monetization
  ON library_patterns(monetization_model);
CREATE INDEX IF NOT EXISTS idx_library_patterns_studio
  ON library_patterns(studio_size);
CREATE INDEX IF NOT EXISTS idx_library_patterns_pending_insights
  ON library_patterns(pending_commission_insights)
  WHERE pending_commission_insights > 0;

-- updated_at 자동 갱신 (003 의 update_updated_at_column() 재사용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_library_patterns_updated_at'
  ) THEN
    CREATE TRIGGER update_library_patterns_updated_at
      BEFORE UPDATE ON library_patterns
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. RLS 정책 (003 style — 공개 읽기, 관리자 쓰기)
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE library_patterns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'library_patterns' AND policyname = 'Anyone reads library patterns'
  ) THEN
    CREATE POLICY "Anyone reads library patterns"
      ON library_patterns FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'library_patterns' AND policyname = 'Admins write library patterns'
  ) THEN
    CREATE POLICY "Admins write library patterns"
      ON library_patterns FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE auth_user_id = auth.uid() AND is_active = TRUE
        )
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. 컬럼 주석 (DB 문서화)
-- ─────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN reference_games.selection_basis IS
  'revenue_top | editor_choice | award | indie_exemplar | commission_driven';
COMMENT ON COLUMN reference_games.target_markets IS
  '이 게임이 강한 시장 배열 (kr/us/jp/cn). country 는 수집 위치.';
COMMENT ON COLUMN reference_games.monetization_model IS
  'f2p_ad | f2p_iap | subscription | premium | hybrid';
COMMENT ON COLUMN reference_games.studio_size IS
  'solo | indie | mid | aaa';

COMMENT ON COLUMN library_patterns.axis_key IS
  '"genre=<g>;market=<m>;monetization=<mo>;studio_size=<s>" 형식. 축 무시는 *.';
COMMENT ON COLUMN library_patterns.patterns IS
  '관찰 집계 + 인사이트(decision_rules·edge_cases·anti_patterns·cross_axis·commission_derived). 스키마는 docs/12-library-analysis-design.md §5.3';
COMMENT ON COLUMN library_patterns.pending_commission_insights IS
  'commission_derived_insights 누적 카운트. 일정 수 도달 시 재합성으로 정식 규칙 승격';
