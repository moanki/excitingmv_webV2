import { z } from "zod";

const text = z.string().trim().max(3000);
const short = z.string().trim().max(180);
const required = short.min(1, "This field is required.");
const url = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try { const parsed = new URL(value); return ["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password; }
  catch { return false; }
}, "Use a full http:// or https:// URL.");
const id = z.string().regex(/^[a-zA-Z0-9-]{1,80}$/, "Use letters, numbers and hyphens for the ID.");
const date = z.string().refine((value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Choose a valid date.");

export const openingSchema = z.object({
  id, sectionId: id, name: required, atoll: short, operator: short,
  openingYear: z.number().int().min(2000).max(2200).nullable(),
  launchDate: date,
  dateLabel: required, status: required, dateMoved: z.boolean(), note: text,
  highlights: text, keyCount: z.number().int().min(0).max(10000).nullable(), keysLabel: short,
  imageUrl: url, imageAlt: short, imageCaption: short, officialUrl: url, sourceUrl: url,
  checkedOn: date, enabled: z.boolean(), featuredOnHomepage: z.boolean().optional()
});

export const defaultUpcomingHomepage = {
  eyebrow: "Opening watch",
  title: "Opening soon in the Maldives",
  description: "Track new resorts before they launch. Explore the latest opening targets and see which dates have moved.",
  viewAllLabel: "View all openings",
  exploreLabel: "Explore upcoming resorts",
  openingsLabel: "openings across {atolls} atolls"
};

export const upcomingPageSchema = z.object({
  enabled: z.boolean(), seoTitle: required, seoDescription: text,
  eyebrow: short, title: required, subtitle: short, description: text,
  bannerUrl: url, bannerAlt: short, bannerCaption: short,
  jumpLabel: required, askLabel: required, teamUrl: z.string().refine((v) => v === "/team", "Ask our team links to /team."),
  officialLabel: required, sourceLabel: required, dateMovedLabel: required, checkedLabel: required,
  emptyMessage: required, keysUnit: short,
  stats: z.array(z.object({ id, label: required, metric: z.enum(["openings", "atolls", "keys", "moved", "custom"]), value: short })).max(6),
  sections: z.array(z.object({ id, title: required, description: text, jumpLabel: short, enabled: z.boolean() })).min(1).max(30),
  guidanceTitle: short, guidanceBody: text, ctaTitle: short, ctaBody: text, ctaLabel: short,
  disclaimer: text, resorts: z.array(openingSchema).max(150),
  homepage: z.object({
    title: required, description: text, viewAllLabel: required, exploreLabel: required,
    eyebrow: short.optional(), openingsLabel: required.optional(), keysLabel: required.optional(), movedLabel: required.optional(),
    movedLinkLabel: required.optional(), dateNote: short.optional()
  }).optional()
}).superRefine((value, ctx) => {
  for (const [key, entries] of [["sections", value.sections], ["resorts", value.resorts], ["stats", value.stats]] as const) {
    if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
      ctx.addIssue({ code: "custom", path: [key], message: "Each entry needs a unique ID." });
  }
  value.resorts.forEach((resort, i) => {
    if (!value.sections.some((section) => section.id === resort.sectionId))
      ctx.addIssue({ code: "custom", path: ["resorts", i, "sectionId"], message: "Choose an existing year section." });
    if (resort.launchDate && resort.openingYear !== Number(resort.launchDate.slice(0, 4)))
      ctx.addIssue({ code: "custom", path: ["resorts", i, "launchDate"], message: "Launch date must match the opening year." });
  });
});

export type UpcomingPageContent = z.infer<typeof upcomingPageSchema>;
export type OpeningResort = z.infer<typeof openingSchema>;
export const UPCOMING_SETTING_KEY = "site.upcomingResorts";

export function calendarValidationMessage(issue: z.ZodIssue, input: unknown) {
  const page = input as Partial<UpcomingPageContent> | null;
  const [group, index, field] = issue.path;
  const names: Record<string, string> = {
    name: "Resort name", atoll: "Atoll", operator: "Operator / developer", openingYear: "Opening year",
    launchDate: "Exact launch date", dateLabel: "Date shown on page", status: "Status", highlights: "Highlights",
    keyCount: "Number of keys", keysLabel: "Keys shown on card", officialUrl: "Official website URL",
    sourceUrl: "Verified source URL", checkedOn: "Source checked on", sectionId: "Year section",
    imageUrl: "Resort image", imageAlt: "Image description", imageCaption: "Photo / render credit",
    title: "Main heading", seoTitle: "Search engine title", bannerUrl: "Banner image", label: "Label",
    jumpLabel: "Jump navigation label", askLabel: "Ask our team link text", officialLabel: "Official website label",
    sourceLabel: "Verified source label", dateMovedLabel: "Date moved badge", checkedLabel: "Source checked label",
    emptyMessage: "No openings message"
  };
  if (group === "resorts" && typeof index === "number") {
    const resort = page?.resorts?.[index];
    return `${resort?.name || `Resort ${index + 1}`} — ${names[String(field)] || "Resort details"}: ${issue.message} Open Resort openings to correct it.`;
  }
  if (group === "sections" || group === "stats") {
    const entry = typeof index === "number" ? page?.[group]?.[index] : null;
    const title = entry && ("title" in entry ? entry.title : entry.label);
    return `${title || (group === "sections" ? "Year sections" : "Statistics")}: ${issue.message} Open Years & statistics to correct it.`;
  }
  return `${names[String(group)] || "Page settings"}: ${issue.message} Check the corresponding page settings tab.`;
}

export function visibleOpenings(content: UpcomingPageContent) {
  const sections = new Set(content.sections.filter((s) => s.enabled).map((s) => s.id));
  return content.resorts.filter((resort) => resort.enabled && sections.has(resort.sectionId));
}

export function featuredOpenings(content: UpcomingPageContent) {
  return content.enabled ? visibleOpenings(content).filter((resort) => resort.featuredOnHomepage) : [];
}

export function openingFigures(resorts: OpeningResort[]) {
  return {
    openings: resorts.length,
    atolls: new Set(resorts.map((r) => r.atoll.trim().toLowerCase()).filter(Boolean)).size,
    keys: resorts.reduce((sum, resort) => sum + (resort.keyCount ?? 0), 0),
    moved: resorts.filter((r) => r.dateMoved).length
  };
}

export function openingStats(content: UpcomingPageContent) {
  const figures = { ...openingFigures(visibleOpenings(content)), custom: "" };
  return content.stats.map((stat) => ({ ...stat, displayValue: stat.value || String(figures[stat.metric]) }));
}
