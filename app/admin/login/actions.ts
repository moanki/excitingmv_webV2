"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE,
  bootstrapAdmin
} from "@/lib/auth/bootstrap-admin";

export async function loginToAdmin(_: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (
    email !== bootstrapAdmin.email.toLowerCase() ||
    password !== bootstrapAdmin.password
  ) {
    return {
      error: "Invalid admin credentials."
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "superadmin", {
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
