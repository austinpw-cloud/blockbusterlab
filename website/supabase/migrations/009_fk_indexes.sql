-- ============================================================
-- Migration 009 — FK 인덱스 보강
--
-- 배경:
--   다음 3개 FK 컬럼이 인덱스 미적용 — 조인/필터 시 풀스캔 위험.
--   주문/리비전 볼륨이 늘어나면 운영 단계에서 쿼리 perf cliff.
--
--   1) orders.assigned_editor_id     → admin_users(id)
--   2) deliverables.approved_by      → admin_users(id)
--   3) revision_requests.requested_by → customers(id)
--
-- 적용 시점: 2026-05-01
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_assigned_editor_id
  ON orders (assigned_editor_id);

CREATE INDEX IF NOT EXISTS idx_deliverables_approved_by
  ON deliverables (approved_by);

CREATE INDEX IF NOT EXISTS idx_revision_requests_requested_by
  ON revision_requests (requested_by);
