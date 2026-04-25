import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

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
  sizeLabel: string;
  maxOccupancy: number | null;
  bedType: string;
  viewLabel: string;
  amenities: string[];
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
  size_label: string | null;
  max_occupancy: number | null;
  bed_type: string | null;
  features: unknown;
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

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
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

function mapResort(row: ResortRow): ResortRecord {
  return mapResortRow(row);
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

function getPrimaryImage(mediaRows: MediaRow[]) {
  const hero = mediaRows.find((row) => row.is_hero)?.file_path;
  return hero ?? mediaRows[0]?.file_path ?? "";
}

function getRoomImage(roomId: string, mediaRows: MediaRow[], resortHeroImageUrl = "") {
  const roomMedia = mediaRows.filter((row) => row.room_id === roomId);
  return getPrimaryImage(roomMedia) || resortHeroImageUrl;
}

function mapRoom(row: RoomRow, mediaRows: MediaRow[], resortHeroImageUrl = ""): ResortRoomRecord {
  const description = normalizeText(row.short_description);
  const seoDescription = normalizeText(row.seo_summary) || description;
  const amenities = toStringArray(row.features);
  const viewLabel = amenities.find((item) => /view/i.test(item)) ?? "";

  return {
    id: row.id,
    name: row.name,
    description,
    seoDescription,
    photoUrl: getRoomImage(row.id, mediaRows, resortHeroImageUrl),
    sortOrder: row.sort_order ?? 0,
    sizeLabel: normalizeText(row.size_label),
    maxOccupancy: row.max_occupancy ?? null,
    bedType: normalizeText(row.bed_type),
    viewLabel,
    amenities
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
      .select("id,resort_id,name,short_description,size_label,max_occupancy,bed_type,features,seo_summary,sort_order")
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
    const resortHeroImageUrl = resortMediaMap.get(row.resort_id)?.heroImageUrl ?? "";
    current.push(mapRoom(row, typedMediaRows, resortHeroImageUrl));
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
      return [];
    }

    return attachResortRelations((data as ResortRow[]).map(mapResort));
  } catch {
    return [];
  }
}

async function listPublishedResortRows() {
  const supabase = createSupabaseAdminClient();
  const firstAttempt = await supabase
    .from("resorts")
    .select("id,slug,name,atoll,category,transfer_type,description,seo_summary,status,is_featured_homepage")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (!firstAttempt.error) {
    return (firstAttempt.data ?? []) as Array<
      Pick<
        ResortRow,
        "id" | "slug" | "name" | "atoll" | "category" | "transfer_type" | "description" | "seo_summary" | "status" | "is_featured_homepage"
      >
    >;
  }

  if (!isMissingFeaturedHomepageColumnError(firstAttempt.error)) {
    throw firstAttempt.error;
  }

  const fallbackAttempt = await supabase
    .from("resorts")
    .select("id,slug,name,atoll,category,transfer_type,description,seo_summary,status")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (fallbackAttempt.error) {
    throw fallbackAttempt.error;
  }

  return ((fallbackAttempt.data ?? []) as Array<
    Pick<ResortRow, "id" | "slug" | "name" | "atoll" | "category" | "transfer_type" | "description" | "seo_summary" | "status">
  >).map((row) => ({
    ...row,
    is_featured_homepage: false
  }));
}

const getCachedPublishedResorts = unstable_cache(
  async (): Promise<ResortSummary[]> => {
    try {
      const resortRows = await listPublishedResortRows();

      if (!resortRows.length) {
        return [];
      }
      const heroMedia = await fetchResortHeroMedia(resortRows.map((row) => row.id));

      return resortRows
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
    } catch (error) {
      console.error("Failed to load published resorts", error);
      return [];
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
  const resorts = await listPublishedResorts();
  const featured = resorts
    .filter((resort) => resort.isFeaturedHomepage)
    .slice(0, limit);

  if (featured.length) {
    return featured;
  }

  return resorts.slice(0, limit);
}

export async function getResortBySlug(slug: string): Promise<ResortRecord | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("resorts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const [resort] = await attachResortRelations([mapResort(data as ResortRow)]);
    return resort ?? null;
  } catch {
    return null;
  }
}

export async function listSimilarPublishedResorts(slug: string, category: string, limit = 3): Promise<ResortSummary[]> {
  const resorts = await listPublishedResorts();

  return resorts
    .filter((resort) => resort.slug !== slug)
    .sort((left, right) => {
      const leftScore = Number(Boolean(category) && left.category === category);
      const rightScore = Number(Boolean(category) && right.category === category);
      return rightScore - leftScore;
    })
    .slice(0, limit);
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
      size_label: room.sizeLabel?.trim() || null,
      max_occupancy: room.maxOccupancy ?? null,
      bed_type: room.bedType?.trim() || null,
      features: room.amenities?.filter(Boolean) ?? [],
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

  revalidateTag("resorts-public");
  revalidatePath("/");
  revalidatePath("/resorts");
  revalidatePath(`/resorts/${input.slug}`);
}

export async function deleteResort(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("resorts").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTag("resorts-public");
  revalidatePath("/");
  revalidatePath("/resorts");
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
