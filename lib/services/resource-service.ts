import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { samplePartnerResources } from "@/lib/sample-data";
import { PRIVATE_RESOURCE_BUCKET, validatePrivateResourcePath } from "@/lib/storage/partner-resources";
import type { PublishStatus, ResourceAudience } from "@/lib/types";

export type ResourceRecord = {
  id: string;
  title: string;
  description: string;
  filePath: string;
  resourceType: string;
  audienceType: ResourceAudience;
  status: PublishStatus;
  sortOrder: number;
  createdAt?: string;
};

type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  resource_type: string | null;
  audience_type: ResourceAudience;
  status: PublishStatus;
  sort_order: number;
  created_at: string;
};

function fallbackResources(): ResourceRecord[] {
  return samplePartnerResources.map((item, index) => ({
    id: `sample-${index}`,
    title: item.title,
    description: "",
    filePath: "#",
    resourceType: item.kind,
    audienceType: item.audience,
    status: item.status,
    sortOrder: index
  }));
}

function mapResourceRow(row: ResourceRow): ResourceRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    filePath: row.file_path,
    resourceType: row.resource_type ?? "",
    audienceType: row.audience_type,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at
  };
}

async function queryResources() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("resources")
    .select("id,title,description,file_path,resource_type,audience_type,status,sort_order,created_at")
    .order("sort_order")
    .limit(200);
  if (error) throw error;
  return (data as ResourceRow[] | null)?.map(mapResourceRow) ?? [];
}

export async function listAdminResources() {
  return queryResources();
}

export async function listResources() {
  try {
    const resources = await queryResources();
    return resources.length ? resources : fallbackResources();
  } catch {
    return fallbackResources();
  }
}

export async function listPublishedResources(agentId?: string) {
  if (!agentId) return [];
  const resources = await queryResources();
  const { data, error } = await createSupabaseAdminClient().from("protected_resources").select("resource_id").eq("agent_id",agentId);
  if (error) throw new Error("Unable to check resource permissions.");
  const allowed = new Set((data ?? []).map(row => row.resource_id));
  return resources.filter(resource => resource.status === "published" && (resource.audienceType === "all_partners" || allowed.has(resource.id)));
}
export async function getPublishedResource(id: string, agentId: string) {
  return (await listPublishedResources(agentId)).find(resource => resource.id === id) ?? null;
}
export async function createProtectedResourceUrl(resource: ResourceRecord, mode: "view" | "download") {
  const storagePath = validatePrivateResourcePath(resource.filePath);
  const { data,error } = await createSupabaseAdminClient().storage.from(PRIVATE_RESOURCE_BUCKET).createSignedUrl(
    storagePath, 60, mode === "download" ? { download: resource.title } : undefined
  );
  if (error || !data?.signedUrl) throw new Error("Unable to prepare resource download.");
  return data.signedUrl;
}

export async function saveResource(input: {
  id?: string;
  title: string;
  description: string;
  filePath: string;
  resourceType: string;
  audienceType: ResourceAudience;
  status: PublishStatus;
  sortOrder: number;
}) {
  const supabase = createSupabaseAdminClient();
  const privatePath = validatePrivateResourcePath(input.filePath);
  const { error } = await supabase.from("resources").upsert({
    id: input.id,
    title: input.title,
    description: input.description,
    file_path: privatePath,
    resource_type: input.resourceType,
    audience_type: input.audienceType,
    status: input.status,
    sort_order: input.sortOrder
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteResource(id: string) {
  if (!id || id.startsWith("sample-")) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("resources").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
