"use server";

import { revalidatePath } from "next/cache";

import { deleteResource, saveResource } from "@/lib/services/resource-service";
import type { PublishStatus, ResourceAudience } from "@/lib/types";

export async function saveResourceAction(formData: FormData) {
  await saveResource({
    id: String(formData.get("id") ?? "").trim() || undefined,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    filePath: String(formData.get("filePath") ?? "").trim(),
    resourceType: String(formData.get("resourceType") ?? "").trim(),
    audienceType: String(formData.get("audienceType") ?? "all_partners") as ResourceAudience,
    status: String(formData.get("status") ?? "draft") as PublishStatus,
    sortOrder: Number(String(formData.get("sortOrder") ?? "0"))
  });

  revalidatePath("/admin/resources");
  revalidatePath("/admin/resource-permissions");
  revalidatePath("/partner/resources");
  revalidatePath("/partner");
}

export async function deleteResourceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await deleteResource(id);
  revalidatePath("/admin/resources");
  revalidatePath("/admin/resource-permissions");
  revalidatePath("/partner/resources");
  revalidatePath("/partner");
}
