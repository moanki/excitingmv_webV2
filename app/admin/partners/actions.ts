"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createPartnerRegistration, updatePartnerRequestStatus } from "@/lib/services/partner-service";
import { partnerRegistrationSchema } from "@/lib/validations";
import type { PartnerStatus } from "@/lib/types";

export async function updatePartnerStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "pending") as PartnerStatus;
  const notes = String(formData.get("notes") ?? "");

  if (!id) {
    return;
  }

  await updatePartnerRequestStatus(id, status, notes);
  revalidatePath("/admin/partners");
}

export async function createPartnerAction(formData: FormData) {
  await requireAdmin();
  const parsed = partnerRegistrationSchema.safeParse({
    agencyName: String(formData.get("agencyName") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    market: String(formData.get("market") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined
  });

  if (!parsed.success) return;

  await createPartnerRegistration(parsed.data);
  revalidatePath("/admin/partners");
}
