-- =====================================================================
-- Reference Library 확장 — 국가 차원 + 게임 단위 종합 분석 + 리뷰 요약
--
-- 배경 (2026-04-13):
--   1. Reference Library는 글로벌 ASO 서비스의 품질 기준 자산.
--      같은 앱이 한국·일본·미국 Top에 모두 있을 수 있고,
--      스크린샷·설명이 국가별로 현지화되므로 국가 차원 분리 필요.
--   2. 슬롯 단위 Vision 분석만으로는 "왜 Top인가"를 못 잡음.
--      게임 단위 종합 분석(aso_analysis)을 추가해 Stage 8 competitive_insight
--      축(positioning, core_hook, community_signals 등)을 영구 저장.
--   3. 리뷰 요약(reviews_summary)을 저장해 주문 처리 시 재수집 없이 참조.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. country 필드 추가 + 유니크 제약 변경
-- ─────────────────────────────────────────────────────────────────────

-- 기존 UNIQUE (app_id) 제약 제거 (이미 없으면 no-op)
ALTER TABLE reference_games
  DROP CONSTRAINT IF EXISTS reference_games_app_id_key;

-- country 필드 추가 (기본 'kr', 과거 데이터 보존)
ALTER TABLE reference_games
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'kr';

-- 같은 앱이 국가별로 별도 row 로 존재 가능.
-- PostgreSQL 은 ADD CONSTRAINT 에 IF NOT EXISTS 를 지원하지 않으므로
-- pg_constraint 조회로 조건부 추가.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reference_games_country_app_id_unique'
  ) THEN
    ALTER TABLE reference_games
      ADD CONSTRAINT reference_games_country_app_id_unique
      UNIQUE (country, app_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reference_games_country_genre
  ON reference_games(country, genre);

-- ─────────────────────────────────────────────────────────────────────
-- 2. 게임 단위 종합 ASO 분석 (Stage 8 competitive_insight 축 재사용)
--    {
--      positioning, owned_keywords, visual_language, gap_they_leave,
--      why_they_top, core_hook, emotional_appeal, community_signals,
--      monetization_model, retention_promise, icon_design_strategy,
--      screenshot_sequence_flow, description_hook,
--      overall_aso_strategy, first_three_hook_strategy,
--      success_factors, replicable_patterns, user_appeal
--    }
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE reference_games
  ADD COLUMN IF NOT EXISTS aso_analysis JSONB,
  ADD COLUMN IF NOT EXISTS aso_analysis_cost_usd DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS aso_analyzed_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────
-- 3. 리뷰 요약 저장
--    {
--      sample_count, rating_distribution, praise_themes, complaint_themes,
--      representative_quotes: [{ rating, text }]
--    }
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE reference_games
  ADD COLUMN IF NOT EXISTS reviews_summary JSONB,
  ADD COLUMN IF NOT EXISTS reviews_collected_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────
-- 4. 수익모델·홍보영상 힌트 (Top 게임 ASO 전략 이해에 중요)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE reference_games
  ADD COLUMN IF NOT EXISTS monetization JSONB,
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ─────────────────────────────────────────────────────────────────────
-- 5. 업데이트 추적 (분기별 refresh, 스크린샷 변경 감지)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE reference_games
  ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ;

ALTER TABLE reference_screenshots
  ADD COLUMN IF NOT EXISTS screenshot_hash TEXT;
