import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  VERCEL_OIDC_TOKEN: z.string().min(1).optional(),
  AI_GATEWAY_PREFERRED_MODELS: z.string().min(1).optional(),
  AI_GATEWAY_IMPORT_MODELS: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
  NOTIFICATION_EMAIL: z.string().email().optional(),
  SAMOA_EXTERNAL_URL: z.string().url().optional()
});

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "https://excitingmv-web-v2.vercel.app",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
  AI_GATEWAY_PREFERRED_MODELS: process.env.AI_GATEWAY_PREFERRED_MODELS,
  AI_GATEWAY_IMPORT_MODELS: process.env.AI_GATEWAY_IMPORT_MODELS,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL,
  SAMOA_EXTERNAL_URL: process.env.SAMOA_EXTERNAL_URL
});
