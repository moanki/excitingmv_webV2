"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { updatePartnerRequestStatus } from "@/lib/services/partner-service";
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
