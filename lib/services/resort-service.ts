import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sampleResorts } from "@/lib/sample-data";
import type { PublishStatus, ResortRoomSummary, ResortSummary } from "@/lib/types";

export type PropertyType = "resort" | "liveaboards" | "hotels";

const PROPERTY_TABLE = "property";
const LEGACY_PROPERTY_TABLE = "resorts";
const PROPERTY_TABLES = [PROPERTY_TABLE, LEGACY_PROPERTY_TABLE] as const;
const VIEW_LABEL_FEATURE_PREFIX = "__viewLabel:";
const FEATURED_MIGRATION_ERROR = "Database migration missing: is_featured_homepage column is not available.";
const ADMIN_LIST_COLUMNS =
  "id,property_type,slug,name,atoll,category,transfer_type,description,seo_summary,status,is_featured_homepage,published_at,created_at,updated_at";

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
  propertyType: PropertyType;
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
  roomCount?: number;
  publishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ResortRow = {
  id: string;
  property_type?: PropertyType | null;
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

function isMissingPropertyTypeColumnError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";

  return message.includes("property_type");
}

function isMissingAdminListColumnError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";

  return message.includes("is_featured_homepage");
}

function isMissingPropertyTableError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";

  return message.includes("Could not find the table") || message.includes(`relation "public.${PROPERTY_TABLE}" does not exist`);
}

export function normalizePropertyType(value?: unknown): PropertyType {
  const normalizedValue = typeof value === "string" ? value : "";

  if (normalizedValue === "liveaboard" || normalizedValue === "liveaboards") {
    return "liveaboards";
  }

  if (normalizedValue === "hotel" || normalizedValue === "hotels") {
    return "hotels";
  }

  return "resort";
}

function propertyTypeAliases(propertyType: PropertyType) {
  if (propertyType === "liveaboards") {
    return ["liveaboards", "liveaboard"];
  }

  if (propertyType === "hotels") {
    return ["hotels", "hotel"];
  }

  return ["resort"];
}

function propertyTypeForTable(propertyType: PropertyType, tableName: string) {
  if (tableName !== LEGACY_PROPERTY_TABLE) {
    return propertyType;
  }

  if (propertyType === "liveaboards") {
    return "liveaboard";
  }

  if (propertyType === "hotels") {
    return "hotel";
  }

  return "resort";
}

function propertyBasePath(propertyType: PropertyType) {
  return propertyType === "liveaboards" ? "/liveaboards" : propertyType === "hotels" ? "/hotels" : "/resorts";
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
    propertyType: normalizePropertyType(row.property_type),
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

async function fetchResortRoomCounts(resortIds: string[]) {
  const countMap = new Map<string, number>();

  if (!resortIds.length) {
    return countMap;
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("rooms").select("resort_id").in("resort_id", resortIds);

  ((data ?? []) as Array<Pick<RoomRow, "resort_id">>).forEach((row) => {
    countMap.set(row.resort_id, (countMap.get(row.resort_id) ?? 0) + 1);
  });

  return countMap;
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
  const rawFeatures = toStringArray(row.features);
  const viewLabel = rawFeatures.find((item) => item.startsWith(VIEW_LABEL_FEATURE_PREFIX))?.slice(VIEW_LABEL_FEATURE_PREFIX.length) ?? "";
  const amenities = rawFeatures.filter((item) => !item.startsWith(VIEW_LABEL_FEATURE_PREFIX));

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

export async function listAdminResorts(propertyType: PropertyType = "resort"): Promise<ResortRecord[]> {
  try {
    const supabase = createSupabaseAdminClient();
    for (const tableName of PROPERTY_TABLES) {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .in("property_type", propertyTypeAliases(propertyType))
        .order("updated_at", { ascending: false });

      if (error) {
        if (isMissingPropertyTableError(error)) {
          continue;
        }
        if (isMissingPropertyTypeColumnError(error)) {
          return propertyType === "resort" ? listAdminResortsWithoutPropertyType(tableName) : [];
        }
        throw error;
      }

      if (!data?.length) {
        continue;
      }

      return attachResortRelations((data as ResortRow[]).map(mapResort));
    }

    return [];
  } catch (error) {
    if (error instanceof Error && error.message === FEATURED_MIGRATION_ERROR) {
      throw error;
    }
    return [];
  }
}

export async function listAdminResortCards(propertyType: PropertyType = "resort", limit = 60): Promise<ResortRecord[]> {
  try {
    const supabase = createSupabaseAdminClient();

    for (const tableName of PROPERTY_TABLES) {
      const { data, error } = await supabase
        .from(tableName)
        .select(ADMIN_LIST_COLUMNS)
        .in("property_type", propertyTypeAliases(propertyType))
        .order("updated_at", { ascending: false })
        .range(0, Math.max(limit - 1, 0));

      if (error) {
        if (isMissingPropertyTableError(error)) {
          continue;
        }
        if (isMissingPropertyTypeColumnError(error)) {
          if (propertyType === "resort") {
            const fallbackResorts = await listAdminResortCardsWithoutPropertyType(tableName, limit);
            if (fallbackResorts.length) {
              return fallbackResorts;
            }
          }
          continue;
        }
        if (isMissingAdminListColumnError(error)) {
          throw new Error(FEATURED_MIGRATION_ERROR);
        }
        throw error;
      }

      if (!data?.length) {
        continue;
      }

      const resorts = (data as ResortRow[]).map(mapResort);
      const resortIds = resorts.map((resort) => resort.id);
      const [heroMedia, roomCounts] = await Promise.all([
        fetchResortHeroMedia(resortIds),
        fetchResortRoomCounts(resortIds)
      ]);

      return resorts.map((resort) => ({
        ...resort,
        heroImageUrl: heroMedia.get(resort.id) ?? "",
        roomCount: roomCounts.get(resort.id) ?? 0
      }));
    }

    return [];
  } catch (error) {
    if (error instanceof Error && error.message === FEATURED_MIGRATION_ERROR) {
      throw error;
    }
    return [];
  }
}

async function listAdminResortCardsWithFallbackColumns(
  tableName: string,
  propertyType: PropertyType,
  limit = 60
): Promise<ResortRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .select(ADMIN_LIST_COLUMNS.replace("is_featured_homepage,", ""))
    .in("property_type", propertyTypeAliases(propertyType))
    .order("updated_at", { ascending: false })
    .range(0, Math.max(limit - 1, 0));

  if (error || !data?.length) {
    return [];
  }

  const resorts = (data as unknown as ResortRow[]).map(mapResort);
  const resortIds = resorts.map((resort) => resort.id);
  const [heroMedia, roomCounts] = await Promise.all([
    fetchResortHeroMedia(resortIds),
    fetchResortRoomCounts(resortIds)
  ]);

  return resorts.map((resort) => ({
    ...resort,
    heroImageUrl: heroMedia.get(resort.id) ?? "",
    roomCount: roomCounts.get(resort.id) ?? 0
  }));
}

async function listAdminResortCardsWithoutPropertyType(
  tableName = PROPERTY_TABLE,
  limit = 60
): Promise<ResortRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .select(ADMIN_LIST_COLUMNS.replace("property_type,", ""))
    .order("updated_at", { ascending: false })
    .range(0, Math.max(limit - 1, 0));

  if (error || !data?.length) {
    return [];
  }

  const resorts = (data as unknown as ResortRow[]).map(mapResort);
  const resortIds = resorts.map((resort) => resort.id);
  const [heroMedia, roomCounts] = await Promise.all([
    fetchResortHeroMedia(resortIds),
    fetchResortRoomCounts(resortIds)
  ]);

  return resorts.map((resort) => ({
    ...resort,
    heroImageUrl: heroMedia.get(resort.id) ?? "",
    roomCount: roomCounts.get(resort.id) ?? 0
  }));
}

async function listAdminResortsWithoutPropertyType(tableName = PROPERTY_TABLE): Promise<ResortRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from(tableName).select("*").order("updated_at", { ascending: false });

  if (error || !data?.length) {
    return [];
  }

  return attachResortRelations((data as ResortRow[]).map(mapResort));
}

export async function getAdminResortById(id: string): Promise<ResortRecord | null> {
  try {
    const supabase = createSupabaseAdminClient();
    for (const tableName of PROPERTY_TABLES) {
      const { data, error } = await supabase.from(tableName).select("*").eq("id", id).maybeSingle();

      if (error) {
        if (isMissingPropertyTableError(error)) {
          continue;
        }
        throw error;
      }

      if (!data) {
        continue;
      }

      const [resort] = await attachResortRelations([mapResort(data as ResortRow)]);
      return resort ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

async function listPublishedResortRows(propertyType: PropertyType = "resort") {
  const supabase = createSupabaseAdminClient();
  for (const tableName of PROPERTY_TABLES) {
    const rows = await listPublishedResortRowsFromTable(supabase, tableName, propertyType);
    if (rows?.length) {
      return rows;
    }
  }

  return [];
}

async function listPublishedResortRowsFromTable(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  tableName: string,
  propertyType: PropertyType = "resort"
) {
  const firstAttempt = await supabase
    .from(tableName)
    .select("id,property_type,slug,name,atoll,category,transfer_type,description,highlights,meal_plans,seo_summary,status,is_featured_homepage,created_at,updated_at")
    .eq("status", "published")
    .in("property_type", propertyTypeAliases(propertyType))
    .order("updated_at", { ascending: false });

  if (!firstAttempt.error) {
    return (firstAttempt.data ?? []) as Array<
      Pick<
        ResortRow,
        | "id"
        | "property_type"
        | "slug"
        | "name"
        | "atoll"
        | "category"
        | "transfer_type"
        | "description"
        | "highlights"
        | "meal_plans"
        | "seo_summary"
        | "status"
        | "is_featured_homepage"
        | "created_at"
        | "updated_at"
      >
    >;
  }

  if (isMissingPropertyTableError(firstAttempt.error)) {
    return null;
  }

  if (isMissingPropertyTypeColumnError(firstAttempt.error)) {
    return propertyType === "resort" ? listPublishedResortRowsWithoutPropertyType(tableName) : [];
  }

  if (isMissingFeaturedHomepageColumnError(firstAttempt.error)) {
    throw new Error(FEATURED_MIGRATION_ERROR);
  }

  throw firstAttempt.error;
}

async function listPublishedResortRowsWithoutPropertyType(tableName = PROPERTY_TABLE) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .select("id,slug,name,atoll,category,transfer_type,description,highlights,meal_plans,seo_summary,status,created_at,updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<
    Pick<
      ResortRow,
      | "id"
      | "slug"
      | "name"
      | "atoll"
      | "category"
      | "transfer_type"
      | "description"
      | "highlights"
      | "meal_plans"
      | "seo_summary"
      | "status"
      | "created_at"
      | "updated_at"
    >
  >).map((row) => ({
    ...row,
    property_type: "resort" as PropertyType,
    is_featured_homepage: false
  }));
}

const getCachedPublishedResorts = unstable_cache(
  async (): Promise<ResortSummary[]> => {
    try {
      const resortRows = await listPublishedResortRows("resort");

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
          isFeaturedHomepage: Boolean(row.is_featured_homepage),
          highlights: toStringArray(row.highlights),
          mealPlans: toStringArray(row.meal_plans),
          createdAt: row.created_at,
          updatedAt: row.updated_at
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

export async function listPublishedProperties(propertyType: PropertyType): Promise<ResortSummary[]> {
  if (propertyType === "resort") {
    return listPublishedResorts();
  }

  try {
    const rows = await listPublishedResortRows(propertyType);
    const heroMedia = await fetchResortHeroMedia(rows.map((row) => row.id));

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      location: row.atoll ?? "",
      category: row.category ?? "",
      transferType: row.transfer_type ?? "",
      summary: row.seo_summary ?? row.description ?? "",
      heroImageUrl: heroMedia.get(row.id) ?? "",
      status: row.status,
      isFeaturedHomepage: Boolean(row.is_featured_homepage),
      highlights: toStringArray(row.highlights),
      mealPlans: toStringArray(row.meal_plans),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch {
    return [];
  }
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

export async function getResortBySlug(slug: string, propertyType: PropertyType = "resort"): Promise<ResortRecord | null> {
  try {
    const supabase = createSupabaseAdminClient();
    for (const tableName of PROPERTY_TABLES) {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .in("property_type", propertyTypeAliases(propertyType))
        .maybeSingle();

      if (error) {
        if (isMissingPropertyTableError(error)) {
          continue;
        }
        if (isMissingPropertyTypeColumnError(error) && propertyType === "resort") {
          return getResortBySlugWithoutPropertyType(slug, tableName);
        }
        throw error;
      }

      if (!data) {
        continue;
      }

      const [resort] = await attachResortRelations([mapResort(data as ResortRow)]);
      return resort ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

async function getResortBySlugWithoutPropertyType(slug: string, tableName = PROPERTY_TABLE): Promise<ResortRecord | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const [resort] = await attachResortRelations([mapResort(data as ResortRow)]);
  return resort ?? null;
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
  propertyType?: PropertyType;
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
  const propertyType = normalizePropertyType(input.propertyType);
  const basePayload = {
    id: input.id,
    property_type: propertyType,
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

  for (const tableName of PROPERTY_TABLES) {
    const duplicateQuery = supabase
      .from(tableName)
      .select("id")
      .eq("slug", input.slug)
      .limit(1);
    const duplicateAttempt = input.id ? await duplicateQuery.neq("id", input.id).maybeSingle() : await duplicateQuery.maybeSingle();

    if (duplicateAttempt.error) {
      if (isMissingPropertyTableError(duplicateAttempt.error)) {
        continue;
      }
      throw new Error(duplicateAttempt.error.message);
    }

    if (duplicateAttempt.data) {
      throw new Error("A property with this slug already exists. Please choose a different slug.");
    }

    const tablePayload = {
      ...basePayload,
      property_type: propertyTypeForTable(propertyType, tableName)
    };

    const firstAttempt = await supabase
      .from(tableName)
      .upsert({
        ...tablePayload,
        is_featured_homepage: input.status === "published" ? input.isFeaturedHomepage : false
      })
      .select("id")
      .single();

    data = firstAttempt.data;
    error = firstAttempt.error;

    if (error && isMissingPropertyTableError(error)) {
      continue;
    }

    if (error && isMissingPropertyTypeColumnError(error)) {
      const { property_type: _propertyType, ...legacyPayload } = tablePayload;
      const fallbackAttempt = await supabase
        .from(tableName)
        .upsert({
          ...legacyPayload,
          is_featured_homepage: input.status === "published" ? input.isFeaturedHomepage : false
        })
        .select("id")
        .single();

      data = fallbackAttempt.data;
      error = fallbackAttempt.error;
    }

    if (error && isMissingFeaturedHomepageColumnError(error)) {
      throw new Error(FEATURED_MIGRATION_ERROR);
    }

    break;
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
      features: [
        ...(room.viewLabel?.trim() ? [`${VIEW_LABEL_FEATURE_PREFIX}${room.viewLabel.trim()}`] : []),
        ...(room.amenities?.map((item) => item.trim()).filter(Boolean) ?? [])
      ],
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

  revalidateTag("resorts-public", "max");
  revalidatePath("/");
  revalidatePath(propertyBasePath(propertyType));
  revalidatePath(`${propertyBasePath(propertyType)}/${input.slug}`);
}

export async function deleteResort(id: string) {
  const supabase = createSupabaseAdminClient();
  let error: { message?: string } | null = null;

  for (const tableName of PROPERTY_TABLES) {
    const result = await supabase.from(tableName).delete().eq("id", id);
    error = result.error;

    if (error && isMissingPropertyTableError(error)) {
      continue;
    }

    break;
  }

  if (error) {
    throw new Error(error.message);
  }

  revalidateTag("resorts-public", "max");
  revalidatePath("/");
  revalidatePath("/resorts");
}

export async function seedSampleResorts() {
  const supabase = createSupabaseAdminClient();
  const payload = sampleResorts.map((resort, index) => ({
    property_type: "resort" as PropertyType,
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

  let error: { message?: string } | null = null;

  for (const tableName of PROPERTY_TABLES) {
    const seedPayload = payload.map((resort) => ({
      ...resort,
      property_type: propertyTypeForTable("resort", tableName)
    }));
    const { error: firstError } = await supabase.from(tableName).upsert(
      seedPayload.map((resort, index) => ({
        ...resort,
        is_featured_homepage: index < 2 && resort.status === "published"
      })),
      { onConflict: "slug" }
    );

    error = firstError;

    if (error && isMissingPropertyTableError(error)) {
      continue;
    }

    if (error && isMissingFeaturedHomepageColumnError(error)) {
      const fallbackAttempt = await supabase.from(tableName).upsert(seedPayload, { onConflict: "slug" });
      error = fallbackAttempt.error;
    }

    break;
  }

  if (error) {
    throw new Error(error.message);
  }
}

export async function getResortCounts(propertyType: PropertyType = "resort") {
  const resorts = await listAdminResortCards(propertyType, 1000);
  return {
    total: resorts.length,
    published: resorts.filter((resort) => resort.status === "published").length,
    featured: resorts.filter((resort) => resort.status === "published" && resort.isFeaturedHomepage).length,
    draft: resorts.filter((resort) => resort.status === "draft").length
  };
}
