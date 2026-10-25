import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
export const RESOURCE_ACCESS_COOKIE = "emv_resource_access";
export const RESOURCE_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 6;
export type ResourceSession = { agentId: string };
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export async function createResourceAccessToken(agentId: string, accessVersion: number) {
  const token = randomBytes(32).toString("base64url");
  const client = createSupabaseAdminClient();
  await client.from("partner_resource_sessions").delete().lt("expires_at", new Date().toISOString());
  const { error } = await client.from("partner_resource_sessions").insert({
    token_hash: hashToken(token), agent_id: agentId, access_version: accessVersion,
    expires_at: new Date(Date.now() + RESOURCE_ACCESS_MAX_AGE_SECONDS * 1000).toISOString()
  });
  if (error) throw new Error("Unable to create resource session.");
  return token;
}
export async function verifyResourceAccessToken(token?: string): Promise<ResourceSession | null> {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const client = createSupabaseAdminClient();
  const { data: session, error } = await client.from("partner_resource_sessions")
    .select("agent_id,access_version,expires_at").eq("token_hash", hashToken(token)).maybeSingle();
  if (error || !session || Date.parse(session.expires_at) <= Date.now()) return null;
  const { data: agent, error: agentError } = await client.from("agents")
    .select("id,status,resource_access_version").eq("id", session.agent_id).maybeSingle();
  if (agentError || agent?.status !== "approved" || agent.resource_access_version !== session.access_version) return null;
  return { agentId: agent.id };
}
export async function getResourceAccessSession() {
  const store = await cookies();
  return verifyResourceAccessToken(store.get(RESOURCE_ACCESS_COOKIE)?.value);
}
export async function hasResourceAccessSession() { return Boolean(await getResourceAccessSession()); }
