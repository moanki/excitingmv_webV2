"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE
} from "@/lib/auth/bootstrap-admin";
import { ADMIN_ROLE_NAMES } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function userHasAdminRole(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId)
    .returns<{ roles: { name: string } | null }[]>();

  if (error) {
    console.error("Admin role lookup failed", { userId, error });
    return false;
  }

  return Boolean(data?.some((item) => item.roles?.name && ADMIN_ROLE_NAMES.includes(item.roles.name as (typeof ADMIN_ROLE_NAMES)[number])));
}

export async function loginToAdmin(_: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const supabase = await createSupabaseServerClient();
  const signIn = await supabase.auth.signInWithPassword({ email, password });

  if (signIn.error || !signIn.data.user) {
    return {
      error: "Invalid admin credentials."
    };
  }

  const isAdmin = await userHasAdminRole(signIn.data.user.id);

  if (!isAdmin) {
    await supabase.auth.signOut();
    return {
      error: "Admin access is not enabled for this account."
    };
  }

  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutFromAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect(ADMIN_LOGIN_PATH);
}
