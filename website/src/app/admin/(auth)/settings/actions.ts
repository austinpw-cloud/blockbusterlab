"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/auth/admin";

const ROLES = ["publisher", "editor", "operator"] as const;
type Role = (typeof ROLES)[number];

function isRole(v: string): v is Role {
  return (ROLES as readonly string[]).includes(v);
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function addAdmin(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const me = await getCurrentAdmin();
  if (!me) return { ok: false, error: "권한 없음" };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const name = (formData.get("name") as string)?.trim();
  const role = formData.get("role") as string;

  if (!email || !isValidEmail(email)) return { ok: false, error: "이메일 형식 오류" };
  if (!name) return { ok: false, error: "이름 필수" };
  if (!isRole(role)) return { ok: false, error: "역할 오류" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("admin_users")
    .insert({ email, name, role, is_active: true });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "이미 등록된 이메일" };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function updateAdminRole(
  id: string,
  role: string
): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentAdmin();
  if (!me) return { ok: false, error: "권한 없음" };
  if (!isRole(role)) return { ok: false, error: "역할 오류" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("admin_users")
    .update({ role })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function toggleAdminActive(
  id: string,
  is_active: boolean
): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentAdmin();
  if (!me) return { ok: false, error: "권한 없음" };

  // 본인 비활성화 방지
  if (id === me.id && !is_active) {
    return { ok: false, error: "자기 자신은 비활성화 불가" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("admin_users")
    .update({ is_active })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function deleteAdmin(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentAdmin();
  if (!me) return { ok: false, error: "권한 없음" };

  // 본인 삭제 방지
  if (id === me.id) {
    return { ok: false, error: "자기 자신은 삭제 불가" };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("admin_users").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings");
  return { ok: true };
}
