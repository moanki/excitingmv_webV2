import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/lib/types";
import { aiImportRequestSchema } from "@/lib/validations";
import type { z } from "zod";

type AiImportRequestInput = z.infer<typeof aiImportRequestSchema>;

export type ImportBatchRecord = {
  id: string;
  batchName: string;
  sourceType: string;
  sourcePath: string;
  status: string;
  createdAt: string;
};

type ImportRow = {
  id: string;
  batch_name: string;
  source_type: string;
  file_path: string | null;
  status: string;
  created_at: string;
};

export async function createImportBatch(
  input: AiImportRequestInput
): Promise<ServiceResult<{ id: string; batch_name: string; status: string }>> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("import_batches")
    .insert({
      batch_name: input.batchName,
      source_type: input.sourceType,
      file_path: input.googleDriveUrl || null,
      status: "uploaded"
    })
    .select("id, batch_name, status")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: "Failed to create import batch.",
      status: 500,
      details: error
    };
  }

  return {
    ok: true,
    data
  };
}

export async function listImportBatches() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("import_batches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ImportRow[]).map((row) => ({
      id: row.id,
      batchName: row.batch_name,
      sourceType: row.source_type,
      sourcePath: row.file_path ?? "",
      status: row.status,
      createdAt: row.created_at
    }));
  } catch {
    return [];
  }
}
