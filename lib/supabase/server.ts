import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import { assertExperimentStaging, experimentReadOnlyFetch } from "./experiment-read-only";

export async function createSupabaseServerClient() {
  assertExperimentStaging(env.NEXT_PUBLIC_SUPABASE_URL);
  const cookieStore = await cookies();
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  };

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { fetch: experimentReadOnlyFetch },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always persist cookies directly.
            // Middleware should own refresh persistence when auth is enabled.
          }
        }
      }
    }
  );
}
