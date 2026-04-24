import { unstable_cache } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sampleResorts } from "@/lib/sample-data";
import type { PublishStatus, ResortRoomSummary, ResortSummary } from "@/lib/types";

export type ResortRoomRecord = {
  id?: string;
  name: string;
  description: string;
  seoDescription: string;
  photoUrl: string;
  sortOrder: number;
};

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
  isFeaturedHomepage: boolean;
  seoTitle: string;
  seoDescription: string;
  seoSummary: string;
  heroImageUrl: string;
  galleryMediaUrls: string[];
  roomTypes: ResortRoomRecord[];
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
  is_featured_homepage?: boolean | null;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
};

type RoomRow = {
  id: string;
  resort_id: string;
  name: string;
  short_description: string | null;
  seo_summary: string | null;
  sort_order: number | null;
};

type MediaRow = {
  resort_id: string;
  room_id: string | null;
  file_path: string;
  is_hero: boolean;
  sort_order: number | null;
};

function isMissingFeaturedHomepageColumnError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";

  return message.includes("is_featured_homepage");
}

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
    isFeaturedHomepage: summary.isFeaturedHomepage ?? false,
    seoTitle: summary.name,
    seoDescription: summary.summary,
    seoSummary: summary.summary,
    heroImageUrl: "",
    galleryMediaUrls: [],
    roomTypes: [],
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
    isFeaturedHomepage: Boolean(row.is_featured_homepage),
    seoTitle: row.seo_title ?? row.name,
    seoDescription: row.seo_description ?? seoSummary,
    seoSummary,
    heroImageUrl: "",
    galleryMediaUrls: [],
    roomTypes: [],
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
    heroImageUrl: detail.heroImageUrl,
    status: detail.status,
    isFeaturedHomepage: detail.isFeaturedHomepage
  };
}

async function fetchResortHeroMedia(resortIds: string[]) {
  if (!resortIds.length) {
    return new Map<string, string>();
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("resort_media")
    .select("resort_id,file_path,is_hero,sort_order")
    .is("room_id", null)
    .in("resort_id", resortIds)
    .order("sort_order", { ascending: true });

  const mediaMap = new Map<string, string>();
  ((data ?? []) as Array<Pick<MediaRow, "resort_id" | "file_path" | "is_hero" | "sort_order">>).forEach((row) => {
    if (row.is_hero || !mediaMap.has(row.resort_id)) {
      mediaMap.set(row.resort_id, row.file_path);
    }
  });

  return mediaMap;
}

function mapRoomRow(row: RoomRow, mediaRows: MediaRow[]): ResortRoomRecord {
  const photo = mediaRows.find((item) => item.room_id === row.id)?.file_path ?? "";

  return {
    id: row.id,
    name: row.name,
    description: row.short_description ?? "",
    seoDescription: row.seo_summary ?? row.short_description ?? "",
    photoUrl: photo,
    sortOrder: row.sort_order ?? 0
  };
}

async function attachResortRelations(resorts: ResortRecord[]) {
  if (!resorts.length) {
    return resorts;
  }

  const supabase = createSupabaseAdminClient();
  const resortIds = resorts.map((resort) => resort.id);
  const [{ data: mediaRows }, { data: roomRows }] = await Promise.all([
    supabase
      .from("resort_media")
      .select("resort_id,room_id,file_path,is_hero,sort_order")
      .in("resort_id", resortIds)
      .order("sort_order", { ascending: true }),
    supabase
      .from("rooms")
      .select("id,resort_id,name,short_description,seo_summary,sort_order")
      .in("resort_id", resortIds)
      .order("sort_order", { ascending: true })
  ]);

  const typedMediaRows = (mediaRows ?? []) as MediaRow[];
  const typedRoomRows = (roomRows ?? []) as RoomRow[];

  const resortMediaMap = new Map<string, { heroImageUrl: string; galleryMediaUrls: string[] }>();
  typedMediaRows
    .filter((row) => !row.room_id)
    .forEach((row) => {
      const current = resortMediaMap.get(row.resort_id) ?? { heroImageUrl: "", galleryMediaUrls: [] };
      current.galleryMediaUrls.push(row.file_path);
      if (row.is_hero || !current.heroImageUrl) {
        current.heroImageUrl = row.file_path;
      }
      resortMediaMap.set(row.resort_id, current);
    });

  const roomMap = new Map<string, ResortRoomRecord[]>();
  typedRoomRows.forEach((row) => {
    const current = roomMap.get(row.resort_id) ?? [];
    current.push(mapRoomRow(row, typedMediaRows));
    roomMap.set(row.resort_id, current);
  });

  return resorts.map((resort) => ({
    ...resort,
    heroImageUrl: resortMediaMap.get(resort.id)?.heroImageUrl ?? "",
    galleryMediaUrls: resortMediaMap.get(resort.id)?.galleryMediaUrls ?? [],
    roomTypes: roomMap.get(resort.id) ?? []
  }));
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

    return attachResortRelations((data as ResortRow[]).map(mapResortRow));
  } catch {
    return sampleResorts.map(fallbackResortDetail);
  }
}

const getCachedPublishedResorts = unstable_cache(
  async (): Promise<ResortSummary[]> => {
    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("resorts")
        .select("id,slug,name,atoll,category,transfer_type,description,seo_summary,status,is_featured_homepage")
        .in("status", ["published", "draft"])
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (!data?.length) {
        return sampleResorts.map((resort) => ({
          ...resort,
          isFeaturedHomepage: resort.isFeaturedHomepage ?? false
        }));
      }

      const resortRows = data as Array<
        Pick<
          ResortRow,
          "id" | "slug" | "name" | "atoll" | "category" | "transfer_type" | "description" | "seo_summary" | "status" | "is_featured_homepage"
        >
      >;
      const heroMedia = await fetchResortHeroMedia(resortRows.map((row) => row.id));

      return resortRows
        .filter((row) => row.status !== "archived")
        .map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          location: row.atoll ?? "",
          category: row.category ?? "",
          transferType: row.transfer_type ?? "",
          summary: row.seo_summary ?? row.description ?? "",
          heroImageUrl: heroMedia.get(row.id) ?? "",
          status: row.status,
          isFeaturedHomepage: Boolean(row.is_featured_homepage)
        }))
        .sort((left, right) => Number(right.isFeaturedHomepage) - Number(left.isFeaturedHomepage));
    } catch {
      return sampleResorts.map((resort) => ({
        ...resort,
        isFeaturedHomepage: resort.isFeaturedHomepage ?? false
      }));
    }
  },
  ["published-resorts-summaries"],
  {
    tags: ["resorts-public"],
    revalidate: 300
  }
);

export async function listPublishedResorts(): Promise<ResortSummary[]> {
  return getCachedPublishedResorts();
}

export async function listHomepageFeaturedResorts(limit = 5): Promise<ResortSummary[]> {
  const resorts = await listAdminResorts();
  const featured = resorts
    .filter((resort) => resort.status === "published" && resort.isFeaturedHomepage)
    .slice(0, limit);

  if (featured.length) {
    return featured.map(baseSummary);
  }

  return resorts
    .filter((resort) => resort.status === "published")
    .slice(0, limit)
    .map(baseSummary);
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

    const [resort] = await attachResortRelations([mapResortRow(data as ResortRow)]);
    return resort ?? null;
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
  heroImageUrl: string;
  galleryMediaUrls: string[];
  roomTypes: ResortRoomSummary[];
  status: PublishStatus;
  isFeaturedHomepage: boolean;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const basePayload = {
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
  };

  let data:
    | {
        id: string;
      }
    | null = null;
  let error: { message?: string } | null = null;

  const firstAttempt = await supabase
    .from("resorts")
    .upsert({
      ...basePayload,
      is_featured_homepage: input.status === "published" ? input.isFeaturedHomepage : false
    })
    .select("id")
    .single();

  data = firstAttempt.data;
  error = firstAttempt.error;

  if (error && isMissingFeaturedHomepageColumnError(error)) {
    const fallbackAttempt = await supabase
      .from("resorts")
      .upsert(basePayload)
      .select("id")
      .single();

    data = fallbackAttempt.data;
    error = fallbackAttempt.error;
  }

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save resort.");
  }

  await supabase.from("rooms").delete().eq("resort_id", data.id);

  const roomEntries = input.roomTypes
    .map((room, index) => ({
      resort_id: data.id,
      name: room.name.trim(),
      short_description: room.description.trim() || null,
      seo_summary: room.seoDescription.trim() || room.description.trim() || null,
      sort_order: index
    }))
    .filter((room) => room.name);

  let insertedRooms: { id: string; sort_order: number | null }[] = [];

  if (roomEntries.length) {
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .insert(roomEntries)
      .select("id,sort_order");

    if (roomError) {
      throw new Error(roomError.message);
    }

    insertedRooms = (roomData ?? []) as { id: string; sort_order: number | null }[];
  }

  await supabase.from("resort_media").delete().eq("resort_id", data.id);

  const resortMedia = Array.from(
    new Set([input.heroImageUrl, ...input.galleryMediaUrls].map((item) => item.trim()).filter(Boolean))
  ).map((filePath, index) => ({
    resort_id: data.id,
    file_path: filePath,
    alt_text: input.name,
    is_hero: filePath === input.heroImageUrl || (!input.heroImageUrl && index === 0),
    sort_order: index
  }));

  const roomMedia = input.roomTypes
    .map((room, index) => {
      const matchedRoom = insertedRooms[index];
      const filePath = room.photoUrl?.trim();
      if (!matchedRoom || !filePath) {
        return null;
      }

      return {
        resort_id: data.id,
        room_id: matchedRoom.id,
        file_path: filePath,
        alt_text: `${input.name} ${room.name}`,
        is_hero: false,
        sort_order: 100 + index
      };
    })
    .filter(Boolean);

  const mediaPayload = [...resortMedia, ...(roomMedia as NonNullable<(typeof roomMedia)[number]>[])];

  if (mediaPayload.length) {
    const { error: mediaError } = await supabase.from("resort_media").insert(mediaPayload);

    if (mediaError) {
      throw new Error(mediaError.message);
    }
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
  const payload = sampleResorts.map((resort, index) => ({
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

  const { error: firstError } = await supabase.from("resorts").upsert(
    payload.map((resort, index) => ({
      ...resort,
      is_featured_homepage: index < 2 && resort.status === "published"
    })),
    { onConflict: "slug" }
  );

  let error = firstError;

  if (error && isMissingFeaturedHomepageColumnError(error)) {
    const fallbackAttempt = await supabase.from("resorts").upsert(payload, { onConflict: "slug" });
    error = fallbackAttempt.error;
  }

  if (error) {
    throw new Error(error.message);
  }
}

export async function getResortCounts() {
  const resorts = await listAdminResorts();
  return {
    total: resorts.length,
    published: resorts.filter((resort) => resort.status === "published").length,
    featured: resorts.filter((resort) => resort.status === "published" && resort.isFeaturedHomepage).length,
    draft: resorts.filter((resort) => resort.status === "draft").length
  };
}
