-- =====================================================================
-- 관리자 계정 초기 시드
-- auth_user_id는 첫 로그인 시 자동 연결됨 (email 기준 링크)
-- =====================================================================

INSERT INTO admin_users (email, name, role, is_active)
VALUES
  ('bbl@blockbusterlab.com', '블록버스터랩', 'publisher', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 나중에 추가할 계정 예시:
-- INSERT INTO admin_users (email, name, role, is_active) VALUES
--   ('jms@blockbusterlab.com', '정무식', 'publisher', TRUE),
--   ('lim@blockbusterlab.com', '임재청', 'editor', TRUE)
-- ON CONFLICT (email) DO NOTHING;
