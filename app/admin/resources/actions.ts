"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { deleteResource, saveResource } from "@/lib/services/resource-service";
import type { PublishStatus, ResourceAudience } from "@/lib/types";

type ResourceActionState = { message?: string; error?: string } | undefined;

function revalidateResources() {
  ["/admin/resources", "/admin/resource-permissions", "/partner/resources", "/partner"].forEach((path) => revalidatePath(path));
}

export async function saveResourceAction(_: ResourceActionState, formData: FormData): Promise<ResourceActionState> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") ?? "").trim() || undefined;
    const title = String(formData.get("title") ?? "").trim();
    const filePath = String(formData.get("filePath") || formData.get("filePathManual") || "").trim();
    if (!title || !filePath) return { error: "Resource name and file are required." };

    await saveResource({
      id,
      title,
      filePath,
      description: String(formData.get("description") ?? "").trim(),
      resourceType: String(formData.get("resourceType") ?? "").trim(),
      audienceType: String(formData.get("audienceType") ?? "all_partners") as ResourceAudience,
      status: String(formData.get("status") ?? "draft") as PublishStatus,
      sortOrder: Number(String(formData.get("sortOrder") ?? "0"))
    });
    revalidateResources();
    return { message: `Resource ${id ? "updated" : "added"} successfully.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save resource." };
  }
}

export async function deleteResourceAction(_: ResourceActionState, formData: FormData): Promise<ResourceActionState> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "Resource ID is required." };
    if (id.startsWith("sample-")) return { error: "Sample resources cannot be deleted." };
    await deleteResource(id);
    revalidateResources();
    return { message: "Resource deleted successfully." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete resource." };
  }
}
