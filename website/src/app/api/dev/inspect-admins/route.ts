import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_users")
    .select("email, is_active, created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: data?.length ?? 0, admins: data ?? [] });
}
