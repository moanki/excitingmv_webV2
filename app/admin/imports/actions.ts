"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdminRole } from "@/lib/auth/require-admin";
import {
  createImportBatch,
  importUploadedFactSheet,
  type ImportExecutionResult
} from "@/lib/services/import-service";
import { normalizePropertyType } from "@/lib/services/resort-service";

export type ImportActionState =
  | {
      ok: true;
      message: string;
      result: ImportExecutionResult;
    }
  | {
      ok: false;
      error: string;
      result?: ImportExecutionResult;
    }
  | undefined;

function revalidateImportTargets() {
  revalidatePath("/admin/resorts");
  revalidatePath("/admin/liveaboards");
  revalidatePath("/admin/hotels");
  revalidatePath("/resorts");
  revalidatePath("/liveaboards");
  revalidatePath("/hotels");
  revalidatePath("/");
  revalidateTag("resorts-public", "max");
}

export async function createImportBatchAction(_: ImportActionState, formData: FormData): Promise<ImportActionState> {
  await requireAdminRole(["super_admin", "admin", "content_manager"]);
  const result = await createImportBatch({
    googleDriveUrl: String(formData.get("googleDriveUrl") ?? ""),
    propertyType: normalizePropertyType(formData.get("propertyType"))
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  if (result.data.errorCount > 0) {
    const error = [...result.data.logs].reverse().find((entry) => entry.status === "error")?.message;
    return { ok: false, error: error || "PDF import failed.", result: result.data };
  }

  revalidatePath("/admin/imports");
  revalidateImportTargets();
  return { ok: true, message: result.data.message, result: result.data };
}

export async function createImportUploadAction(_: ImportActionState, formData: FormData): Promise<ImportActionState> {
  await requireAdminRole(["super_admin", "admin", "content_manager"]);
  const upload = formData.get("factSheetFile");
  const result = await importUploadedFactSheet(
    upload instanceof File ? upload : new File([], ""),
    normalizePropertyType(formData.get("propertyType"))
  );

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  if (result.data.errorCount > 0) {
    const error = [...result.data.logs].reverse().find((entry) => entry.status === "error")?.message;
    return { ok: false, error: error || "PDF import failed.", result: result.data };
  }

  revalidatePath("/admin/imports");
  revalidateImportTargets();
  return { ok: true, message: result.data.message, result: result.data };
}
