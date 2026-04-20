import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { samplePartnerResources } from "@/lib/sample-data";
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

export async function listResources() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("resources").select("*").order("sort_order");

    if (error) {
      throw error;
    }

    if (!data?.length) {
      return fallbackResources();
    }

    return (data as ResourceRow[]).map(mapResourceRow);
  } catch {
    return fallbackResources();
  }
}

export async function listPublishedResources() {
  const resources = await listResources();
  return resources.filter((resource) => resource.status === "published");
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
  const { error } = await supabase.from("resources").upsert({
    id: input.id,
    title: input.title,
    description: input.description,
    file_path: input.filePath,
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
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("resources").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
