import type { HomepageGuideItem } from "@/lib/site-content";
import type { ResortSummary } from "@/lib/types";

const insightRules = [
  { terms: ["honeymoon"], label: "Honeymoon clients" },
  { terms: ["speedboat"], label: "Speedboat access" },
  { terms: ["seaplane"], label: "Seaplane positioning" },
  { terms: ["family", "families"], label: "Family clients" },
  { terms: ["atoll"], label: "Atoll planning" },
  { terms: ["room type", "villa"], label: "Product knowledge" },
  { terms: ["season", "booking"], label: "Demand planning" },
  { terms: ["privacy", "private pool"], label: "Privacy seekers" }
] as const;

function guideText(guide: HomepageGuideItem) {
  return [
    guide.category,
    guide.title,
    guide.summary,
    guide.mainContent,
    ...guide.tips,
    ...guide.sections.flatMap((section) => [section.heading, section.body])
  ].join(" ").toLowerCase();
}

export function travelGuideReadTime(guide: HomepageGuideItem) {
  const words = guideText(guide).trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(2, Math.ceil(words / 200))} min`;
}

export function travelGuideTags(guide: HomepageGuideItem) {
  const text = guideText(guide);
  return insightRules
    .filter((rule) => rule.terms.some((term) => text.includes(term)))
    .map((rule) => rule.label)
    .slice(0, 3);
}

export function relatedResortsForGuide(guide: HomepageGuideItem, resorts: ResortSummary[]) {
  const text = guideText(guide);
  const relevantRules = insightRules.filter(
    (rule) => rule.label !== "Atoll planning" && rule.terms.some((term) => text.includes(term))
  );

  if (!relevantRules.length) return [];

  // ponytail: text matching is deliberately conservative; replace with explicit article tags if editors need manual control.
  return resorts
    .map((resort) => {
      const resortText = [
        resort.location,
        resort.category,
        resort.transferType,
        resort.summary,
        ...(resort.selectionTags ?? []),
        ...(resort.highlights ?? [])
      ].join(" ").toLowerCase();
      const score = relevantRules.filter((rule) => rule.terms.some((term) => resortText.includes(term))).length;
      return { resort, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => item.resort);
}
