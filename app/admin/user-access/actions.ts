"use server";

import { revalidatePath } from "next/cache";

import { createAdminUser, deleteAdminUser } from "@/lib/services/admin-user-service";

export async function createAdminUserAction(formData: FormData) {
  await createAdminUser({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    fullName: String(formData.get("fullName") ?? "").trim(),
    roleId: String(formData.get("roleId") ?? "")
  });

  revalidatePath("/admin/user-access");
}

export async function deleteAdminUserAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await deleteAdminUser(id);
  revalidatePath("/admin/user-access");
}
