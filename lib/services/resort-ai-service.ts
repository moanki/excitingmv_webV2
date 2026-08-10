import { gatewayModelConfig } from "@/lib/ai/gateway-model-config";
import { env } from "@/lib/env";
import { toErrorMessage } from "@/lib/error-message";
import { z } from "zod";

export type ImportedRoom = {
  name: string;
  description: string;
  seoDescription: string;
  photoUrl: string;
  sizeLabel: string;
  maxOccupancy: number | null;
  bedType: string;
  amenities: string[];
};

export type ImportedResort = {
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

export type ImportedResortPayload = {
  resorts: ImportedResort[];
  notes: string;
};

export type ResortSeoGenerationInput = {
  name: string;
  location: string;
  category: string;
  transferType: string;
  description: string;
  highlights: string[];
  mealPlans: string[];
};

export type ResortSeoGenerationOutput = {
  seoTitle: string;
  seoDescription: string;
  seoSummary: string;
};

export type GatewayGenerationResult<T> = {
  data: T;
  usedModel: string;
  usedProvider: string;
  attemptedModels: string[];
  fallbackUsed: boolean;
};

type GatewayResponsesPayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  model?: string;
  error?: { message?: string };
};

type GatewayAnthropicPayload = {
  model?: string;
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
};

type GatewayPurpose = keyof typeof gatewayModelConfig;

export type GatewayDocumentInput = {
  sourceUrl: string;
  filename: string;
  bytes: Uint8Array;
};

export type MarkItDownStats = {
  processor: string;
  outputFormat: string;
  encoding: string;
  markdownVersion: string;
  originalFileSize: number;
  pageCount: number;
  markdownSize: number;
  markdownCharacters: number;
  markdownLines: number;
  headingsDetected: number;
  tablesDetected: number;
  listsDetected: number;
  imagesReferenced: number;
  averageCharactersPerPage: number | null;
  chunksCreated: number;
  chunkStrategy: string;
  ocrUsed: boolean;
  fallbackUsed: boolean;
  conversionDurationMs: number;
  aiProcessingDurationMs?: number;
};

export type MarkItDownResult = {
  markdown: string;
  stats: MarkItDownStats;
};

const resortSeoOutputSchema = z.object({
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
  seoSummary: z.string().min(1)
});

const importedRoomSchema = z.object({
  name: z.string(),
  description: z.string(),
  seoDescription: z.string(),
  photoUrl: z.string(),
  sizeLabel: z.string(),
  maxOccupancy: z.number().int().nullable(),
  bedType: z.string(),
  amenities: z.array(z.string())
});

const importedResortSchema = z.object({
  name: z.string(),
  slug: z.string(),
  location: z.string(),
  category: z.string(),
  transferType: z.string(),
  description: z.string(),
  highlights: z.array(z.string()),
  mealPlans: z.array(z.string()),
  seoTitle: z.string(),
  seoDescription: z.string(),
  seoSummary: z.string(),
  heroImageUrl: z.string(),
  galleryMediaUrls: z.array(z.string()),
  publishingMode: z.enum(["draft", "published_standard", "published_featured"]),
  roomTypes: z.array(importedRoomSchema)
});

const importedResortPayloadSchema = z.object({
  resorts: z.array(importedResortSchema),
  notes: z.string()
});

const GATEWAY_TIMEOUT_MS = 85_000;

function fileExtension(filename: string) {
  const extension = filename.match(/\.(pdf|xlsx|xlsm|docx)$/iu)?.[0].toLowerCase();
  return extension ?? ".pdf";
}

export async function convertDocumentToMarkdown(document: GatewayDocumentInput): Promise<MarkItDownResult> {
  const serviceToken = (env.MARKITDOWN_SERVICE_TOKEN || env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!serviceToken) throw new Error("MARKITDOWN_SERVICE_TOKEN or SUPABASE_SERVICE_ROLE_KEY is required for Microsoft MarkItDown conversion.");

  const deploymentHost = env.VERCEL_URL?.trim().replace(/^https?:\/\//u, "").replace(/\/$/u, "");
  const origin = deploymentHost ? `https://${deploymentHost}` : env.NEXT_PUBLIC_APP_URL.replace(/\/$/u, "");
  const response = await fetch(`${origin}/api/markitdown_convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceToken}`,
      "X-MarkItDown-Token": serviceToken
    },
    body: JSON.stringify({
      ...(document.sourceUrl.startsWith("https://") ? { sourceUrl: document.sourceUrl } : { contentBase64: Buffer.from(document.bytes).toString("base64") }),
      filename: document.filename,
      fileExtension: fileExtension(document.filename)
    }),
    signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS)
  });
  const payload = (await response.json().catch(() => null)) as (MarkItDownResult & { ok?: boolean; error?: unknown }) | null;
  if (!response.ok || !payload?.ok || !payload.markdown?.trim()) {
    if (response.status === 401) {
      throw new Error("Microsoft MarkItDown rejected the staging service token. Check SUPABASE_SERVICE_ROLE_KEY in the staging/Preview environment and redeploy.");
    }
    const message = toErrorMessage(payload?.error, `Microsoft MarkItDown conversion failed (HTTP ${response.status}).`);
    console.error("[markitdown] conversion request failed", { status: response.status, message });
    throw new Error(message);
  }
  return { markdown: payload.markdown, stats: payload.stats };
}

async function convertPdfToMarkdown(document: GatewayDocumentInput): Promise<MarkItDownResult> {
  return convertDocumentToMarkdown(document);
}

const resortSeoJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["seoTitle", "seoDescription", "seoSummary"],
  properties: {
    seoTitle: { type: "string" },
    seoDescription: { type: "string" },
    seoSummary: { type: "string" }
  }
} as const;

const importedResortJsonSchema = {
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
              required: ["name", "description", "seoDescription", "photoUrl", "sizeLabel", "maxOccupancy", "bedType", "amenities"],
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                seoDescription: { type: "string" },
                photoUrl: { type: "string" },
                sizeLabel: { type: "string" },
                maxOccupancy: { type: ["integer", "null"] },
                bedType: { type: "string" },
                amenities: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        }
      }
    },
    notes: { type: "string" }
  }
} as const;

function getGatewayToken() {
  const token = env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN;
  if (!token) {
    throw new Error("AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN is required for resort AI requests.");
  }

  return token;
}

function sanitizeLine(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeParagraph(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function providerFromModel(model: string) {
  return model.split("/")[0] || "unknown";
}

function extractJsonCandidate(value: string) {
  const trimmed = value.trim();
  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = codeFenceMatch?.[1]?.trim() || trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return candidate.slice(firstBrace, lastBrace + 1);
  }

  return candidate;
}

function extractOutputText(payload: GatewayResponsesPayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const texts: string[] = [];
  (payload.output ?? []).forEach((item) => {
    if (item.type !== "message") {
      return;
    }

    (item.content ?? []).forEach((content) => {
      if (content.type === "output_text" && typeof content.text === "string") {
        texts.push(content.text);
      }
    });
  });

  return texts.join("\n").trim();
}

function extractAnthropicText(payload: GatewayAnthropicPayload) {
  return (payload.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n")
    .trim();
}

async function fetchGateway(path: "/v1/messages" | "/v1/responses", body: object) {
  try {
    return await fetch(`https://ai-gateway.vercel.sh${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getGatewayToken()}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS)
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error(`Vercel AI Gateway timed out after ${Math.round(GATEWAY_TIMEOUT_MS / 1000)} seconds.`);
    }

    throw error;
  }
}

function getActiveModelChain(purpose: GatewayPurpose) {
  const configured = gatewayModelConfig[purpose];

  if (configured.length === 0) {
    throw new Error(`No Vercel AI Gateway models are configured for ${purpose}.`);
  }

  return configured;
}

function gatewayFailureMessage(purpose: GatewayPurpose, attemptedModels: string[], message: string) {
  return `Vercel AI Gateway request failed for ${purpose} using model chain ${attemptedModels.join(" -> ")}. ${message}`;
}

async function parseGatewayStructuredOutput<T>(options: {
  rawText: string;
  schema: z.ZodType<T>;
  schemaName: string;
  jsonSchema: object;
  purpose: GatewayPurpose;
}) {
  const candidate = extractJsonCandidate(options.rawText);

  try {
    return options.schema.parse(JSON.parse(candidate));
  } catch (error) {
    const attemptedModels = getActiveModelChain(options.purpose);
    const repairResponse = await fetchGateway("/v1/responses", {
        model: attemptedModels[0],
        input: [
          {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Repair the following malformed JSON-like model output into valid strict JSON matching the required schema. Preserve the extracted facts only. Do not invent facts. If a field is missing, use an empty string, empty array, or null as appropriate. Return JSON only.\n\nMalformed output:\n" +
                  candidate
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: options.schemaName,
            strict: true,
            schema: options.jsonSchema
          }
        },
        reasoning: {
          effort: "low"
        },
        providerOptions: {
          gateway: {
            models: attemptedModels.slice(1),
            tags: ["feature:structured-json-repair", `surface:${options.purpose}`]
          }
        }
      });

    const repairPayload = (await repairResponse.json()) as GatewayResponsesPayload;
    if (!repairResponse.ok) {
      throw new Error(
        gatewayFailureMessage(
          options.purpose,
          attemptedModels,
          repairPayload.error?.message || (error instanceof Error ? error.message : "Failed to parse structured AI output.")
        )
      );
    }

    const repairedText = extractOutputText(repairPayload);
    if (!repairedText) {
      throw new Error("The AI gateway returned empty repaired JSON output.");
    }

    return options.schema.parse(JSON.parse(extractJsonCandidate(repairedText)));
  }
}

function logGatewayOutcome(feature: string, result: { usedModel: string; attemptedModels: string[] }) {
  const usedProvider = providerFromModel(result.usedModel);
  const fallbackUsed = result.usedModel !== result.attemptedModels[0];

  console.info("[ai-gateway]", {
    feature,
    usedModel: result.usedModel,
    usedProvider,
    attemptedModels: result.attemptedModels,
    fallbackUsed
  });
}

export async function generateResortSeoCopy(
  input: ResortSeoGenerationInput
): Promise<GatewayGenerationResult<ResortSeoGenerationOutput>> {
  const attemptedModels = getActiveModelChain("resortSeo");
  const response = await fetchGateway("/v1/responses", {
      model: attemptedModels[0],
      input: [
        {
          type: "message",
          role: "user",
          content: `You are writing SEO copy for a luxury Maldives resort website admin workflow.

Create polished, factual, tourism-appropriate SEO fields for this resort.

Rules:
- Keep the tone premium, clear, and professional.
- Do not invent facts that are not supported by the input.
- Mention the Maldives context naturally when relevant.
- Avoid hype, filler, exclamation marks, and keyword stuffing.
- SEO title should be concise.
- SEO description should read like a high-quality meta description.
- SEO summary should be a short editorial summary for internal/public reuse.

Resort input:
- Name: ${input.name || "Unknown"}
- Atoll / Location: ${input.location || "Not provided"}
- Category: ${input.category || "Not provided"}
- Transfer type: ${input.transferType || "Not provided"}
- Description: ${input.description || "Not provided"}
- Highlights: ${input.highlights.join(", ") || "None"}
- Meal plans: ${input.mealPlans.join(", ") || "None"}`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "resort_seo_fields",
          strict: true,
          schema: resortSeoJsonSchema
        }
      },
      reasoning: {
        effort: "medium"
      },
      providerOptions: {
        gateway: {
          models: attemptedModels.slice(1),
          tags: ["feature:resort-seo", "surface:admin-resorts"]
        }
      }
    });

  const payload = (await response.json()) as GatewayResponsesPayload;
  if (!response.ok) {
    throw new Error(
      gatewayFailureMessage(
        "resortSeo",
        attemptedModels,
        payload.error?.message || "Vercel AI Gateway could not generate resort SEO copy."
      )
    );
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error("Vercel AI Gateway returned an empty SEO response.");
  }

  const parsed = await parseGatewayStructuredOutput({
    rawText: outputText,
    schema: resortSeoOutputSchema,
    schemaName: "resort_seo_fields",
    jsonSchema: resortSeoJsonSchema,
    purpose: "resortSeo"
  });
  const usedModel = payload.model || attemptedModels[0];
  const data = {
    seoTitle: sanitizeLine(parsed.seoTitle, 70),
    seoDescription: sanitizeParagraph(parsed.seoDescription, 180),
    seoSummary: sanitizeParagraph(parsed.seoSummary, 220)
  };

  const result = {
    data,
    usedModel,
    usedProvider: providerFromModel(usedModel),
    attemptedModels,
    fallbackUsed: usedModel !== attemptedModels[0]
  };

  logGatewayOutcome("resort_seo", result);
  return result;
}

export async function extractImportedResortsFromPdf(
  document: GatewayDocumentInput
): Promise<GatewayGenerationResult<ImportedResortPayload> & { preprocessing: MarkItDownResult }> {
  const preprocessing = await convertPdfToMarkdown(document);
  const attemptedModels = getActiveModelChain("importCenter");
  const aiStartedAt = Date.now();
  const response = await fetchGateway("/v1/messages", {
      model: attemptedModels[0],
      max_tokens: 4096,
      providerOptions: {
        gateway: {
          models: attemptedModels.slice(1),
          tags: ["feature:import-center", "surface:admin-imports"]
        }
      },
      output_config: {
        format: {
          type: "json_schema",
          schema: importedResortJsonSchema
        }
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `The following Markdown was generated from one PDF by Microsoft MarkItDown. It is one Maldives resort fact sheet from the Import Center.

Extract publish-ready structured data for exactly one resort when possible.

Rules:
- Return valid JSON that matches the schema exactly.
- Do not invent unavailable facts.
- Keep strings clean and professional.
- Generate SEO title, SEO description, and SEO summary for the resort.
- Generate an SEO description for each room type.
- You must extract every accommodation type listed in the PDF.
- Look for sections or tables named Accommodation, Villas, Rooms, Suites, Residences, Bungalows, Room Categories, Stay, or similar.
- Treat each named villa, room, suite, residence, bungalow, or accommodation category as one roomTypes item.
- Do not skip room types just because descriptions are short.
- If a room type has only a name and limited details, still include it with the available information.
- For each room type, extract:
  - name
  - description
  - seoDescription
  - sizeLabel if available, otherwise empty string
  - maxOccupancy if available, otherwise null
  - bedType if available, otherwise empty string
  - amenities if available, otherwise []
  - photoUrl if explicitly available, otherwise empty string
- If the PDF appears to contain accommodation information but you cannot confidently extract room types, use "draft" and explain the issue in notes.
- Only return roomTypes: [] if the document genuinely contains no accommodation, room, villa, suite, residence, or bungalow information.
- Default to "published_standard" for a normal usable resort fact sheet.
- Use "draft" only when the extraction is materially incomplete or the document is clearly not ready for publication.
- Use "published_featured" only if the document clearly indicates flagship/homepage-worthy positioning. Do not overuse featured.
- If the PDF is not a resort fact sheet, return an empty resorts array and explain why in notes.

Source file: ${document.filename}

MARKDOWN START
${preprocessing.markdown}
MARKDOWN END`
            }
          ]
        }
      ]
    });

  const payload = (await response.json()) as GatewayAnthropicPayload;
  if (!response.ok) {
    throw new Error(
      gatewayFailureMessage(
        "importCenter",
        attemptedModels,
        payload.error?.message || "Vercel AI Gateway could not extract the resort fact sheet."
      )
    );
  }

  const outputText = extractAnthropicText(payload);
  if (!outputText) {
    throw new Error("Vercel AI Gateway returned an empty resort import response.");
  }

  const parsed = await parseGatewayStructuredOutput({
    rawText: outputText,
    schema: importedResortPayloadSchema,
    schemaName: "imported_resort_payload",
    jsonSchema: importedResortJsonSchema,
    purpose: "importCenter"
  });
  const usedModel = payload.model || attemptedModels[0];
  preprocessing.stats.aiProcessingDurationMs = Date.now() - aiStartedAt;
  const result = {
    data: parsed,
    usedModel,
    usedProvider: providerFromModel(usedModel),
    attemptedModels,
    fallbackUsed: usedModel !== attemptedModels[0],
    preprocessing
  };

  logGatewayOutcome("import_center", result);
  return result;
}
