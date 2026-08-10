import "server-only";

import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  VERCEL_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  MARKITDOWN_SERVICE_TOKEN: z.string().min(1).optional(),
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  VERCEL_OIDC_TOKEN: z.string().min(1).optional(),
  AI_GATEWAY_PREFERRED_MODELS: z.string().min(1).optional(),
  AI_GATEWAY_IMPORT_MODELS: z.string().min(1).optional(),
  EMAIL_CONFIG_ENCRYPTION_KEY: z.string().min(1).optional(),
  EMAIL_PROVIDER: z.string().min(1).optional(),
  SAMOA_EXTERNAL_URL: z.string().url().optional()
});

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  VERCEL_URL: process.env.VERCEL_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  MARKITDOWN_SERVICE_TOKEN: process.env.MARKITDOWN_SERVICE_TOKEN,
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
  AI_GATEWAY_PREFERRED_MODELS: process.env.AI_GATEWAY_PREFERRED_MODELS,
  AI_GATEWAY_IMPORT_MODELS: process.env.AI_GATEWAY_IMPORT_MODELS,
  EMAIL_CONFIG_ENCRYPTION_KEY: process.env.EMAIL_CONFIG_ENCRYPTION_KEY,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
  SAMOA_EXTERNAL_URL: process.env.SAMOA_EXTERNAL_URL
});
