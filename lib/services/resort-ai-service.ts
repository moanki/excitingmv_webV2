import { gatewayModelConfig } from "@/lib/ai/gateway-model-config";
import { env } from "@/lib/env";
import { z } from "zod";

export type ImportedRoom = {
  name: string;
  description: string;
  seoDescription: string;
  photoUrl: string;
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

type GatewayModelListResponse = {
  data?: Array<{ id?: string }>;
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

type GatewayDocumentInput = {
  sourceUrl: string;
  filename: string;
  bytes: Uint8Array;
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
  photoUrl: z.string()
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

let availableModelsPromise: Promise<Set<string>> | null = null;

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

async function getAvailableGatewayModels() {
  if (!availableModelsPromise) {
    availableModelsPromise = (async () => {
      const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getGatewayToken()}`
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch the Vercel AI Gateway model catalog.");
      }

      const payload = (await response.json()) as GatewayModelListResponse;
      return new Set((payload.data ?? []).map((model) => model.id).filter((id): id is string => Boolean(id)));
    })();
  }

  return availableModelsPromise;
}

async function getActiveModelChain(purpose: GatewayPurpose) {
  const configured = gatewayModelConfig[purpose];
  const available = await getAvailableGatewayModels();
  const active = configured.filter((model) => available.has(model));

  if (active.length === 0) {
    throw new Error(`No configured Vercel AI Gateway models are currently available for ${purpose}.`);
  }

  return active;
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
  const attemptedModels = await getActiveModelChain("resortSeo");
  const response = await fetch("https://ai-gateway.vercel.sh/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getGatewayToken()}`
    },
    body: JSON.stringify({
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
    })
  });

  const payload = (await response.json()) as GatewayResponsesPayload;
  if (!response.ok) {
    throw new Error(payload.error?.message || "Vercel AI Gateway could not generate resort SEO copy.");
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error("Vercel AI Gateway returned an empty SEO response.");
  }

  const parsed = resortSeoOutputSchema.parse(JSON.parse(outputText));
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
): Promise<GatewayGenerationResult<ImportedResortPayload>> {
  const attemptedModels = await getActiveModelChain("importCenter");
  const response = await fetch("https://ai-gateway.vercel.sh/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getGatewayToken()}`
    },
    body: JSON.stringify({
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
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: Buffer.from(document.bytes).toString("base64")
              }
            },
            {
              type: "text",
              text: `This PDF is one Maldives resort fact sheet from the Import Center.

Extract publish-ready structured data for exactly one resort when possible.

Rules:
- Return valid JSON that matches the schema exactly.
- Do not invent unavailable facts.
- Keep strings clean and professional.
- Generate SEO title, SEO description, and SEO summary for the resort.
- Generate an SEO description for each room type.
- Use "published_standard" only when the fact sheet clearly looks ready for normal publication; otherwise use "draft".
- Use "published_featured" only if the document clearly indicates flagship/homepage-worthy positioning. Default to "published_standard" or "draft" instead of overusing featured.
- If the PDF is not a resort fact sheet, return an empty resorts array and explain why in notes.

Source file: ${document.filename}`
            }
          ]
        }
      ]
    })
  });

  const payload = (await response.json()) as GatewayAnthropicPayload;
  if (!response.ok) {
    throw new Error(payload.error?.message || "Vercel AI Gateway could not extract the resort fact sheet.");
  }

  const outputText = extractAnthropicText(payload);
  if (!outputText) {
    throw new Error("Vercel AI Gateway returned an empty resort import response.");
  }

  const parsed = importedResortPayloadSchema.parse(JSON.parse(outputText));
  const usedModel = payload.model || attemptedModels[0];
  const result = {
    data: parsed,
    usedModel,
    usedProvider: providerFromModel(usedModel),
    attemptedModels,
    fallbackUsed: usedModel !== attemptedModels[0]
  };

  logGatewayOutcome("import_center", result);
  return result;
}
