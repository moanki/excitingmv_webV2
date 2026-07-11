import { env } from "@/lib/env";

function parseModelList(raw: string | undefined, fallback: string[]) {
  const seen = new Set<string>();
  const items = (raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) {
        return false;
      }

      seen.add(item);
      return true;
    });

  return items.length > 0 ? items : fallback;
}

export const gatewayModelConfig = {
  resortSeo: parseModelList(env.AI_GATEWAY_PREFERRED_MODELS, [
    "anthropic/claude-opus-4.8",
    "openai/gpt-5.4",
    "anthropic/claude-sonnet-4.6",
    "google/gemini-3.1-pro-preview"
  ]),
  importCenter: parseModelList(env.AI_GATEWAY_IMPORT_MODELS, [
    "anthropic/claude-opus-4.8",
    "anthropic/claude-sonnet-4.6"
  ])
} as const;
