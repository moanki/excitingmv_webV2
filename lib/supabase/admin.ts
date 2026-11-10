import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { assertExperimentStaging, experimentReadOnlyFetch } from "./experiment-read-only";

export function createSupabaseAdminClient() {
  assertExperimentStaging(env.NEXT_PUBLIC_SUPABASE_URL);
  const readKey = process.env.EXPERIMENT_STAGING_READ_KEY;
  if (!readKey) {
    throw new Error("EXPERIMENT_STAGING_READ_KEY is required to read published content.");
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, readKey, {
    global: { fetch: experimentReadOnlyFetch },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
