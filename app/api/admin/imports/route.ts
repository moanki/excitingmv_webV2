import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { createImportBatch } from "@/lib/services/import-service";
import { aiImportRequestSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = aiImportRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid import request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createImportBatch(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, details: result.details },
      { status: result.status ?? 500 }
    );
  }

  revalidatePath("/admin/imports");
  revalidatePath("/admin/resorts");
  revalidatePath("/resorts");
  revalidatePath("/");
  revalidateTag("resorts-public");

  return NextResponse.json({
    ok: true,
    message: "Import batch queued for review workflow.",
    data: result.data
  });
}
