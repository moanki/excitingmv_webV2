import type { HomepageWhyUsContent } from "@/lib/site-content";

export function normalizeHomepageWhyUs(value: unknown, defaults: HomepageWhyUsContent): HomepageWhyUsContent {
  // Older settings contain only the reasons array.
  if (Array.isArray(value)) return { ...defaults, items: value };
  const content = value && typeof value === "object" ? value as Partial<HomepageWhyUsContent> : {};
  return {
    imageUrl: content.imageUrl ?? defaults.imageUrl,
    items: Array.isArray(content.items) ? content.items : defaults.items
  };
}
