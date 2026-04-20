"use server";

import { revalidatePath } from "next/cache";

import { createImportBatch } from "@/lib/services/import-service";

export async function createImportBatchAction(formData: FormData) {
  await createImportBatch({
    batchName: String(formData.get("batchName") ?? ""),
    sourceType: String(formData.get("sourceType") ?? "folder") as "pdf" | "zip" | "folder" | "manual",
    googleDriveUrl: String(formData.get("googleDriveUrl") ?? ""),
    notes: String(formData.get("notes") ?? "")
  });

  revalidatePath("/admin/imports");
}
