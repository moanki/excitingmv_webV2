"use server";

import { revalidatePath } from "next/cache";

import { createImportBatch } from "@/lib/services/import-service";

type ActionState = { message?: string; error?: string } | undefined;

export async function createImportBatchAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const result = await createImportBatch({
    googleDriveUrl: String(formData.get("googleDriveUrl") ?? "")
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/admin/imports");
  revalidatePath("/admin/resorts");
  revalidatePath("/resorts");
  revalidatePath("/");
  return { message: result.data.message };
}
