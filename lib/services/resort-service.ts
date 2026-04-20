import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sampleResorts } from "@/lib/sample-data";
import type { PublishStatus, ResortSummary } from "@/lib/types";

export type ResortRecord = {
  id: string;
  slug: string;
  name: string;
  location: string;
  category: string;
  transferType: string;
  summary: string;
  description: string;
  highlights: string[];
  mealPlans: string[];
  status: PublishStatus;
  seoTitle: string;
  seoDescription: string;
  seoSummary: string;
  publishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ResortRow = {
  id: string;
  slug: string;
  name: string;
  atoll: string | null;
  category: string | null;
  transfer_type: string | null;
  description: string | null;
  highlights: unknown;
  meal_plans: unknown;
  seo_title: string | null;
  seo_description: string | null;
  seo_summary: string | null;
  status: PublishStatus;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
};

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function fallbackResortDetail(summary: ResortSummary): ResortRecord {
  return {
    id: summary.id,
    slug: summary.slug,
    name: summary.name,
    location: summary.location,
    category: summary.category,
    transferType: summary.transferType,
    summary: summary.summary,
    description: summary.summary,
    highlights: ["Premium positioning", "Partner-ready sales narrative"],
    mealPlans: ["Bed & Breakfast", "Half Board", "Full Board"],
    status: summary.status,
    seoTitle: summary.name,
    seoDescription: summary.summary,
    seoSummary: summary.summary,
    publishedAt: summary.status === "published" ? new Date().toISOString() : null
  };
}

function mapResortRow(row: ResortRow): ResortRecord {
  const description = row.description ?? "";
  const seoSummary = row.seo_summary ?? description;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.atoll ?? "",
    category: row.category ?? "",
    transferType: row.transfer_type ?? "",
    summary: seoSummary || description,
    description,
    highlights: toStringArray(row.highlights),
    mealPlans: toStringArray(row.meal_plans),
    status: row.status,
    seoTitle: row.seo_title ?? row.name,
    seoDescription: row.seo_description ?? seoSummary,
    seoSummary,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function baseSummary(detail: ResortRecord): ResortSummary {
  return {
    id: detail.id,
    slug: detail.slug,
    name: detail.name,
    location: detail.location,
    category: detail.category,
    transferType: detail.transferType,
    summary: detail.summary,
    status: detail.status
  };
}

export async function listAdminResorts(): Promise<ResortRecord[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("resorts")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (!data?.length) {
      return sampleResorts.map(fallbackResortDetail);
    }

    return (data as ResortRow[]).map(mapResortRow);
  } catch {
    return sampleResorts.map(fallbackResortDetail);
  }
}

export async function listPublishedResorts(): Promise<ResortSummary[]> {
  const resorts = await listAdminResorts();
  const published = resorts.filter((resort) => resort.status === "published");
  return (published.length ? published : resorts.filter((resort) => resort.status !== "archived")).map(baseSummary);
}

export async function getResortBySlug(slug: string): Promise<ResortRecord | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("resorts").select("*").eq("slug", slug).maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      const fallback = sampleResorts.find((resort) => resort.slug === slug);
      return fallback ? fallbackResortDetail(fallback) : null;
    }

    return mapResortRow(data as ResortRow);
  } catch {
    const fallback = sampleResorts.find((resort) => resort.slug === slug);
    return fallback ? fallbackResortDetail(fallback) : null;
  }
}

export async function saveResort(input: {
  id?: string;
  slug: string;
  name: string;
  location: string;
  category: string;
  transferType: string;
  description: string;
  highlights: string[];
  mealPlans: string[];
  seoTitle: string;
  seoDescription: string;
  seoSummary: string;
  status: PublishStatus;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("resorts").upsert({
    id: input.id,
    slug: input.slug,
    name: input.name,
    atoll: input.location,
    category: input.category,
    transfer_type: input.transferType,
    description: input.description,
    highlights: input.highlights,
    meal_plans: input.mealPlans,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
    seo_summary: input.seoSummary,
    status: input.status,
    published_at: input.status === "published" ? now : null,
    updated_at: now
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteResort(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("resorts").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function seedSampleResorts() {
  const supabase = createSupabaseAdminClient();
  const payload = sampleResorts.map((resort) => ({
    slug: resort.slug,
    name: resort.name,
    atoll: resort.location,
    category: resort.category,
    transfer_type: resort.transferType,
    description: resort.summary,
    highlights: ["Partner-ready positioning", "Luxury B2B sales support", "Curated Maldives expertise"],
    meal_plans: ["Bed & Breakfast", "Half Board", "Full Board"],
    seo_title: resort.name,
    seo_description: resort.summary,
    seo_summary: resort.summary,
    status: resort.status,
    published_at: resort.status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase.from("resorts").upsert(payload, { onConflict: "slug" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getResortCounts() {
  const resorts = await listAdminResorts();
  return {
    total: resorts.length,
    published: resorts.filter((resort) => resort.status === "published").length,
    draft: resorts.filter((resort) => resort.status === "draft").length
  };
}
