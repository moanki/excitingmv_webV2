"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE,
  bootstrapAdmin
} from "@/lib/auth/bootstrap-admin";
import { authenticateAdminUser } from "@/lib/services/admin-user-service";

export async function loginToAdmin(_: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const isBootstrap =
    Boolean(bootstrapAdmin.email && bootstrapAdmin.password) &&
    email === bootstrapAdmin.email.toLowerCase() &&
    password === bootstrapAdmin.password;
  const isManagedAdmin = isBootstrap ? true : await authenticateAdminUser(email, password);

  if (!isManagedAdmin) {
    return {
      error: "Invalid admin credentials."
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutFromAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect(ADMIN_LOGIN_PATH);
}
