-- ============================================================
-- Migration 007 — Apple App Store URL 컬럼 추가 (Q2: 양 스토어 분기 대응)
--
-- 배경:
--   Phase 1 초기 단계는 Google Play 전용이었으나, 문서 스펙과 AsoResult 는
--   이미 Apple/Google 양쪽 결과물 (`store_specific.apple_app_store`) 을 지원.
--   실제 입력·스크랩 경로도 양 스토어 분기로 확장.
--
-- 변경:
--   - orders 테이블에 `store_url_apple` TEXT 컬럼 추가 (nullable)
--     기존 `store_url_android` 는 Google Play URL 을 담음 (레거시 네이밍 유지).
--
--   - 이후 단계에서 Apple trackId 를 별도 컬럼으로 분리할 수도 있으나 (scraper 효율),
--     지금은 URL 한 컬럼만. 필요 시 migration 008 에서 normalize.
--
-- 주의:
--   - 기존 행은 NULL 로 시작. 검증 로직상 "둘 다 있어도 OK, 둘 다 없어도 파일 업로드로 대체" 규칙.
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS store_url_apple TEXT;

COMMENT ON COLUMN orders.store_url_android IS
  'Google Play 스토어 URL (레거시 네이밍 — android 이지만 실제로는 Google Play 전용)';
COMMENT ON COLUMN orders.store_url_apple IS
  'Apple App Store URL (2026-04-14 Q2 추가). iTunes Lookup API 로 메타데이터 수집';
