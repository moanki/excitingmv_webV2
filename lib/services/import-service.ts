import {
  extractImportedResortsFromPdf,
  type ImportedResort,
  type ImportedResortPayload
} from "@/lib/services/resort-ai-service";
import { listAdminResorts, saveResort } from "@/lib/services/resort-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PublishStatus, ServiceResult } from "@/lib/types";
import { aiImportRequestSchema } from "@/lib/validations";
import type { z } from "zod";

type AiImportRequestInput = z.infer<typeof aiImportRequestSchema>;

export type ImportExecutionResult = {
  batchId: string;
  importedResorts: number;
  processedSources: number;
  totalSources: number;
  skippedSources: number;
  warningCount: number;
  errorCount: number;
  providerUsed: string;
  message: string;
  logs: ImportLogEntry[];
};

type ImportRow = {
  id: string;
  batch_name: string;
  source_type: string;
  file_path: string | null;
  status: string;
  created_at: string;
};

export type ImportBatchRecord = {
  id: string;
  batchName: string;
  sourceType: string;
  sourcePath: string;
  status: string;
  createdAt: string;
};

type DownloadedPdf = {
  sourceUrl: string;
  filename: string;
  bytes: Uint8Array;
};

type ImportBatchRow = {
  id: string;
};

export type ImportLogEntry = {
  sourceUrl: string;
  filename: string;
  status: "processing" | "imported" | "skipped" | "warning" | "error";
  provider: string;
  model?: string;
  message: string;
  resortName?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publishingToStatus(mode: ImportedResort["publishingMode"]): {
  status: PublishStatus;
  isFeaturedHomepage: boolean;
} {
  if (mode === "published_featured") {
    return { status: "published", isFeaturedHomepage: true };
  }

  if (mode === "published_standard") {
    return { status: "published", isFeaturedHomepage: false };
  }

  return { status: "draft", isFeaturedHomepage: false };
}

function createBatchName(url: string) {
  const source = new URL(url);
  const stamp = new Date().toISOString().slice(0, 10);
  return `Drive import ${source.hostname} ${stamp}`;
}

function createUploadBatchName(filename: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `Upload import ${filename} ${stamp}`;
}

function normalizeGoogleDriveFileUrl(url: string) {
  const parsed = new URL(url);
  const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
  if (fileMatch?.[1]) {
    const resourceKey = parsed.searchParams.get("resourcekey");
    const normalized = new URL("https://drive.google.com/uc");
    normalized.searchParams.set("export", "download");
    normalized.searchParams.set("id", fileMatch[1]);
    if (resourceKey) {
      normalized.searchParams.set("resourcekey", resourceKey);
    }
    return normalized.toString();
  }

  const docMatch = parsed.pathname.match(/\/document\/d\/([^/]+)/);
  if (docMatch?.[1]) {
    const normalized = new URL(`https://docs.google.com/document/d/${docMatch[1]}/export`);
    normalized.searchParams.set("format", "pdf");
    const resourceKey = parsed.searchParams.get("resourcekey");
    if (resourceKey) {
      normalized.searchParams.set("resourcekey", resourceKey);
    }
    return normalized.toString();
  }

  const sheetMatch = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (sheetMatch?.[1]) {
    const normalized = new URL(`https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export`);
    normalized.searchParams.set("format", "pdf");
    const resourceKey = parsed.searchParams.get("resourcekey");
    if (resourceKey) {
      normalized.searchParams.set("resourcekey", resourceKey);
    }
    return normalized.toString();
  }

  const slideMatch = parsed.pathname.match(/\/presentation\/d\/([^/]+)/);
  if (slideMatch?.[1]) {
    const normalized = new URL(`https://docs.google.com/presentation/d/${slideMatch[1]}/export/pdf`);
    const resourceKey = parsed.searchParams.get("resourcekey");
    if (resourceKey) {
      normalized.searchParams.set("resourcekey", resourceKey);
    }
    return normalized.toString();
  }

  return url;
}

function guessFilenameFromUrl(url: string, index: number) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] ?? `resort-${index + 1}.pdf`;
    return last.toLowerCase().endsWith(".pdf") ? last : `${last}.pdf`;
  } catch {
    return `resort-${index + 1}.pdf`;
  }
}

function isUsableDriveFileUrl(url: string) {
  const lowered = url.toLowerCase();
  return !(
    lowered.includes("{docid}") ||
    lowered.includes("%7bdocid%7d") ||
    lowered.includes("{resourcekeyparam}") ||
    lowered.includes("%7bresourcekeyparam%7d")
  );
}

async function resolveGoogleDriveSources(url: string) {
  const parsed = new URL(url);
  const folderMatch = parsed.pathname.match(/\/drive\/folders\/([^/?]+)/);
  if (!folderMatch?.[1]) {
    return [normalizeGoogleDriveFileUrl(url)];
  }

  const folderId = folderMatch[1];
  const resourceKey = parsed.searchParams.get("resourcekey");
  const embeddedUrl = new URL("https://drive.google.com/embeddedfolderview");
  embeddedUrl.searchParams.set("id", folderId);
  if (resourceKey) {
    embeddedUrl.searchParams.set("resourcekey", resourceKey);
  }

  const candidates = [url, `${embeddedUrl.toString()}#list`];
  const htmlPayloads = await Promise.all(
    candidates.map(async (candidate) => {
      const response = await fetch(candidate, { cache: "no-store" });
      if (!response.ok) {
        return "";
      }
      return response.text();
    })
  );

  const driveDocMatches = htmlPayloads.flatMap((html) =>
    Array.from(
      html.matchAll(
        /https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d|document\/d|spreadsheets\/d|presentation\/d)\/[^"'&<\s]+/g
      )
    )
      .map((match) => normalizeGoogleDriveFileUrl(match[0]))
      .filter(isUsableDriveFileUrl)
  );

  const embeddedFileMatches = htmlPayloads.flatMap((html) =>
    Array.from(html.matchAll(/href="(https:\/\/drive\.google\.com\/file\/d\/[^"]+)"/g)).map((match) =>
      normalizeGoogleDriveFileUrl(match[1].replace(/&amp;/g, "&"))
    )
  );

  const pdfMatches = htmlPayloads.flatMap((html) =>
    Array.from(html.matchAll(/https?:\/\/[^"'<> \t\r\n]+\.pdf(?:\?[^"'<> \t\r\n]*)?/gi)).map((match) => match[0])
  );

  const uniqueMatches = Array.from(
    new Set(
      [...embeddedFileMatches, ...driveDocMatches, ...pdfMatches]
        .map((item) => item.trim())
        .filter(Boolean)
        .filter(isUsableDriveFileUrl)
    )
  );

  if (!uniqueMatches.length) {
    throw new Error("No readable PDF files were found in that Google Drive folder.");
  }

  return uniqueMatches;
}

async function downloadPdfSource(sourceUrl: string, index: number): Promise<DownloadedPdf> {
  const response = await fetch(sourceUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to download PDF from ${sourceUrl}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const contentDisposition = response.headers.get("content-disposition") ?? "";
  const hasPdfFilename = /\.pdf\b/i.test(contentDisposition);
  const isPdf =
    contentType.includes("pdf") ||
    hasPdfFilename ||
    sourceUrl.toLowerCase().includes(".pdf") ||
    sourceUrl.includes("export?format=pdf");
  if (!isPdf) {
    throw new Error(`Source is not a PDF: ${sourceUrl}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const filename = guessFilenameFromUrl(sourceUrl, index);
  return {
    sourceUrl,
    filename,
    bytes
  };
}

async function createDownloadedPdfFromUpload(file: File): Promise<DownloadedPdf> {
  const filename = file.name?.trim() || "uploaded-resort-fact-sheet.pdf";
  const isPdf =
    file.type.includes("pdf") ||
    filename.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new Error("Uploaded file must be a PDF fact sheet.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    sourceUrl: `upload://${filename}`,
    filename,
    bytes
  };
}

export async function createImportBatch(
  input: AiImportRequestInput
): Promise<ServiceResult<ImportExecutionResult>> {
  const parsed = aiImportRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Enter a valid Google Drive URL."
    };
  }

  const supabase = createSupabaseAdminClient();
  const sourceUrl = parsed.data.googleDriveUrl;

  const { data: batchData, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      batch_name: createBatchName(sourceUrl),
      source_type: "google_drive_pdf",
      file_path: sourceUrl,
      status: "processing"
    })
    .select("id")
    .single();

  if (batchError || !batchData) {
    return {
      ok: false,
      error: "Failed to start the import.",
      status: 500,
      details: batchError
    };
  }

  try {
    const sourceFiles = await resolveGoogleDriveSources(sourceUrl);
    const existingResorts = await listAdminResorts();
    const existingSlugs = new Set(existingResorts.map((resort) => slugify(resort.slug)));
    const existingNames = new Set(existingResorts.map((resort) => resort.name.trim().toLowerCase()));

    let importedCount = 0;
    let skippedCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    const modelUsage = new Set<string>();
    const logs: ImportLogEntry[] = [];
    const stagedPayloads: Array<{ sourceUrl: string; extracted: ImportedResortPayload }> = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
      try {
        const downloadedPdf = await downloadPdfSource(sourceFiles[index], index);
        logs.push({
          sourceUrl: sourceFiles[index],
          filename: downloadedPdf.filename,
          status: "processing",
          provider: "none",
          message: "Downloaded fact sheet and started extraction."
        });

        const extraction = await extractImportedResortsFromPdf(downloadedPdf);
        const { data: extracted, usedModel, usedProvider } = extraction;
        modelUsage.add(`${usedProvider}:${usedModel}`);
        stagedPayloads.push({ sourceUrl: sourceFiles[index], extracted });

        const resort = extracted.resorts.find((item) => item.name.trim());
        if (!resort) {
          warningCount += 1;
          logs.push({
            sourceUrl: sourceFiles[index],
            filename: downloadedPdf.filename,
            status: "warning",
            provider: usedProvider,
            model: usedModel,
            message: "No resort could be extracted from this PDF."
          });
          continue;
        }

        const slug = slugify(resort.slug || resort.name);
        const normalizedName = resort.name.trim().toLowerCase();

        if (existingSlugs.has(slug) || existingNames.has(normalizedName)) {
          skippedCount += 1;
          logs.push({
            sourceUrl: sourceFiles[index],
            filename: downloadedPdf.filename,
            status: "skipped",
            provider: usedProvider,
            model: usedModel,
            resortName: resort.name.trim(),
            message: `Skipped existing resort: ${resort.name.trim()}.`
          });
          continue;
        }

        const publishing = publishingToStatus(resort.publishingMode);

        await saveResort({
          slug,
          name: resort.name.trim(),
          location: resort.location.trim(),
          category: resort.category.trim(),
          transferType: resort.transferType.trim(),
          description: resort.description.trim(),
          highlights: resort.highlights.filter(Boolean),
          mealPlans: resort.mealPlans.filter(Boolean),
          seoTitle: resort.seoTitle.trim() || resort.name.trim(),
          seoDescription: resort.seoDescription.trim() || resort.description.trim(),
          seoSummary: resort.seoSummary.trim() || resort.description.trim(),
          heroImageUrl: resort.heroImageUrl.trim(),
          galleryMediaUrls: resort.galleryMediaUrls.filter(Boolean),
          roomTypes: resort.roomTypes
            .filter((room) => room.name.trim())
            .map((room) => ({
              name: room.name.trim(),
              description: room.description.trim(),
              seoDescription: room.seoDescription.trim() || room.description.trim(),
              photoUrl: room.photoUrl.trim()
            })),
          status: publishing.status,
          isFeaturedHomepage: publishing.isFeaturedHomepage
        });

        existingSlugs.add(slug);
        existingNames.add(normalizedName);
        importedCount += 1;
        logs.push({
          sourceUrl: sourceFiles[index],
          filename: downloadedPdf.filename,
          status: "imported",
          provider: usedProvider,
          model: usedModel,
          resortName: resort.name.trim(),
          message: `Imported resort: ${resort.name.trim()}.`
        });
      } catch (error) {
        errorCount += 1;
        logs.push({
          sourceUrl: sourceFiles[index],
          filename: guessFilenameFromUrl(sourceFiles[index], index),
          status: "error",
          provider: "none",
          message: error instanceof Error ? error.message : "Import failed for this file."
        });
      }
    }

    await supabase.from("resort_staging").insert({
      batch_id: (batchData as ImportBatchRow).id,
      raw_payload: {
        sourceUrl,
        resolvedFiles: sourceFiles
      },
      extracted_payload: {
        items: stagedPayloads
      },
      review_status: "ready"
    });

    await supabase
      .from("import_batches")
      .update({
        status:
          errorCount > 0
            ? importedCount > 0
              ? "completed_with_errors"
              : "failed"
            : importedCount > 0
              ? "completed"
              : "completed_no_new_resorts"
      })
      .eq("id", (batchData as ImportBatchRow).id);

    const providerUsed = modelUsage.size === 0 ? "none" : Array.from(modelUsage).join(", ");

    return {
      ok: true,
      data: {
        batchId: (batchData as ImportBatchRow).id,
        importedResorts: importedCount,
        processedSources: sourceFiles.length,
        totalSources: sourceFiles.length,
        skippedSources: skippedCount,
        warningCount,
        errorCount,
        providerUsed,
        message: `Processed ${sourceFiles.length} PDF${sourceFiles.length === 1 ? "" : "s"}: imported ${importedCount}, skipped ${skippedCount}, warnings ${warningCount}, errors ${errorCount}.`,
        logs
      }
    };
  } catch (error) {
    await supabase.from("import_batches").update({ status: "failed" }).eq("id", (batchData as ImportBatchRow).id);

    return {
      ok: false,
      error: error instanceof Error ? error.message : "The Google Drive import failed."
    };
  }
}

export async function importUploadedFactSheet(file: File): Promise<ServiceResult<ImportExecutionResult>> {
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      error: "Upload a PDF fact sheet to start the import."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: batchData, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      batch_name: createUploadBatchName(file.name || "uploaded-fact-sheet.pdf"),
      source_type: "uploaded_pdf",
      file_path: file.name || "uploaded-fact-sheet.pdf",
      status: "processing"
    })
    .select("id")
    .single();

  if (batchError || !batchData) {
    return {
      ok: false,
      error: "Failed to start the uploaded PDF import.",
      status: 500,
      details: batchError
    };
  }

  try {
    const existingResorts = await listAdminResorts();
    const existingSlugs = new Set(existingResorts.map((resort) => slugify(resort.slug)));
    const existingNames = new Set(existingResorts.map((resort) => resort.name.trim().toLowerCase()));
    const downloadedPdf = await createDownloadedPdfFromUpload(file);

    let importedCount = 0;
    let skippedCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    const modelUsage = new Set<string>();
    const logs: ImportLogEntry[] = [
      {
        sourceUrl: downloadedPdf.sourceUrl,
        filename: downloadedPdf.filename,
        status: "processing",
        provider: "none",
        message: "Uploaded PDF received and extraction started."
      }
    ];
    const stagedPayloads: Array<{ sourceUrl: string; extracted: ImportedResortPayload }> = [];

    try {
      const extraction = await extractImportedResortsFromPdf(downloadedPdf);
      const { data: extracted, usedModel, usedProvider } = extraction;
      modelUsage.add(`${usedProvider}:${usedModel}`);
      stagedPayloads.push({ sourceUrl: downloadedPdf.sourceUrl, extracted });

      const resort = extracted.resorts.find((item) => item.name.trim());
      if (!resort) {
        warningCount += 1;
        logs.push({
          sourceUrl: downloadedPdf.sourceUrl,
          filename: downloadedPdf.filename,
          status: "warning",
          provider: usedProvider,
          model: usedModel,
          message: "No resort could be extracted from the uploaded PDF."
        });
      } else {
        const slug = slugify(resort.slug || resort.name);
        const normalizedName = resort.name.trim().toLowerCase();

        if (existingSlugs.has(slug) || existingNames.has(normalizedName)) {
          skippedCount += 1;
          logs.push({
            sourceUrl: downloadedPdf.sourceUrl,
            filename: downloadedPdf.filename,
            status: "skipped",
            provider: usedProvider,
            model: usedModel,
            resortName: resort.name.trim(),
            message: `Skipped existing resort: ${resort.name.trim()}.`
          });
        } else {
          const publishing = publishingToStatus(resort.publishingMode);

          await saveResort({
            slug,
            name: resort.name.trim(),
            location: resort.location.trim(),
            category: resort.category.trim(),
            transferType: resort.transferType.trim(),
            description: resort.description.trim(),
            highlights: resort.highlights.filter(Boolean),
            mealPlans: resort.mealPlans.filter(Boolean),
            seoTitle: resort.seoTitle.trim() || resort.name.trim(),
            seoDescription: resort.seoDescription.trim() || resort.description.trim(),
            seoSummary: resort.seoSummary.trim() || resort.description.trim(),
            heroImageUrl: resort.heroImageUrl.trim(),
            galleryMediaUrls: resort.galleryMediaUrls.filter(Boolean),
            roomTypes: resort.roomTypes
              .filter((room) => room.name.trim())
              .map((room) => ({
                name: room.name.trim(),
                description: room.description.trim(),
                seoDescription: room.seoDescription.trim() || room.description.trim(),
                photoUrl: room.photoUrl.trim()
              })),
            status: publishing.status,
            isFeaturedHomepage: publishing.isFeaturedHomepage
          });

          importedCount += 1;
          logs.push({
            sourceUrl: downloadedPdf.sourceUrl,
            filename: downloadedPdf.filename,
            status: "imported",
            provider: usedProvider,
            model: usedModel,
            resortName: resort.name.trim(),
            message: `Imported resort: ${resort.name.trim()}.`
          });
        }
      }
    } catch (error) {
      errorCount += 1;
      logs.push({
        sourceUrl: downloadedPdf.sourceUrl,
        filename: downloadedPdf.filename,
        status: "error",
        provider: "none",
        message: error instanceof Error ? error.message : "Import failed for the uploaded file."
      });
    }

    await supabase.from("resort_staging").insert({
      batch_id: (batchData as ImportBatchRow).id,
      raw_payload: {
        source: "upload",
        filename: downloadedPdf.filename
      },
      extracted_payload: {
        items: stagedPayloads
      },
      review_status: "ready"
    });

    await supabase
      .from("import_batches")
      .update({
        status:
          errorCount > 0
            ? importedCount > 0
              ? "completed_with_errors"
              : "failed"
            : importedCount > 0
              ? "completed"
              : "completed_no_new_resorts"
      })
      .eq("id", (batchData as ImportBatchRow).id);

    const providerUsed = modelUsage.size === 0 ? "none" : Array.from(modelUsage).join(", ");

    return {
      ok: true,
      data: {
        batchId: (batchData as ImportBatchRow).id,
        importedResorts: importedCount,
        processedSources: 1,
        totalSources: 1,
        skippedSources: skippedCount,
        warningCount,
        errorCount,
        providerUsed,
        message: `Processed uploaded PDF: imported ${importedCount}, skipped ${skippedCount}, warnings ${warningCount}, errors ${errorCount}.`,
        logs
      }
    };
  } catch (error) {
    await supabase.from("import_batches").update({ status: "failed" }).eq("id", (batchData as ImportBatchRow).id);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "The uploaded PDF import failed."
    };
  }
}

export async function listImportBatches(): Promise<ImportBatchRecord[]> {
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
