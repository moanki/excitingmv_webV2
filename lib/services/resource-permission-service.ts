import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

export type ResourcePermissionStatus = "active" | "disabled";

export type ResourcePermissionRecord = {
  agentId: string;
  agencyName: string;
  username: string;
  passwordLabel: string;
  status: ResourcePermissionStatus;
  resources: Array<{ id: string; title: string }>;
  createdAt: string;
};

type AgentRow = {
  id: string;
  agency_name: string;
  contact_name: string;
  email: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  notes?: string | null;
  resource_password_hash?: string | null;
  resource_access_version?: number;
  created_at: string;
};

type ProtectedResourceRow = {
  agent_id: string | null;
  resource_id: string;
  resources:
    | {
        id: string;
        title: string;
      }
    | Array<{
        id: string;
        title: string;
      }>
    | null;
};

function toPermissionStatus(status: AgentRow["status"]): ResourcePermissionStatus {
  return status === "suspended" ? "disabled" : "active";
}

function toAgentStatus(status: ResourcePermissionStatus): AgentRow["status"] {
  return status === "disabled" ? "suspended" : "approved";
}

const scryptAsync = promisify(scrypt);
const RESOURCE_PASSWORD_PREFIX = "scrypt";
const RESOURCE_PASSWORD_KEY_LENGTH = 64;

async function hashResourcePassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, RESOURCE_PASSWORD_KEY_LENGTH)) as Buffer;

  return `${RESOURCE_PASSWORD_PREFIX}$${salt}$${derived.toString("hex")}`;
}

async function verifyResourcePassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split("$");
  if (scheme !== RESOURCE_PASSWORD_PREFIX || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function listResourcePermissions() {
  const supabase = createSupabaseAdminClient();
  const [{ data: agents, error: agentError }, { data: protectedResources, error: protectedError }] =
    await Promise.all([
      supabase.from("agents").select("id, agency_name, contact_name, email, status, created_at").order("agency_name"),
      supabase.from("protected_resources").select("agent_id, resource_id, resources(id, title)")
    ]);

  if (agentError) {
    throw new Error(agentError.message);
  }

  if (protectedError) {
    throw new Error(protectedError.message);
  }

  const resourceMap = new Map<string, Array<{ id: string; title: string }>>();
  for (const item of (protectedResources ?? []) as ProtectedResourceRow[]) {
    const relatedResource = Array.isArray(item.resources) ? item.resources[0] : item.resources;

    if (!item.agent_id || !relatedResource) {
      continue;
    }

    const existing = resourceMap.get(item.agent_id) ?? [];
    existing.push({
      id: relatedResource.id,
      title: relatedResource.title
    });
    resourceMap.set(item.agent_id, existing);
  }

  return ((agents ?? []) as AgentRow[])
    .filter((agent) => agent.status === "approved" || agent.status === "suspended" || resourceMap.has(agent.id))
    .map<ResourcePermissionRecord>((agent) => ({
      agentId: agent.id,
      agencyName: agent.agency_name,
      username: agent.email,
      passwordLabel: "Managed separately",
      status: toPermissionStatus(agent.status),
      resources: resourceMap.get(agent.id) ?? [],
      createdAt: agent.created_at
    }));
}

export async function getResourcePermission(agentId: string) {
  const permissions = await listResourcePermissions();
  return permissions.find((permission) => permission.agentId === agentId) ?? null;
}

export async function saveResourcePermission(input: {
  agentId?: string;
  agencyName: string;
  username: string;
  password?: string;
  status: ResourcePermissionStatus;
  resourceIds: string[];
}) {
  const supabase = createSupabaseAdminClient();
  let agentId = input.agentId;
  const password = input.password?.trim();
  let passwordPatch: { resource_password_hash?: string } = {};
  if (password) {
    if (password.length < 12 || password.length > 256) throw new Error("Use a resource password between 12 and 256 characters.");
    passwordPatch = { resource_password_hash: await hashResourcePassword(password) };
  }

  if (agentId) {
    const { error } = await supabase
      .from("agents")
      .update({
        agency_name: input.agencyName,
        email: input.username.trim().toLowerCase(),
        contact_name: input.agencyName,
        status: toAgentStatus(input.status),
        ...passwordPatch
      })
      .eq("id", agentId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { data, error } = await supabase
      .from("agents")
      .insert({
        agency_name: input.agencyName,
        contact_name: input.agencyName,
        email: input.username.trim().toLowerCase(),
        status: toAgentStatus(input.status),
        ...passwordPatch
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      throw new Error(error?.message ?? "Failed to create resource permission.");
    }

    agentId = data.id;
  }

  const { error: deleteError } = await supabase.from("protected_resources").delete().eq("agent_id", agentId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (input.resourceIds.length) {
    const rows = input.resourceIds.map((resourceId) => ({
      agent_id: agentId,
      resource_id: resourceId
    }));

    const { error: insertError } = await supabase.from("protected_resources").insert(rows);
    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

export async function disableResourcePermission(agentId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("agents").update({ status: "suspended" }).eq("id", agentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteResourcePermission(agentId: string) {
  const supabase = createSupabaseAdminClient();
  const { error: deleteError } = await supabase.from("protected_resources").delete().eq("agent_id", agentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: agentError } = await supabase.from("agents").update({ status: "pending" }).eq("id", agentId);
  if (agentError) {
    throw new Error(agentError.message);
  }
}

export async function enableResourcePermission(agentId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("agents").update({ status: "approved" }).eq("id", agentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function validateActiveResourcePassword(password: string, username: string) {
  if (!password || password.length > 256 || !username || username.length > 254) return null;
  const client = createSupabaseAdminClient();
  const { data, error } = await client.from("agents")
    .select("id,resource_password_hash,resource_access_version")
    .eq("status", "approved").eq("email", username.trim().toLowerCase()).maybeSingle();
  if (error || !data?.resource_password_hash) return null;
  if (!await verifyResourcePassword(password, data.resource_password_hash)) return null;
  return { agentId: data.id, accessVersion: data.resource_access_version };
}
