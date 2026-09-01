import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdminJson } from "@/lib/auth/require-admin";
import {
  finalizeDriveImportBatch,
  importStoredFactSheet,
  importUploadedFactSheet,
  publishImportCheckpoint,
  processDriveImportSource,
  startDriveImportBatch,
  type ImportLogEntry
} from "@/lib/services/import-service";
import {
  applyExcelResortSyncPreview,
  processUploadedExcelResortSource,
  processExcelResortSyncSource,
  startExcelResortSync
} from "@/lib/services/excel-resort-sync-service";
import { ensureImportUploadBucket, SITE_ASSET_BUCKET } from "@/lib/storage/site-assets";
import { toErrorMessage } from "@/lib/error-message";
import { aiImportRequestSchema } from "@/lib/validations";
import { normalizePropertyType, type PropertyType } from "@/lib/services/resort-service";
import {
  commitPhotoImport,
  previewPhotoImport,
  type PhotoImportCommitInput,
  type PhotoImportFileInput
} from "@/lib/services/photo-import-service";

export const runtime = "nodejs";
export const maxDuration = 300;

function slugFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function revalidatePropertyType(propertyType: PropertyType) {
  revalidatePath("/admin/resorts");
  revalidatePath("/admin/liveaboards");
  revalidatePath("/admin/hotels");
  revalidatePath("/resorts");
  revalidatePath("/liveaboards");
  revalidatePath("/hotels");
  revalidatePath("/");
  revalidateTag("resorts-public", "max");
}

export async function POST(request: Request) {
  const auth = await requireAdminJson(["super_admin", "admin", "content_manager"]);
  if (!auth.ok) return auth.response;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const excelUpload = formData.get("excelFile");
    if (excelUpload instanceof File) {
      if (excelUpload.size === 0 || excelUpload.size > 50 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: "Upload an Excel workbook up to 50 MB." }, { status: 400 });
      }

      const result = await processUploadedExcelResortSource({
        filename: excelUpload.name,
        bytes: new Uint8Array(await excelUpload.arrayBuffer()),
        propertyType: normalizePropertyType(formData.get("propertyType")),
        manualMatchResortId: typeof formData.get("manualMatchResortId") === "string"
          ? String(formData.get("manualMatchResortId"))
          : undefined,
        modelIndex: typeof formData.get("modelIndex") === "string" && /^\d+$/u.test(String(formData.get("modelIndex")))
          ? Number(formData.get("modelIndex"))
          : undefined
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error, details: result.details }, { status: result.status ?? 500 });
      }

      return NextResponse.json({ ok: true, message: "Excel workbook analyzed and staged for review.", data: result.data });
    }

    const upload = formData.get("factSheetFile");
    const result = await importUploadedFactSheet(
      upload instanceof File ? upload : new File([], ""),
      normalizePropertyType(formData.get("propertyType"))
    );

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, details: result.details },
        { status: result.status ?? 500 }
      );
    }

    revalidatePath("/admin/imports");
    revalidatePropertyType(normalizePropertyType(formData.get("propertyType")));

    return NextResponse.json({
      ok: true,
      message: result.data.message,
      data: result.data
    });
  }

  const json = await request.json().catch(() => null);
  const mode = typeof json?.mode === "string" ? json.mode : "start";

  if (mode === "excel-start") {
    if (typeof json?.googleDriveUrl !== "string" || !json.googleDriveUrl.trim()) {
      return NextResponse.json({ ok: false, error: "A Google Drive folder or workbook URL is required." }, { status: 400 });
    }

    const result = await startExcelResortSync({
      googleDriveUrl: json.googleDriveUrl,
      propertyType: normalizePropertyType(json.propertyType)
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, details: result.details }, { status: result.status ?? 500 });
    }

    return NextResponse.json({ ok: true, message: result.data.message, data: result.data });
  }

  if (mode === "photo-preview") {
    const files = Array.isArray(json?.files) ? json.files : [];
    const result = await previewPhotoImport({
      propertyType: normalizePropertyType(json?.propertyType),
      files: files.map((file: Partial<PhotoImportFileInput>) => ({
        relativePath: String(file.relativePath ?? ""),
        name: String(file.name ?? ""),
        size: Number(file.size ?? 0),
        type: String(file.type ?? "")
      }))
    });

    return NextResponse.json({
      ok: true,
      message: `${result.summary.safeGroups} photo groups are safe for import. ${result.summary.reviewGroups} need review.`,
      data: result
    });
  }

  if (mode === "photo-create-upload-url") {
    const filename = String(json?.filename ?? "").trim();
    const contentType = String(json?.contentType ?? "").trim() || "image/jpeg";
    const folder = String(json?.folder ?? "media-library/resorts").trim() || "media-library/resorts";

    if (!filename) {
      return NextResponse.json({ ok: false, error: "Filename is required." }, { status: 400 });
    }

    try {
      const { createSignedSiteAssetUpload } = await import("@/lib/storage/site-assets");
      const data = await createSignedSiteAssetUpload(filename, contentType, folder, filename);
      return NextResponse.json({ ok: true, data });
    } catch (error) {
      return NextResponse.json({ ok: false, error: toErrorMessage(error, "Could not prepare photo upload.") }, { status: 500 });
    }
  }

  if (mode === "photo-commit") {
    const result = await commitPhotoImport({
      propertyType: normalizePropertyType(json?.propertyType),
      replaceExisting: Boolean(json?.replaceExisting),
      rows: Array.isArray(json?.rows) ? json.rows : [],
      uploadedItems: Array.isArray(json?.uploadedItems) ? json.uploadedItems : []
    } as PhotoImportCommitInput);

    revalidatePath("/admin/imports");
    revalidatePropertyType(normalizePropertyType(json?.propertyType));

    return NextResponse.json({
      ok: true,
      message: `${result.summary.uploadedCount} photos uploaded. ${result.summary.notUploadedCount} photos not uploaded.`,
      data: result
    });
  }

  if (mode === "excel-process") {
    if (typeof json?.batchId !== "string" || typeof json?.sourceUrl !== "string" || !Number.isInteger(json?.sourceIndex)) {
      return NextResponse.json({ ok: false, error: "Invalid Excel workbook processing request." }, { status: 400 });
    }

    const result = await processExcelResortSyncSource({
      batchId: json.batchId,
      sourceUrl: json.sourceUrl,
      sourceIndex: json.sourceIndex,
      modelIndex: Number.isInteger(json.modelIndex) ? json.modelIndex : undefined,
      propertyType: normalizePropertyType(json.propertyType),
      manualMatchResortId: typeof json.manualMatchResortId === "string" ? json.manualMatchResortId : undefined
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, details: result.details }, { status: result.status ?? 500 });
    }

    return NextResponse.json({ ok: true, message: "Excel workbook analyzed and staged for review.", data: result.data });
  }

  if (mode === "excel-apply") {
    if (typeof json?.stagingId !== "string" || !json.stagingId) {
      return NextResponse.json({ ok: false, error: "An Excel preview id is required." }, { status: 400 });
    }

    const result = await applyExcelResortSyncPreview(json.stagingId, json.decision === "create_draft" ? "create_draft" : "update");

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, details: result.details }, { status: result.status ?? 500 });
    }

    revalidatePath("/admin/imports");
    revalidatePropertyType(normalizePropertyType(json.propertyType));

    return NextResponse.json({ ok: true, message: result.data.message, data: result.data });
  }

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
      filename: String(json.filename),
      propertyType: normalizePropertyType(json.propertyType)
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, details: result.details },
        { status: result.status ?? 500 }
      );
    }

    revalidatePath("/admin/imports");
    revalidatePropertyType(normalizePropertyType(json.propertyType));

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
    let supabase;
    try {
      supabase = await ensureImportUploadBucket();
    } catch (error) {
      return NextResponse.json({ ok: false, error: toErrorMessage(error, "Could not configure PDF uploads.") }, { status: 500 });
    }
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
      sourceIndex: Number(json.sourceIndex),
      propertyType: normalizePropertyType(json.propertyType)
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
    revalidatePropertyType(normalizePropertyType(json.propertyType));

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
    revalidatePropertyType(normalizePropertyType(result.data.propertyType));

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
