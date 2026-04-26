"use server";

import { revalidatePath } from "next/cache";

import {
  deleteResourcePermission,
  disableResourcePermission,
  saveResourcePermission,
  type ResourcePermissionStatus
} from "@/lib/services/resource-permission-service";

export async function saveResourcePermissionAction(formData: FormData) {
  const resourceIds = formData.getAll("resourceIds").map((value) => String(value)).filter(Boolean);

  await saveResourcePermission({
    agentId: String(formData.get("agentId") ?? "").trim() || undefined,
    agencyName: String(formData.get("agencyName") ?? "").trim(),
    username: String(formData.get("username") ?? "").trim(),
    status: String(formData.get("status") ?? "active") as ResourcePermissionStatus,
    resourceIds
  });

  revalidatePath("/admin/resource-permissions");
  revalidatePath("/partner/resources");
}

export async function disableResourcePermissionAction(formData: FormData) {
  const agentId = String(formData.get("agentId") ?? "").trim();
  if (!agentId) {
    return;
  }

  await disableResourcePermission(agentId);
  revalidatePath("/admin/resource-permissions");
}

export async function deleteResourcePermissionAction(formData: FormData) {
  const agentId = String(formData.get("agentId") ?? "").trim();
  if (!agentId) {
    return;
  }

  await deleteResourcePermission(agentId);
  revalidatePath("/admin/resource-permissions");
  revalidatePath("/partner/resources");
}
