import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  type CookieSetOptions = Omit<Parameters<typeof cookieStore.set>[0], "name" | "value">;

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieSetOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieSetOptions) {
          cookieStore.set({ name, value: "", ...options });
        }
      }
    }
  );
}
