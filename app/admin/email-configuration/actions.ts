"use server";

import { revalidatePath } from "next/cache";

import { requireAdminRole } from "@/lib/auth/require-admin";
import { saveEmailConfiguration } from "@/lib/email/email-config";
import { sendAdminTestEmail, verifySmtpConnection } from "@/lib/email/smtp-service";

type ActionState = { message?: string; error?: string } | undefined;

export async function saveEmailConfigurationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const result = await saveEmailConfiguration(formData);

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/admin/email-configuration");
  return { message: "Email configuration saved." };
}

export async function testSmtpConnectionAction(_: ActionState, _formData: FormData): Promise<ActionState> {
  await requireAdminRole(["super_admin", "admin"]);
  const result = await verifySmtpConnection();
  revalidatePath("/admin/email-configuration");
  return result.ok ? { message: result.message } : { error: result.error };
}

export async function sendTestEmailAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminRole(["super_admin", "admin"]);
  const to = String(formData.get("testRecipient") ?? "").trim();
  const result = await sendAdminTestEmail(to || undefined);
  revalidatePath("/admin/email-configuration");
  return result.ok ? { message: "Test email sent." } : { error: result.error };
}
