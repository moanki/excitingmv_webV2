import type { HomepageServiceItem, HomepageServicesContent } from "@/lib/site-content";

export function normalizeHomepageServices(value: unknown, defaults: HomepageServicesContent): HomepageServicesContent {
  const content = value && !Array.isArray(value) && typeof value === "object"
    ? value as Partial<HomepageServicesContent>
    : {};
  const source = Array.isArray(value) ? value : Array.isArray(content.items) ? content.items : defaults.items;
  const items = source.map((item, index) => {
    const saved = item as Partial<HomepageServiceItem>;
    const fallback = defaults.items[index] ?? defaults.items[0];
    const displayOrder = Number(saved.displayOrder);
    return {
      title: saved.title ?? fallback.title,
      description: saved.description ?? fallback.description,
      icon: saved.icon ?? fallback.icon,
      imageUrl: saved.imageUrl ?? fallback.imageUrl,
      imageAlt: saved.imageAlt ?? fallback.imageAlt,
      displayOrder: Number.isFinite(displayOrder) ? displayOrder : index + 1,
      enabled: saved.enabled ?? true
    };
  }).sort((a, b) => a.displayOrder - b.displayOrder);

  return {
    sectionLabel: content.sectionLabel ?? defaults.sectionLabel,
    title: content.title ?? defaults.title,
    description: content.description ?? defaults.description,
    items
  };
}
