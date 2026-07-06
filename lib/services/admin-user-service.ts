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

const defaultRoles: Array<Omit<AdminRoleRecord, "id">> = [
  {
    name: "super_admin",
    description: "Full access across the platform."
  },
  {
    name: "admin",
    description: "Operational content and partner management access."
  },
  {
    name: "content_manager",
    description: "Content, resort, and import workflow access."
  }
];

async function ensureDefaultRoles() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("roles")
    .upsert(defaultRoles, { onConflict: "name" })
    .select("id,name,description")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as { id: string; name: string; description: string | null }[]).map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description ?? ""
  }));
}

export async function listRoles() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("roles").select("id,name,description").order("name");

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.length) {
      return ensureDefaultRoles();
    }

    return (data as { id: string; name: string; description: string | null }[]).map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description ?? ""
    }));
  } catch {
    return [];
  }
}

export async function listAdminUsers() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: profiles, error: profileError } = await supabase.from("profiles").select("id,email,full_name");

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
  const roles = await listRoles();
  const roleId = roles.some((role) => role.id === input.roleId)
    ? input.roleId
    : roles.find((role) => role.name === "admin")?.id;

  if (!roleId) {
    throw new Error("No admin roles are available. Open Roles once to initialize defaults, then try again.");
  }

  const created = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Failed to create admin user.");
  }

  const userId = created.data.user.id;

  const profile = await supabase.from("profiles").upsert({
    id: userId,
    email: input.email,
    full_name: input.fullName
  });

  if (profile.error) {
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(profile.error.message);
  }

  await supabase.from("user_roles").delete().eq("user_id", userId);
  const assignedRole = await supabase.from("user_roles").insert({
    user_id: userId,
    role_id: roleId
  });

  if (assignedRole.error) {
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(assignedRole.error.message);
  }
}

export async function deleteAdminUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.auth.admin.deleteUser(userId);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function updateAdminUserEmail(userId: string, email: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.auth.admin.updateUserById(userId, { email, email_confirm: true });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const { error } = await supabase.from("profiles").update({ email }).eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function resetAdminUserPassword(userId: string, password: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.auth.admin.updateUserById(userId, { password });

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function authenticateAdminUser(email: string, password: string) {
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
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
