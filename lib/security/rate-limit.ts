import "server-only";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
type RateLimitConfig = { key: string; limit: number; windowMs: number };
export function getClientIp(request: Pick<Request, "headers">) {
  // Vercel overwrites x-forwarded-for; a caller can supply cf-connecting-ip directly.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0,128) || "unknown";
}
export async function checkRateLimit({ key, limit, windowMs }: RateLimitConfig) {
  const { data, error } = await createSupabaseAdminClient().rpc("check_request_limit", {
    p_key: createHash("sha256").update(key).digest("hex"), p_limit: limit, p_window_ms: windowMs
  });
  if (error || !data?.[0]) return { allowed: false, remaining: 0, resetAt: Date.now()+windowMs };
  const row = data[0];
  return { allowed: Boolean(row.allowed), remaining: Number(row.remaining), resetAt: Date.parse(row.reset_at) };
}
