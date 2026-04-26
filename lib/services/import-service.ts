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

export type DriveImportStartResult = {
  batchId: string;
  sourceFiles: string[];
  message: string;
};

export type ImportExecutionDelta = {
  processedSources: number;
  importedResorts: number;
  skippedSources: number;
  warningCount: number;
  errorCount: number;
  providerUsage: string | null;
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

type ImportCheckpointPayload = {
  checkpointVersion: 2;
  sourceUrl: string;
  filename: string;
  notes: string;
  resorts: ImportedResort[];
};

type ImportBatchRow = {
  id: string;
};

type ResortStagingRow = {
  id: string;
  batch_id: string;
  raw_payload: Record<string, unknown> | null;
  extracted_payload: Record<string, unknown> | null;
  review_status: string;
  created_at: string;
  import_batches:
    | {
        batch_name: string;
        source_type: string;
      }
    | Array<{
        batch_name: string;
        source_type: string;
      }>
    | null;
};

export type ImportCheckpointRecord = {
  id: string;
  batchId: string;
  batchName: string;
  sourceType: string;
  sourceUrl: string;
  filename: string;
  notes: string;
  reviewStatus: string;
  createdAt: string;
  resorts: ImportedResort[];
  canPublish: boolean;
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

const MAX_RETURN_LOGS = 24;
const MAX_STAGING_ITEMS = 12;
const FILENAME_STOP_MARKERS = [
  "fact sheet",
  "factsheet",
  "brochure",
  "full version",
  "full-version",
  "version",
  "rate sheet",
  "rates",
  "presentation",
  "profile",
  "deck"
];

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

  return { status: "published", isFeaturedHomepage: false };
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

function normalizeIdentity(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function buildExistingResortIdentityIndex(
  resorts: Awaited<ReturnType<typeof listAdminResorts>>
) {
  const slugSet = new Set<string>();
  const normalizedNameSet = new Set<string>();

  resorts.forEach((resort) => {
    const slug = slugify(resort.slug || resort.name);
    const normalizedName = normalizeIdentity(resort.name);

    if (slug) {
      slugSet.add(slug);
    }

    if (normalizedName) {
      normalizedNameSet.add(normalizedName);
    }
  });

  return { slugSet, normalizedNameSet };
}

function getFilenameBaseName(filename: string) {
  return filename.replace(/\.[^.]+$/u, "").trim();
}

function getFilenameDuplicateCandidates(filename: string) {
  const baseName = getFilenameBaseName(filename);
  const lowered = baseName.toLowerCase();
  const candidates = new Set<string>([baseName]);

  for (const marker of FILENAME_STOP_MARKERS) {
    const markerIndex = lowered.indexOf(marker);
    if (markerIndex > 0) {
      candidates.add(baseName.slice(0, markerIndex).replace(/[-–—|]+$/u, "").trim());
    }
  }

  baseName
    .split(/\s[-–—|]\s|[-–—|]/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => candidates.add(part));

  const slugCandidates = new Set<string>();
  const normalizedCandidates = new Set<string>();

  for (const candidate of candidates) {
    const slugCandidate = slugify(candidate);
    const normalizedCandidate = normalizeIdentity(candidate);

    if (slugCandidate) {
      slugCandidates.add(slugCandidate);
    }

    if (normalizedCandidate) {
      normalizedCandidates.add(normalizedCandidate);
    }
  }

  return {
    slugCandidates,
    normalizedCandidates
  };
}

function matchExistingResortByFilename(
  filename: string,
  existingIndex: ReturnType<typeof buildExistingResortIdentityIndex>
) {
  const { slugCandidates, normalizedCandidates } = getFilenameDuplicateCandidates(filename);

  for (const slugCandidate of slugCandidates) {
    if (existingIndex.slugSet.has(slugCandidate)) {
      return slugCandidate;
    }
  }

  for (const normalizedCandidate of normalizedCandidates) {
    if (existingIndex.normalizedNameSet.has(normalizedCandidate)) {
      return normalizedCandidate;
    }
  }

  return null;
}

function compactLogs(logs: ImportLogEntry[]) {
  if (logs.length <= MAX_RETURN_LOGS) {
    return logs;
  }

  const visibleLogs = logs.slice(0, MAX_RETURN_LOGS - 1);
  visibleLogs.push({
    sourceUrl: "system://import-summary",
    filename: "Import Summary",
    status: "warning",
    provider: "system",
    message: `${logs.length - visibleLogs.length} additional log entries were omitted from the live response to keep the import stable.`
  });

  return visibleLogs;
}

function compactStagingPayload(
  sourceUrl: string,
  sourceFiles: string[],
  stagedPayloads: Array<{ sourceUrl: string; extracted: ImportedResortPayload }>
) {
  return {
    sourceUrl,
    resolvedFileCount: sourceFiles.length,
    resolvedFiles: sourceFiles.slice(0, MAX_STAGING_ITEMS),
    items: stagedPayloads.slice(0, MAX_STAGING_ITEMS).map((item) => ({
      sourceUrl: item.sourceUrl,
      notes: item.extracted.notes,
      resortCount: item.extracted.resorts.length,
      resorts: item.extracted.resorts.map((resort) => ({
        name: resort.name,
        slug: resort.slug,
        location: resort.location,
        category: resort.category,
        publishingMode: resort.publishingMode,
        roomTypeCount: resort.roomTypes.length
      }))
    })),
    truncated:
      sourceFiles.length > MAX_STAGING_ITEMS || stagedPayloads.length > MAX_STAGING_ITEMS
  };
}

function buildCheckpointPayload(sourceUrl: string, filename: string, extracted: ImportedResortPayload): ImportCheckpointPayload {
  return {
    checkpointVersion: 2,
    sourceUrl,
    filename,
    notes: extracted.notes,
    resorts: extracted.resorts
  };
}

function toSaveResortInput(resort: ImportedResort) {
  const publishing = publishingToStatus(resort.publishingMode);

  return {
    slug: slugify(resort.slug || resort.name),
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
        photoUrl: room.photoUrl.trim(),
        sizeLabel: room.sizeLabel.trim(),
        maxOccupancy: room.maxOccupancy,
        bedType: room.bedType.trim(),
        amenities: room.amenities.filter(Boolean)
      })),
    status: publishing.status,
    isFeaturedHomepage: publishing.isFeaturedHomepage
  };
}

function isDuplicateImportedResort(
  resort: ImportedResort,
  existingIndex: ReturnType<typeof buildExistingResortIdentityIndex>
) {
  const slug = slugify(resort.slug || resort.name);
  const normalizedName = normalizeIdentity(resort.name);
  return existingIndex.slugSet.has(slug) || existingIndex.normalizedNameSet.has(normalizedName);
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

async function createImportBatchRecord(batchName: string, sourceType: string, filePath: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("import_batches")
    .insert({
      batch_name: batchName,
      source_type: sourceType,
      file_path: filePath,
      status: "processing"
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Failed to start the import.");
  }

  return (data as ImportBatchRow).id;
}

async function insertResortStagingRecord(
  batchId: string,
  rawPayload: Record<string, unknown>,
  extractedPayload: Record<string, unknown>
) {
  const supabase = createSupabaseAdminClient();

  try {
    await supabase.from("resort_staging").insert({
      batch_id: batchId,
      raw_payload: rawPayload,
      extracted_payload: extractedPayload,
      review_status: "ready"
    });
  } catch (error) {
    console.error("Failed to store import staging payload", error);
  }
}

function deriveBatchStatus(importedCount: number, errorCount: number) {
  if (errorCount > 0) {
    return importedCount > 0 ? "completed_with_errors" : "failed";
  }

  return importedCount > 0 ? "completed" : "completed_no_new_resorts";
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

export async function startDriveImportBatch(
  input: AiImportRequestInput
): Promise<ServiceResult<DriveImportStartResult>> {
  const parsed = aiImportRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Enter a valid Google Drive URL."
    };
  }

  try {
    const sourceUrl = parsed.data.googleDriveUrl;
    const sourceFiles = await resolveGoogleDriveSources(sourceUrl);
    const batchId = await createImportBatchRecord(createBatchName(sourceUrl), "google_drive_pdf", sourceUrl);

    return {
      ok: true,
      data: {
        batchId,
        sourceFiles,
        message: `Found ${sourceFiles.length} PDF${sourceFiles.length === 1 ? "" : "s"} to import.`
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to prepare the Google Drive import."
    };
  }
}

export async function processDriveImportSource(input: {
  batchId: string;
  sourceUrl: string;
  sourceIndex: number;
}): Promise<ServiceResult<ImportExecutionDelta>> {
  try {
    const existingResorts = await listAdminResorts();
    const existingIndex = buildExistingResortIdentityIndex(existingResorts);
    const downloadedPdf = await downloadPdfSource(input.sourceUrl, input.sourceIndex);
    const logs: ImportLogEntry[] = [
      {
        sourceUrl: input.sourceUrl,
        filename: downloadedPdf.filename,
        status: "processing",
        provider: "none",
        message: "Downloaded fact sheet and started extraction."
      }
    ];
    const stagedPayloads: Array<{ sourceUrl: string; extracted: ImportedResortPayload }> = [];

    const filenameDuplicate = matchExistingResortByFilename(downloadedPdf.filename, existingIndex);
    if (filenameDuplicate) {
      logs.push({
        sourceUrl: input.sourceUrl,
        filename: downloadedPdf.filename,
        status: "skipped",
        provider: "system",
        message: "Skipped before AI extraction because the PDF filename matches an existing resort."
      });

      return {
        ok: true,
        data: {
          processedSources: 1,
          importedResorts: 0,
          skippedSources: 1,
          warningCount: 0,
          errorCount: 0,
          providerUsage: null,
          logs: compactLogs(logs)
        }
      };
    }

    try {
      const extraction = await extractImportedResortsFromPdf(downloadedPdf);
      const { data: extracted, usedModel, usedProvider } = extraction;
      const providerUsage = `${usedProvider}:${usedModel}`;
      stagedPayloads.push({ sourceUrl: input.sourceUrl, extracted });

      const resort = extracted.resorts.find((item) => item.name.trim());
      if (!resort) {
        logs.push({
          sourceUrl: input.sourceUrl,
          filename: downloadedPdf.filename,
          status: "warning",
          provider: usedProvider,
          model: usedModel,
          message: "No resort could be extracted from this PDF."
        });

        await insertResortStagingRecord(
          input.batchId,
          {
            sourceUrl: input.sourceUrl,
            filename: downloadedPdf.filename
          },
          buildCheckpointPayload(input.sourceUrl, downloadedPdf.filename, extracted)
        );

        return {
          ok: true,
          data: {
            processedSources: 1,
            importedResorts: 0,
            skippedSources: 0,
            warningCount: 1,
            errorCount: 0,
            providerUsage,
            logs: compactLogs(logs)
          }
        };
      }

      if (isDuplicateImportedResort(resort, existingIndex)) {
        logs.push({
          sourceUrl: input.sourceUrl,
          filename: downloadedPdf.filename,
          status: "skipped",
          provider: usedProvider,
          model: usedModel,
          resortName: resort.name.trim(),
          message: `Skipped existing resort: ${resort.name.trim()}.`
        });

        await insertResortStagingRecord(
          input.batchId,
          {
            sourceUrl: input.sourceUrl,
            filename: downloadedPdf.filename
          },
          buildCheckpointPayload(input.sourceUrl, downloadedPdf.filename, extracted)
        );

        return {
          ok: true,
          data: {
            processedSources: 1,
            importedResorts: 0,
            skippedSources: 1,
            warningCount: 0,
            errorCount: 0,
            providerUsage,
            logs: compactLogs(logs)
          }
        };
      }

      await saveResort(toSaveResortInput(resort));

      logs.push({
        sourceUrl: input.sourceUrl,
        filename: downloadedPdf.filename,
        status: "imported",
        provider: usedProvider,
        model: usedModel,
        resortName: resort.name.trim(),
        message: `Imported resort: ${resort.name.trim()}.`
      });

      await insertResortStagingRecord(
        input.batchId,
        {
          sourceUrl: input.sourceUrl,
          filename: downloadedPdf.filename
        },
        buildCheckpointPayload(input.sourceUrl, downloadedPdf.filename, extracted)
      );

      return {
        ok: true,
        data: {
          processedSources: 1,
          importedResorts: 1,
          skippedSources: 0,
          warningCount: 0,
          errorCount: 0,
          providerUsage,
          logs: compactLogs(logs)
        }
      };
    } catch (error) {
      logs.push({
        sourceUrl: input.sourceUrl,
        filename: downloadedPdf.filename,
        status: "error",
        provider: "none",
        message: error instanceof Error ? error.message : "Import failed for this file."
      });

      return {
        ok: true,
        data: {
          processedSources: 1,
          importedResorts: 0,
          skippedSources: 0,
          warningCount: 0,
          errorCount: 1,
          providerUsage: null,
          logs: compactLogs(logs)
        }
      };
    }
  } catch (error) {
    return {
      ok: true,
      data: {
        processedSources: 1,
        importedResorts: 0,
        skippedSources: 0,
        warningCount: 0,
        errorCount: 1,
        providerUsage: null,
        logs: [
          {
            sourceUrl: input.sourceUrl,
            filename: guessFilenameFromUrl(input.sourceUrl, input.sourceIndex),
            status: "error",
            provider: "none",
            message: error instanceof Error ? error.message : "Import failed for this file."
          }
        ]
      }
    };
  }
}

export async function finalizeDriveImportBatch(input: {
  batchId: string;
  totalSources: number;
  importedResorts: number;
  skippedSources: number;
  warningCount: number;
  errorCount: number;
  providerUsages: string[];
  logs: ImportLogEntry[];
}): Promise<ServiceResult<ImportExecutionResult>> {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("import_batches")
      .update({
        status: deriveBatchStatus(input.importedResorts, input.errorCount)
      })
      .eq("id", input.batchId);

    const providerUsed = input.providerUsages.length ? Array.from(new Set(input.providerUsages)).join(", ") : "none";

    return {
      ok: true,
      data: {
        batchId: input.batchId,
        importedResorts: input.importedResorts,
        processedSources: input.totalSources,
        totalSources: input.totalSources,
        skippedSources: input.skippedSources,
        warningCount: input.warningCount,
        errorCount: input.errorCount,
        providerUsed,
        message: `Processed ${input.totalSources} PDF${input.totalSources === 1 ? "" : "s"}: imported ${input.importedResorts}, skipped ${input.skippedSources}, warnings ${input.warningCount}, errors ${input.errorCount}.`,
        logs: compactLogs(input.logs)
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to finalize the Google Drive import."
    };
  }
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
              photoUrl: room.photoUrl.trim(),
              sizeLabel: room.sizeLabel.trim(),
              maxOccupancy: room.maxOccupancy,
              bedType: room.bedType.trim(),
              amenities: room.amenities.filter(Boolean)
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
        resolvedFileCount: sourceFiles.length,
        resolvedFiles: sourceFiles.slice(0, MAX_STAGING_ITEMS),
        truncated: sourceFiles.length > MAX_STAGING_ITEMS
      },
      extracted_payload: compactStagingPayload(sourceUrl, sourceFiles, stagedPayloads),
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
        logs: compactLogs(logs)
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
    const existingIndex = buildExistingResortIdentityIndex(existingResorts);
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

    const filenameDuplicate = matchExistingResortByFilename(downloadedPdf.filename, existingIndex);
    if (filenameDuplicate) {
      logs.push({
        sourceUrl: downloadedPdf.sourceUrl,
        filename: downloadedPdf.filename,
        status: "skipped",
        provider: "system",
        message: "Skipped before AI extraction because the PDF filename matches an existing resort."
      });

      await supabase
        .from("import_batches")
        .update({ status: "completed_no_new_resorts" })
        .eq("id", (batchData as ImportBatchRow).id);

      return {
        ok: true,
        data: {
          batchId: (batchData as ImportBatchRow).id,
          importedResorts: 0,
          processedSources: 1,
          totalSources: 1,
          skippedSources: 1,
          warningCount: 0,
          errorCount: 0,
          providerUsed: "none",
          message: "Processed uploaded PDF: imported 0, skipped 1, warnings 0, errors 0.",
          logs: compactLogs(logs)
        }
      };
    }

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
        if (isDuplicateImportedResort(resort, existingIndex)) {
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
          await saveResort(toSaveResortInput(resort));

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

    if (stagedPayloads[0]) {
      await insertResortStagingRecord(
        (batchData as ImportBatchRow).id,
        {
          source: "upload",
          filename: downloadedPdf.filename,
          sourceUrl: downloadedPdf.sourceUrl
        },
        buildCheckpointPayload(downloadedPdf.sourceUrl, downloadedPdf.filename, stagedPayloads[0].extracted)
      );
    }

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
        logs: compactLogs(logs)
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

export async function importStoredFactSheet(input: {
  sourceUrl: string;
  filename: string;
}): Promise<ServiceResult<ImportExecutionResult>> {
  if (!input.sourceUrl.trim()) {
    return {
      ok: false,
      error: "Stored PDF source URL is required."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: batchData, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      batch_name: createUploadBatchName(input.filename || "uploaded-fact-sheet.pdf"),
      source_type: "uploaded_pdf",
      file_path: input.sourceUrl,
      status: "processing"
    })
    .select("id")
    .single();

  if (batchError || !batchData) {
    return {
      ok: false,
      error: "Failed to start the stored PDF import.",
      status: 500,
      details: batchError
    };
  }

  try {
    const existingResorts = await listAdminResorts();
    const existingIndex = buildExistingResortIdentityIndex(existingResorts);
    const downloadedPdf = await downloadPdfSource(input.sourceUrl, 0);
    downloadedPdf.filename = input.filename?.trim() || downloadedPdf.filename;

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
        message: "Stored PDF received and extraction started."
      }
    ];
    const stagedPayloads: Array<{ sourceUrl: string; extracted: ImportedResortPayload }> = [];

    const filenameDuplicate = matchExistingResortByFilename(downloadedPdf.filename, existingIndex);
    if (filenameDuplicate) {
      logs.push({
        sourceUrl: downloadedPdf.sourceUrl,
        filename: downloadedPdf.filename,
        status: "skipped",
        provider: "system",
        message: "Skipped before AI extraction because the PDF filename matches an existing resort."
      });

      await supabase
        .from("import_batches")
        .update({ status: "completed_no_new_resorts" })
        .eq("id", (batchData as ImportBatchRow).id);

      return {
        ok: true,
        data: {
          batchId: (batchData as ImportBatchRow).id,
          importedResorts: 0,
          processedSources: 1,
          totalSources: 1,
          skippedSources: 1,
          warningCount: 0,
          errorCount: 0,
          providerUsed: "none",
          message: "Processed uploaded PDF: imported 0, skipped 1, warnings 0, errors 0.",
          logs: compactLogs(logs)
        }
      };
    }

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
        if (isDuplicateImportedResort(resort, existingIndex)) {
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
          await saveResort(toSaveResortInput(resort));

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

    if (stagedPayloads[0]) {
      await insertResortStagingRecord(
        (batchData as ImportBatchRow).id,
        {
          source: "stored-upload",
          filename: downloadedPdf.filename,
          sourceUrl: downloadedPdf.sourceUrl
        },
        buildCheckpointPayload(downloadedPdf.sourceUrl, downloadedPdf.filename, stagedPayloads[0].extracted)
      );
    }

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
        logs: compactLogs(logs)
      }
    };
  } catch (error) {
    await supabase.from("import_batches").update({ status: "failed" }).eq("id", (batchData as ImportBatchRow).id);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "The stored PDF import failed."
    };
  }
}

function mapImportBatchRelation(
  relation: ResortStagingRow["import_batches"]
): { batch_name: string; source_type: string } | null {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function mapCheckpointRow(row: ResortStagingRow): ImportCheckpointRecord {
  const relation = mapImportBatchRelation(row.import_batches);
  const extracted = row.extracted_payload ?? {};
  const raw = row.raw_payload ?? {};
  const checkpointPayload = extracted as Partial<ImportCheckpointPayload> & {
    items?: Array<{ resorts?: Array<Record<string, unknown>> }>;
  };
  const resorts = Array.isArray(checkpointPayload.resorts) ? (checkpointPayload.resorts as ImportedResort[]) : [];
  const sourceUrl =
    typeof checkpointPayload.sourceUrl === "string"
      ? checkpointPayload.sourceUrl
      : typeof raw.sourceUrl === "string"
        ? raw.sourceUrl
        : "";
  const filename =
    typeof checkpointPayload.filename === "string"
      ? checkpointPayload.filename
      : typeof raw.filename === "string"
        ? raw.filename
        : "Checkpoint";

  return {
    id: row.id,
    batchId: row.batch_id,
    batchName: relation?.batch_name ?? "Import checkpoint",
    sourceType: relation?.source_type ?? "unknown",
    sourceUrl,
    filename,
    notes: typeof checkpointPayload.notes === "string" ? checkpointPayload.notes : "",
    reviewStatus: row.review_status,
    createdAt: row.created_at,
    resorts,
    canPublish: resorts.length > 0 && checkpointPayload.checkpointVersion === 2
  };
}

export async function listImportCheckpoints(limit = 20): Promise<ImportCheckpointRecord[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("resort_staging")
      .select("id,batch_id,raw_payload,extracted_payload,review_status,created_at,import_batches(batch_name,source_type)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ResortStagingRow[]).map(mapCheckpointRow);
  } catch (error) {
    console.error("Failed to list import checkpoints", error);
    return [];
  }
}

export async function publishImportCheckpoint(input: {
  checkpointId: string;
  resortIndex: number;
}): Promise<ServiceResult<{ resortName: string; slug: string }>> {
  try {
    const checkpoints = await listImportCheckpoints(100);
    const checkpoint = checkpoints.find((item) => item.id === input.checkpointId);

    if (!checkpoint || !checkpoint.canPublish) {
      return {
        ok: false,
        error: "Checkpoint is not available for production publish."
      };
    }

    const resort = checkpoint.resorts[input.resortIndex];
    if (!resort) {
      return {
        ok: false,
        error: "Resort entry not found in the selected checkpoint."
      };
    }

    const existingIndex = buildExistingResortIdentityIndex(await listAdminResorts());
    if (isDuplicateImportedResort(resort, existingIndex)) {
      return {
        ok: false,
        error: `${resort.name.trim()} already exists in resorts.`
      };
    }

    const saveInput = toSaveResortInput(resort);
    await saveResort(saveInput);

    const supabase = createSupabaseAdminClient();
    await supabase.from("resort_staging").update({ review_status: "published" }).eq("id", checkpoint.id);

    return {
      ok: true,
      data: {
        resortName: resort.name.trim(),
        slug: saveInput.slug
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to publish the checkpoint."
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
