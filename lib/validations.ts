import { z } from "zod";

const SAFE_MEDIA_PROTOCOLS = new Set(["https:", "http:"]);
const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const UNSAFE_MEDIA_PROTOCOLS = new Set(["javascript:", "data:", "blob:", "file:", "ftp:"]);

export function safeMediaUrlError(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return "Protocol-relative media URLs are not allowed. Use a full https:// URL.";

  try {
    const parsed = new URL(trimmed);
    if (UNSAFE_MEDIA_PROTOCOLS.has(parsed.protocol) || !SAFE_MEDIA_PROTOCOLS.has(parsed.protocol)) {
      return "Media URL must use https://. Localhost http:// is allowed only in development.";
    }
    if (parsed.protocol === "http:" && !LOCALHOST_HOSTS.has(parsed.hostname)) {
      return "Only https:// media URLs are allowed outside localhost development.";
    }
    return "";
  } catch {
    return "Enter a valid media URL.";
  }
}

export function isSafeMediaUrl(value: string | null | undefined) {
  return !value?.trim() || !safeMediaUrlError(value);
}

export function normalizeSafeMediaUrl(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  const error = safeMediaUrlError(trimmed);
  if (error) {
    throw new Error(error);
  }
  return trimmed;
}

const trimmedString = z.string().transform((value) => value.trim());

const optionalSafeMediaUrlSchema = z
  .string()
  .trim()
  .default("")
  .refine((value) => !safeMediaUrlError(value), (value) => ({ message: safeMediaUrlError(value) || "Invalid media URL." }));

const safeStringArraySchema = z
  .array(z.string())
  .default([])
  .transform((items) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean))));

export const adminResortSubmitIntentSchema = z.enum([
  "saveDraft",
  "publish",
  "updatePublished",
  "unpublish",
  "archive",
  "restoreDraft"
]);

export const adminResortRoomSchema = z
  .object({
    name: trimmedString.default(""),
    description: trimmedString.default(""),
    seoDescription: trimmedString.default(""),
    photoUrl: optionalSafeMediaUrlSchema,
    sizeLabel: trimmedString.default(""),
    maxOccupancy: z.number().int().positive().nullable().default(null),
    bedType: trimmedString.default(""),
    viewLabel: trimmedString.default(""),
    amenities: safeStringArraySchema
  })
  .superRefine((room, context) => {
    const hasContent = Boolean(
      room.description ||
        room.seoDescription ||
        room.photoUrl ||
        room.sizeLabel ||
        room.maxOccupancy ||
        room.bedType ||
        room.viewLabel ||
        room.amenities.length
    );
    if (hasContent && !room.name) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Room name is required when any room details are entered."
      });
    }
  });

export const adminResortPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  propertyType: z.enum(["resort", "liveaboards", "hotels"]),
  submitIntent: adminResortSubmitIntentSchema,
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .max(120, "Slug must be 120 characters or fewer.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, URL-safe, and cannot contain spaces or unsafe characters."),
  name: z.string().trim().min(2, "Property name must be at least 2 characters."),
  location: trimmedString.default(""),
  category: trimmedString.default(""),
  transferType: trimmedString.default(""),
  description: trimmedString.default(""),
  highlights: safeStringArraySchema,
  mealPlans: safeStringArraySchema,
  seoTitle: trimmedString.default(""),
  seoDescription: trimmedString.default(""),
  seoSummary: trimmedString.default(""),
  heroImageUrl: optionalSafeMediaUrlSchema,
  galleryMediaUrls: z.array(optionalSafeMediaUrlSchema).default([]).transform((items) => Array.from(new Set(items.filter(Boolean)))),
  roomTypes: z.array(adminResortRoomSchema).default([]),
  isFeaturedHomepage: z.boolean().default(false)
});

export const partnerRegistrationSchema = z.object({
  agencyName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  market: z.string().min(2),
  notes: z.string().max(2000).optional()
});

export const newsletterSubmissionSchema = z.object({
  fullName: z.string().min(2),
  agencyName: z.string().min(2),
  countryOfOrigin: z.string().min(2),
  contactNumber: z.string().min(5),
  email: z.string().email(),
  primaryMarket: z.string().optional().default(""),
  additionalNotes: z.string().max(2000).optional(),
  source: z.string().min(1).default("website")
});

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10)
});

export const aiImportRequestSchema = z.object({
  googleDriveUrl: z
    .string()
    .url()
    .refine(
      (value) => value.includes("drive.google.com") || value.includes("docs.google.com"),
      "Enter a valid Google Drive or Google Docs URL."
    ),
  propertyType: z
    .enum(["resort", "liveaboard", "liveaboards", "hotel", "hotels"])
    .default("resort")
    .transform((value) => (value === "liveaboard" ? "liveaboards" : value === "hotel" ? "hotels" : value))
});

export const resortSeoGenerationInputSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional().default(""),
  category: z.string().optional().default(""),
  transferType: z.string().optional().default(""),
  description: z.string().min(20),
  highlights: z.array(z.string()).default([]),
  mealPlans: z.array(z.string()).default([])
});
