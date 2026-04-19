import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/lib/types";
import type { aiImportRequestSchema } from "@/lib/validations";
import type { z } from "zod";

type AiImportRequestInput = z.infer<typeof aiImportRequestSchema>;

export async function createImportBatch(
  input: AiImportRequestInput
): Promise<ServiceResult<{ id: string; batch_name: string; status: string }>> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("import_batches")
    .insert({
      batch_name: input.batchName,
      source_type: input.sourceType,
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
