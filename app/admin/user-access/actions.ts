"use server";

import { revalidatePath } from "next/cache";

import {
  createAdminUser,
  deleteAdminUser,
  resetAdminUserPassword,
  updateAdminUserEmail
} from "@/lib/services/admin-user-service";

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

export async function updateAdminUserEmailAction(
  _: UserAccessActionState,
  formData: FormData
): Promise<UserAccessActionState> {
  try {
    const id = String(formData.get("id") ?? "");
    const email = String(formData.get("email") ?? "").trim();

    if (!id || !email) {
      return { error: "User and email are required." };
    }

    await updateAdminUserEmail(id, email);
    revalidatePath("/admin/user-access");
    return { message: "User email updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update user email." };
  }
}

export async function resetAdminUserPasswordAction(
  _: UserAccessActionState,
  formData: FormData
): Promise<UserAccessActionState> {
  try {
    const id = String(formData.get("id") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!id || password.length < 8) {
      return { error: "Enter a new password with at least 8 characters." };
    }

    await resetAdminUserPassword(id, password);
    revalidatePath("/admin/user-access");
    return { message: "User password reset." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to reset password." };
  }
}
