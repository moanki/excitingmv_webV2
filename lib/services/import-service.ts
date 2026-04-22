import { env } from "@/lib/env";
import { listAdminResorts, saveResort } from "@/lib/services/resort-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PublishStatus, ServiceResult } from "@/lib/types";
import { aiImportRequestSchema } from "@/lib/validations";
import type { z } from "zod";

type AiImportRequestInput = z.infer<typeof aiImportRequestSchema>;

type ImportedRoom = {
  name: string;
  description: string;
  seoDescription: string;
  photoUrl: string;
};

type ImportedResort = {
  name: string;
  slug: string;
  location: string;
  category: string;
  transferType: string;
  description: string;
  highlights: string[];
  mealPlans: string[];
  seoTitle: string;
  seoDescription: string;
  seoSummary: string;
  heroImageUrl: string;
  galleryMediaUrls: string[];
  publishingMode: "draft" | "published_standard" | "published_featured";
  roomTypes: ImportedRoom[];
};

type OpenAiImportPayload = {
  resorts: ImportedResort[];
  notes: string;
};

type ImportExecutionResult = {
  batchId: string;
  importedResorts: number;
  processedSources: number;
  message: string;
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

type UploadedPdf = {
  fileId: string;
  sourceUrl: string;
  filename: string;
};

type ImportBatchRow = {
  id: string;
};

const importSchema = {
  type: "object",
  additionalProperties: false,
  required: ["resorts", "notes"],
  properties: {
    resorts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "slug",
          "location",
          "category",
          "transferType",
          "description",
          "highlights",
          "mealPlans",
          "seoTitle",
          "seoDescription",
          "seoSummary",
          "heroImageUrl",
          "galleryMediaUrls",
          "publishingMode",
          "roomTypes"
        ],
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          location: { type: "string" },
          category: { type: "string" },
          transferType: { type: "string" },
          description: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
          mealPlans: { type: "array", items: { type: "string" } },
          seoTitle: { type: "string" },
          seoDescription: { type: "string" },
          seoSummary: { type: "string" },
          heroImageUrl: { type: "string" },
          galleryMediaUrls: { type: "array", items: { type: "string" } },
          publishingMode: {
            type: "string",
            enum: ["draft", "published_standard", "published_featured"]
          },
          roomTypes: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "description", "seoDescription", "photoUrl"],
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                seoDescription: { type: "string" },
                photoUrl: { type: "string" }
              }
            }
          }
        }
      }
    },
    notes: { type: "string" }
  }
} as const;

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

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text) {
    return payload.output_text;
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  const texts: string[] = [];

  output.forEach((item: any) => {
    if (item?.type !== "message" || !Array.isArray(item.content)) {
      return;
    }

    item.content.forEach((content: any) => {
      if (content?.type === "output_text" && typeof content.text === "string") {
        texts.push(content.text);
      }
    });
  });

  return texts.join("\n").trim();
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

async function uploadPdfToOpenAi(sourceUrl: string, index: number): Promise<UploadedPdf> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to import resorts from Google Drive.");
  }

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

  const blob = await response.blob();
  const filename = guessFilenameFromUrl(sourceUrl, index);
  const formData = new FormData();
  formData.append("purpose", "user_data");
  formData.append("file", new File([blob], filename, { type: "application/pdf" }));

  const uploadResponse = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: formData
  });

  const uploadPayload = await uploadResponse.json();
  if (!uploadResponse.ok || typeof uploadPayload?.id !== "string") {
    const message =
      typeof uploadPayload?.error?.message === "string"
        ? uploadPayload.error.message
        : "OpenAI rejected the uploaded PDF.";
    throw new Error(message);
  }

  return {
    fileId: uploadPayload.id,
    sourceUrl,
    filename
  };
}

async function requestOpenAiResortExtraction(uploadedPdf: UploadedPdf) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to import resorts from Google Drive.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-5",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "This PDF is one resort fact sheet. Extract exactly one resort if possible. Create publish-ready resort data including SEO descriptions for the resort and each room type. If a field is missing, leave it empty instead of inventing it."
            },
            {
              type: "input_file",
              file_id: uploadedPdf.fileId
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "resort_import_payload",
          strict: true,
          schema: importSchema
        }
      }
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : "OpenAI could not extract the resort fact sheet.";
    throw new Error(message);
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error("OpenAI returned an empty import response.");
  }

  return JSON.parse(outputText) as OpenAiImportPayload;
}

async function deleteOpenAiFile(fileId: string) {
  if (!env.OPENAI_API_KEY) {
    return;
  }

  await fetch(`https://api.openai.com/v1/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    }
  }).catch(() => undefined);
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
    const stagedPayloads: Array<{ sourceUrl: string; extracted: OpenAiImportPayload }> = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
      const uploadedPdf = await uploadPdfToOpenAi(sourceFiles[index], index);

      try {
        const extracted = await requestOpenAiResortExtraction(uploadedPdf);
        stagedPayloads.push({ sourceUrl: sourceFiles[index], extracted });

        const resort = extracted.resorts.find((item) => item.name.trim());
        if (!resort) {
          continue;
        }

        const slug = slugify(resort.slug || resort.name);
        const normalizedName = resort.name.trim().toLowerCase();

        if (existingSlugs.has(slug) || existingNames.has(normalizedName)) {
          skippedCount += 1;
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
      } finally {
        await deleteOpenAiFile(uploadedPdf.fileId);
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
      .update({ status: importedCount > 0 ? "completed" : "completed_no_new_resorts" })
      .eq("id", (batchData as ImportBatchRow).id);

    return {
      ok: true,
      data: {
        batchId: (batchData as ImportBatchRow).id,
        importedResorts: importedCount,
        processedSources: sourceFiles.length,
        message: `Processed ${sourceFiles.length} PDF${sourceFiles.length === 1 ? "" : "s"}: imported ${importedCount}, skipped ${skippedCount} existing resort${skippedCount === 1 ? "" : "s"}.`
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
