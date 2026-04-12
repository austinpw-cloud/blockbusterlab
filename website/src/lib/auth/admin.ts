/**
 * 관리자 인증 유틸리티.
 *
 * 흐름:
 *  1. Supabase Auth로 매직링크 로그인 → auth.users 생성
 *  2. 여기 헬퍼가 auth.uid() 있는지 체크 + admin_users 테이블 매칭 확인
 *  3. 매칭 시 admin_users.auth_user_id 자동 연결 (첫 로그인 시)
 *  4. 관리자 정보 반환
 *
 * 모든 Server Component / Route Handler에서 관리자 체크할 때 사용.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminProfile = {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  role: "publisher" | "editor" | "operator";
  is_active: boolean;
};

/**
 * 현재 로그인한 사용자가 관리자인지 확인.
 *
 * @returns AdminProfile | null
 *   - null: 로그인 안됨 OR 관리자 아님 OR 비활성
 */
export async function getCurrentAdmin(): Promise<AdminProfile | null> {
  const supabase = await createClient();

  // 1. 현재 세션 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const admin = createAdminClient();

  // 2. admin_users에서 이메일 매칭
  const { data: adminRow, error: adminError } = await admin
    .from("admin_users")
    .select("id, auth_user_id, email, name, role, is_active")
    .eq("email", user.email ?? "")
    .maybeSingle();

  if (adminError || !adminRow || !adminRow.is_active) return null;

  // 3. auth_user_id 미연결이면 최초 로그인 — 자동 연결
  if (!adminRow.auth_user_id) {
    await admin
      .from("admin_users")
      .update({ auth_user_id: user.id })
      .eq("id", adminRow.id);

    return { ...adminRow, auth_user_id: user.id };
  }

  // 4. auth_user_id가 다른 사용자 것이면 비정상 (이메일은 같지만 UUID 다른 경우)
  if (adminRow.auth_user_id !== user.id) {
    // 이메일 재사용 등. 보안상 거부.
    return null;
  }

  return adminRow as AdminProfile;
}

/**
 * 관리자가 아니면 throw — Route Handler에서 빠르게 가드하려고.
 */
export async function requireAdmin(): Promise<AdminProfile> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("Unauthorized: 관리자 권한이 필요합니다.");
  }
  return admin;
}
