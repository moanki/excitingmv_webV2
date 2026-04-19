import { NextResponse } from "next/server";

import { createImportBatch } from "@/lib/services/import-service";
import { aiImportRequestSchema } from "@/lib/validations";

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

  return NextResponse.json({
    ok: true,
    message: "Import batch queued for review workflow.",
    data: result.data
  });
}
