"use server";

import { revalidatePath } from "next/cache";

import { createAdminUser, deleteAdminUser } from "@/lib/services/admin-user-service";

export type UserAccessActionState = { message?: string; error?: string } | undefined;

export async function createAdminUserAction(
  _: UserAccessActionState,
  formData: FormData
): Promise<UserAccessActionState> {
  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    await createAdminUser({
      email,
      password,
      fullName: String(formData.get("fullName") ?? "").trim(),
      roleId: String(formData.get("roleId") ?? "")
    });

    revalidatePath("/admin/user-access");
    return { message: `${email} created.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create admin user." };
  }
}

export async function deleteAdminUserAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await deleteAdminUser(id);
  revalidatePath("/admin/user-access");
}
