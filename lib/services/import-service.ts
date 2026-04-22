import { env } from "@/lib/env";
import { saveResort } from "@/lib/services/resort-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PublishStatus, ServiceResult } from "@/lib/types";
import { aiImportRequestSchema } from "@/lib/validations";
import type { z } from "zod";

type AiImportRequestInput = z.infer<typeof aiImportRequestSchema>;

type ImportRow = {
  id: string;
  batch_name: string;
  source_type: string;
  file_path: string | null;
  status: string;
  created_at: string;
};

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

type ImportBatchRecord = {
  id: string;
  batchName: string;
  sourceType: string;
  sourcePath: string;
  status: string;
  createdAt: string;
};

type ImportExecutionResult = {
  batchId: string;
  importedResorts: number;
  processedSources: number;
  message: string;
};

type OpenAiImportPayload = {
  resorts: ImportedResort[];
  notes: string;
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
    return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
  }

  const docMatch = parsed.pathname.match(/\/document\/d\/([^/]+)/);
  if (docMatch?.[1]) {
    return `https://docs.google.com/document/d/${docMatch[1]}/export?format=pdf`;
  }

  const sheetMatch = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (sheetMatch?.[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=pdf`;
  }

  const slideMatch = parsed.pathname.match(/\/presentation\/d\/([^/]+)/);
  if (slideMatch?.[1]) {
    return `https://docs.google.com/presentation/d/${slideMatch[1]}/export/pdf`;
  }

  return url;
}

async function resolveGoogleDriveSources(url: string) {
  const parsed = new URL(url);
  const folderMatch = parsed.pathname.match(/\/drive\/folders\/([^/?]+)/);
  if (!folderMatch?.[1]) {
    return [normalizeGoogleDriveFileUrl(url)];
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to read the Google Drive folder. Make sure the folder is publicly accessible.");
  }

  const html = await response.text();
  const matches = Array.from(
    html.matchAll(/https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d|document\/d|spreadsheets\/d|presentation\/d)\/[^"'&<\s]+/g)
  )
    .map((match) => normalizeGoogleDriveFileUrl(match[0]))
    .filter(Boolean);

  const uniqueMatches = Array.from(new Set(matches));
  if (!uniqueMatches.length) {
    throw new Error("No readable Google Drive files were found in that folder.");
  }

  return uniqueMatches;
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

async function requestOpenAiResortExtraction(fileUrls: string[], sourceUrl: string) {
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
                "Extract resort fact sheet information into structured JSON for direct publishing. Return every resort in the files. Create concise, polished SEO descriptions for the resort and each room type. If an image URL is not explicitly present, leave heroImageUrl and photoUrl as empty strings. Use published_standard when the resort has enough information for a public listing; otherwise use draft. Source URL: " +
                sourceUrl
            },
            ...fileUrls.map((fileUrl) => ({
              type: "input_file",
              file_url: fileUrl
            }))
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
      source_type: "google_drive",
      file_path: sourceUrl,
      status: "processing"
    })
    .select("id, batch_name, status")
    .single();

  if (batchError || !batchData) {
    return {
      ok: false,
      error: "Failed to start the import batch.",
      status: 500,
      details: batchError
    };
  }

  try {
    const fileUrls = await resolveGoogleDriveSources(sourceUrl);
    const extracted = await requestOpenAiResortExtraction(fileUrls, sourceUrl);
    const importedResorts = extracted.resorts.filter((resort) => resort.name.trim());

    if (!importedResorts.length) {
      throw new Error("No resorts were extracted from the supplied Google Drive source.");
    }

    for (const resort of importedResorts) {
      const publishing = publishingToStatus(resort.publishingMode);
      await saveResort({
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
            photoUrl: room.photoUrl.trim()
          })),
        status: publishing.status,
        isFeaturedHomepage: publishing.isFeaturedHomepage
      });
    }

    await supabase.from("resort_staging").insert({
      batch_id: batchData.id,
      raw_payload: {
        sourceUrl,
        resolvedFiles: fileUrls
      },
      extracted_payload: extracted,
      review_status: "ready"
    });

    await supabase.from("import_batches").update({ status: "completed" }).eq("id", batchData.id);

    return {
      ok: true,
      data: {
        batchId: batchData.id,
        importedResorts: importedResorts.length,
        processedSources: fileUrls.length,
        message: `Imported ${importedResorts.length} resort${importedResorts.length === 1 ? "" : "s"} from Google Drive.`
      }
    };
  } catch (error) {
    await supabase.from("import_batches").update({ status: "failed" }).eq("id", batchData.id);

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
