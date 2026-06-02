import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CurrentAdminUser = {
  userId: string;
  email: string;
  roles: string[];
};

export const ADMIN_ROLE_NAMES = ["super_admin", "admin", "content_manager"] as const;

function isAdminRole(role: string) {
  return ADMIN_ROLE_NAMES.includes(role as (typeof ADMIN_ROLE_NAMES)[number]);
}

export class AdminAuthError extends Error {
  status: 401 | 403;

  constructor(status: 401 | 403, message = status === 401 ? "Unauthorized." : "Forbidden.") {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

async function getRolesForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId)
    .returns<{ roles: { name: string } | null }[]>();

  if (error) {
    throw new AdminAuthError(403, "Forbidden.");
  }

  return (data ?? []).map((item) => item.roles?.name).filter((role): role is string => Boolean(role));
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getCurrentAdminUser(): Promise<CurrentAdminUser | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const roles = await getRolesForUser(user.id);

  if (!roles.some(isAdminRole)) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    roles
  };
}

export async function requireAdminRole(requiredRoles?: string[]) {
  const user = await getCurrentUser();

  if (!user) {
    throw new AdminAuthError(401, "Unauthorized.");
  }

  const roles = await getRolesForUser(user.id);

  const allowedRoles = requiredRoles?.length ? requiredRoles : [...ADMIN_ROLE_NAMES];

  if (!roles.some((role) => allowedRoles.includes(role))) {
    throw new AdminAuthError(403, "Forbidden.");
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    roles
  };
}

export async function requireAdmin() {
  return requireAdminRole();
}

export function adminAuthJsonError(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }

  return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
}

export async function requireAdminJson(requiredRoles?: string[]) {
  try {
    return { ok: true as const, admin: await requireAdminRole(requiredRoles) };
  } catch (error) {
    return { ok: false as const, response: adminAuthJsonError(error) };
  }
}
