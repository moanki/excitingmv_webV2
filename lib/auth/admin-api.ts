import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE } from "@/lib/auth/bootstrap-admin";

export async function requireAdminApiSession() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!adminSession) {
    return {
      ok: false as const,
      response: Response.json({ ok: false, error: "Admin authentication required." }, { status: 401 })
    };
  }

  return { ok: true as const, adminEmail: adminSession };
}
