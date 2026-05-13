"use server";

import { revalidatePath, revalidateTag } from "next/cache";

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
  revalidateTag("resorts-public");
}

export async function createImportBatchAction(_: ImportActionState, formData: FormData): Promise<ImportActionState> {
  const result = await createImportBatch({
    googleDriveUrl: String(formData.get("googleDriveUrl") ?? ""),
    propertyType: normalizePropertyType(formData.get("propertyType"))
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin/imports");
  revalidateImportTargets();
  return { ok: true, message: result.data.message, result: result.data };
}

export async function createImportUploadAction(_: ImportActionState, formData: FormData): Promise<ImportActionState> {
  const upload = formData.get("factSheetFile");
  const result = await importUploadedFactSheet(
    upload instanceof File ? upload : new File([], ""),
    normalizePropertyType(formData.get("propertyType"))
  );

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin/imports");
  revalidateImportTargets();
  return { ok: true, message: result.data.message, result: result.data };
}
