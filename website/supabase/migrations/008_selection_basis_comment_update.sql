-- ============================================================
-- Migration 008 — selection_basis 컬럼 주석 최신화
--
-- 배경:
--   Migration 006 의 `selection_basis` 주석에는 `editor_choice | award` 가
--   선택지로 기록되어 있으나, v2.5 이후 설계 철학상 제거됨
--   (수상·에디터스 초이스는 게임 품질 프록시이지 ASO 프록시 아님).
--   실제 코드 (tag-game.ts `SelectionBasis` 타입) 에서도 두 값은 제거됨.
--
--   Migration 파일 자체는 히스토리라 수정 불가이므로, 본 migration 에서
--   `COMMENT ON COLUMN` 으로 최신 선택지를 덮어씀. 운영자가 DB 주석만
--   보고 혼선을 빚지 않도록.
--
-- 적용 시점: 2026-04-14
-- 관련 문서: docs/12-library-analysis-design.md §11, §v2.5~v2.7 changelog
-- ============================================================

COMMENT ON COLUMN reference_games.selection_basis IS
  '큐레이션·수집 근거. 유효 값 (v2.5 이후): revenue_top | indie_exemplar | commission_driven | case_study | keyword_search. '
  'v2.5 이전 존재하던 editor_choice·award 는 제거됨 — 수상·에디터스 초이스는 게임 품질 프록시이지 ASO 프록시 아님';
