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
const RESOURCE_PASSWORD_NOTE_PREFIX = "[resource_password_hash]:";

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

function resourcePasswordHashFromNotes(notes?: string | null) {
  return (notes ?? "")
    .split("\n")
    .find((line) => line.startsWith(RESOURCE_PASSWORD_NOTE_PREFIX))
    ?.slice(RESOURCE_PASSWORD_NOTE_PREFIX.length)
    .trim() ?? "";
}

function notesWithResourcePasswordHash(notes: string | null | undefined, hash: string) {
  const publicNotes = (notes ?? "")
    .split("\n")
    .filter((line) => !line.startsWith(RESOURCE_PASSWORD_NOTE_PREFIX))
    .join("\n")
    .trim();
  const marker = `${RESOURCE_PASSWORD_NOTE_PREFIX}${hash}`;

  return publicNotes ? `${publicNotes}\n${marker}` : marker;
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
  let passwordPatch: { notes?: string } = {};

  if (password) {
    const hash = await hashResourcePassword(password);
    const currentNotes = agentId
      ? await supabase
          .from("agents")
          .select("notes")
          .eq("id", agentId)
          .maybeSingle()
          .then(({ data }) => (data as Pick<AgentRow, "notes"> | null)?.notes ?? "")
      : "";
    passwordPatch = { notes: notesWithResourcePasswordHash(currentNotes, hash) };
  }

  if (agentId) {
    const { error } = await supabase
      .from("agents")
      .update({
        agency_name: input.agencyName,
        email: input.username,
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
        email: input.username,
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

export async function validateActiveResourcePassword(password: string) {
  const candidate = password.trim();
  if (!candidate) {
    return false;
  }

  const supabase = createSupabaseAdminClient();
  const [{ data, error }, { data: protectedRows, error: protectedError }] = await Promise.all([
    supabase
      .from("agents")
      .select("id, status, notes")
      .eq("status", "approved")
      .not("notes", "is", null),
    supabase.from("protected_resources").select("agent_id")
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (protectedError) {
    throw new Error(protectedError.message);
  }

  const protectedAgentIds = new Set(
    ((protectedRows ?? []) as Array<{ agent_id: string | null }>).map((row) => row.agent_id).filter(Boolean)
  );
  for (const agent of (data ?? []) as Pick<AgentRow, "id" | "notes">[]) {
    const hash = resourcePasswordHashFromNotes(agent.notes);
    if (!hash || !protectedAgentIds.has(agent.id)) {
      continue;
    }

    if (await verifyResourcePassword(candidate, hash)) {
      return true;
    }
  }

  return false;
}
