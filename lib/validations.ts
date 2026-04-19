import { z } from "zod";

export const partnerRegistrationSchema = z.object({
  agencyName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  market: z.string().min(2),
  notes: z.string().max(2000).optional()
});

export const newsletterSubmissionSchema = z.object({
  email: z.string().email(),
  source: z.string().min(1).default("website")
});

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10)
});

export const aiImportRequestSchema = z.object({
  batchName: z.string().min(2),
  sourceType: z.enum(["pdf", "zip", "folder", "manual"]),
  notes: z.string().max(2000).optional()
});
