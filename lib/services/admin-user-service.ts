import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminRoleRecord = {
  id: string;
  name: string;
  description: string;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
};

export async function listRoles() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("roles").select("*").order("name");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as { id: string; name: string; description: string | null }[]).map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description ?? ""
    }));
  } catch {
    return [
      {
        id: "super-admin",
        name: "super_admin",
        description: "Full access across the platform."
      },
      {
        id: "admin",
        name: "admin",
        description: "Operational content and partner management access."
      },
      {
        id: "content-manager",
        name: "content_manager",
        description: "Content, resort, and import workflow access."
      }
    ];
  }
}

export async function listAdminUsers() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: profiles, error: profileError } = await supabase.from("profiles").select("*");

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { data: userRoles, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id, roles(name)")
      .returns<{ user_id: string; roles: { name: string } | null }[]>();

    if (roleError) {
      throw new Error(roleError.message);
    }

    return ((profiles ?? []) as { id: string; email: string | null; full_name: string | null }[]).map((profile) => ({
      id: profile.id,
      email: profile.email ?? "",
      fullName: profile.full_name ?? "",
      roles: (userRoles ?? [])
        .filter((item) => item.user_id === profile.id && item.roles?.name)
        .map((item) => item.roles?.name ?? "")
    }));
  } catch {
    return [];
  }
}

export async function createAdminUser(input: {
  email: string;
  password: string;
  fullName: string;
  roleId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const created = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Failed to create admin user.");
  }

  const userId = created.data.user.id;

  await supabase.from("profiles").upsert({
    id: userId,
    email: input.email,
    full_name: input.fullName
  });

  await supabase.from("user_roles").delete().eq("user_id", userId);
  await supabase.from("user_roles").insert({
    user_id: userId,
    role_id: input.roleId
  });
}

export async function deleteAdminUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.auth.admin.deleteUser(userId);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function authenticateAdminUser(email: string, password: string) {
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.user) {
    return false;
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", signIn.data.user.id)
    .returns<{ roles: { name: string } | null }[]>();

  return Boolean(data?.some((item) => item.roles?.name));
}
