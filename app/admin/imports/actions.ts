"use server";

import { revalidatePath } from "next/cache";

import {
  createImportBatch,
  importUploadedFactSheet,
  type ImportExecutionResult
} from "@/lib/services/import-service";

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

export async function createImportBatchAction(_: ImportActionState, formData: FormData): Promise<ImportActionState> {
  const result = await createImportBatch({
    googleDriveUrl: String(formData.get("googleDriveUrl") ?? "")
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin/imports");
  revalidatePath("/admin/resorts");
  revalidatePath("/resorts");
  revalidatePath("/");
  return { ok: true, message: result.data.message, result: result.data };
}

export async function createImportUploadAction(_: ImportActionState, formData: FormData): Promise<ImportActionState> {
  const upload = formData.get("factSheetFile");
  const result = await importUploadedFactSheet(upload instanceof File ? upload : new File([], ""));

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin/imports");
  revalidatePath("/admin/resorts");
  revalidatePath("/resorts");
  revalidatePath("/");
  return { ok: true, message: result.data.message, result: result.data };
}
