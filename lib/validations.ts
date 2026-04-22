import { z } from "zod";

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
  primaryMarket: z.string().min(2),
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
    )
});

export const chatStartSchema = z.object({
  guestName: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
  body: z.string().min(2)
});

export const chatReplySchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1)
});
