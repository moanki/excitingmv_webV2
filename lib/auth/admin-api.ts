import { requireAdminJson } from "@/lib/auth/require-admin";

export async function requireAdminApiSession() {
  const result = await requireAdminJson();

  if (!result.ok) {
    return {
      ok: false as const,
      response: result.response
    };
  }

  return { ok: true as const, adminEmail: result.admin.email, admin: result.admin };
}
