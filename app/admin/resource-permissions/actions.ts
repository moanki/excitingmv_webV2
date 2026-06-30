"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  deleteResourcePermission,
  disableResourcePermission,
  enableResourcePermission,
  saveResourcePermission,
  type ResourcePermissionStatus
} from "@/lib/services/resource-permission-service";

type PermissionActionState = { message?: string; error?: string } | undefined;

function revalidatePermissions() {
  revalidatePath("/admin/resource-permissions");
  revalidatePath("/partner/resources");
}

export async function saveResourcePermissionAction(_: PermissionActionState, formData: FormData): Promise<PermissionActionState> {
  try {
    await requireAdmin();
    const agentId = String(formData.get("agentId") ?? "").trim() || undefined;
    const agencyName = String(formData.get("agencyName") ?? "").trim();
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    if (!agencyName || !username || (!agentId && !password)) return { error: "Agency, username, and password are required." };

    await saveResourcePermission({
      agentId,
      agencyName,
      username,
      password,
      status: String(formData.get("status") ?? "active") as ResourcePermissionStatus,
      resourceIds: formData.getAll("resourceIds").map(String).filter(Boolean)
    });
    revalidatePermissions();
    return { message: `Permission ${agentId ? "saved" : "created"} successfully.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save permission." };
  }
}

async function changePermission(
  formData: FormData,
  operation: (agentId: string) => Promise<void>,
  message: string
): Promise<PermissionActionState> {
  try {
    await requireAdmin();
    const agentId = String(formData.get("agentId") ?? "").trim();
    if (!agentId) return { error: "Permission ID is required." };
    await operation(agentId);
    revalidatePermissions();
    return { message };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update permission." };
  }
}

export async function disableResourcePermissionAction(_: PermissionActionState, formData: FormData) {
  return changePermission(formData, disableResourcePermission, "Permission disabled successfully.");
}

export async function enableResourcePermissionAction(_: PermissionActionState, formData: FormData) {
  return changePermission(formData, enableResourcePermission, "Permission enabled successfully.");
}

export async function deleteResourcePermissionAction(_: PermissionActionState, formData: FormData) {
  return changePermission(formData, deleteResourcePermission, "Permission deleted successfully.");
}
