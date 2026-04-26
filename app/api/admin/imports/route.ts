import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import {
  finalizeDriveImportBatch,
  importStoredFactSheet,
  importUploadedFactSheet,
  publishImportCheckpoint,
  processDriveImportSource,
  startDriveImportBatch,
  type ImportLogEntry
} from "@/lib/services/import-service";
import { SITE_ASSET_BUCKET } from "@/lib/storage/site-assets";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { aiImportRequestSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const maxDuration = 300;

function slugFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const upload = formData.get("factSheetFile");
    const result = await importUploadedFactSheet(upload instanceof File ? upload : new File([], ""));

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
      message: result.data.message,
      data: result.data
    });
  }

  const json = await request.json().catch(() => null);
  const mode = typeof json?.mode === "string" ? json.mode : "start";

  if (mode === "start") {
    const parsed = aiImportRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid import request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await startDriveImportBatch(parsed.data);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, details: result.details },
        { status: result.status ?? 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: result.data.message,
      data: result.data
    });
  }

  if (mode === "upload-url") {
    if (!json?.sourceUrl || !json?.filename) {
      return NextResponse.json({ ok: false, error: "Invalid uploaded PDF request." }, { status: 400 });
    }

    const result = await importStoredFactSheet({
      sourceUrl: String(json.sourceUrl),
      filename: String(json.filename)
    });

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
      message: result.data.message,
      data: result.data
    });
  }

  if (mode === "create-upload-url") {
    const filename = String(json?.filename ?? "").trim();
    const contentType = String(json?.contentType ?? "").trim() || "application/pdf";

    if (!filename) {
      return NextResponse.json({ ok: false, error: "Filename is required." }, { status: 400 });
    }

    const safeName = slugFilename(filename) || "fact-sheet.pdf";
    const storagePath = `imports/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const supabase = createSupabaseAdminClient();
    const signed = await supabase.storage.from(SITE_ASSET_BUCKET).createSignedUploadUrl(storagePath, {
      upsert: true
    });

    if (signed.error || !signed.data) {
      return NextResponse.json(
        { ok: false, error: signed.error?.message ?? "Failed to create upload URL." },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage.from(SITE_ASSET_BUCKET).getPublicUrl(storagePath);

    return NextResponse.json({
      ok: true,
      data: {
        bucket: SITE_ASSET_BUCKET,
        path: storagePath,
        token: signed.data.token,
        signedUrl: signed.data.signedUrl,
        publicUrl: publicUrlData.publicUrl,
        contentType
      }
    });
  }

  if (mode === "process") {
    if (!json?.batchId || !json?.sourceUrl || typeof json?.sourceIndex !== "number") {
      return NextResponse.json({ ok: false, error: "Invalid import processing request." }, { status: 400 });
    }

    const result = await processDriveImportSource({
      batchId: String(json.batchId),
      sourceUrl: String(json.sourceUrl),
      sourceIndex: Number(json.sourceIndex)
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, details: result.details },
        { status: result.status ?? 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: result.data
    });
  }

  if (mode === "finalize") {
    if (
      !json?.batchId ||
      typeof json?.totalSources !== "number" ||
      typeof json?.importedResorts !== "number" ||
      typeof json?.skippedSources !== "number" ||
      typeof json?.warningCount !== "number" ||
      typeof json?.errorCount !== "number" ||
      !Array.isArray(json?.providerUsages) ||
      !Array.isArray(json?.logs)
    ) {
      return NextResponse.json({ ok: false, error: "Invalid import finalization request." }, { status: 400 });
    }

    const result = await finalizeDriveImportBatch({
      batchId: String(json.batchId),
      totalSources: Number(json.totalSources),
      importedResorts: Number(json.importedResorts),
      skippedSources: Number(json.skippedSources),
      warningCount: Number(json.warningCount),
      errorCount: Number(json.errorCount),
      providerUsages: json.providerUsages.map((value: unknown) => String(value)),
      logs: json.logs as ImportLogEntry[]
    });

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
      message: result.data.message,
      data: result.data
    });
  }

  if (mode === "publish-checkpoint") {
    if (!json?.checkpointId || typeof json?.resortIndex !== "number") {
      return NextResponse.json({ ok: false, error: "Invalid checkpoint publish request." }, { status: 400 });
    }

    const result = await publishImportCheckpoint({
      checkpointId: String(json.checkpointId),
      resortIndex: Number(json.resortIndex)
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, details: result.details },
        { status: result.status ?? 500 }
      );
    }

    revalidatePath("/admin/imports");
    revalidatePath("/admin/resorts");
    revalidatePath("/resorts");
    revalidatePath(`/resorts/${result.data.slug}`);
    revalidatePath("/");
    revalidateTag("resorts-public");

    return NextResponse.json({
      ok: true,
      message: `${result.data.resortName} added to production.`,
      data: result.data
    });
  }

  return NextResponse.json({
    ok: false,
    error: "Unsupported import mode."
  }, { status: 400 });
}
