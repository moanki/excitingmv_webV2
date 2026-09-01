import { revalidatePath, revalidateTag } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listAdminResorts, normalizePropertyType, type PropertyType, type ResortRecord, type ResortRoomRecord } from "@/lib/services/resort-service";

export type PhotoImportFileInput = {
  relativePath: string;
  name: string;
  size: number;
  type: string;
};

export type PhotoImportPreviewRow = {
  id: string;
  localResortFolder: string;
  localVillaFolder: string;
  targetType: "banner" | "villa" | "review";
  websiteResortName: string;
  websiteResortId: string;
  websiteResortSlug: string;
  websiteVillaName: string;
  websiteVillaId: string;
  matchStatus: string;
  confidence: number;
  reason: string;
  photoCount: number;
  safeForAutoImport: boolean;
  files: PhotoImportFileInput[];
};

export type PhotoImportPreviewResult = {
  localRootName: string;
  rows: PhotoImportPreviewRow[];
  summary: {
    totalFiles: number;
    totalGroups: number;
    safeGroups: number;
    reviewGroups: number;
    bannerGroups: number;
    villaGroups: number;
  };
};

export type PhotoImportUploadedItem = {
  previewRowId: string;
  publicUrl: string;
  originalName: string;
  sortOrder: number;
};

export type PhotoImportCommitInput = {
  propertyType?: PropertyType;
  replaceExisting?: boolean;
  rows: Array<Pick<PhotoImportPreviewRow, "id" | "websiteResortId" | "websiteResortSlug" | "websiteVillaId" | "websiteResortName" | "websiteVillaName" | "targetType" | "safeForAutoImport">>;
  uploadedItems: PhotoImportUploadedItem[];
};

export type PhotoImportCommitResult = {
  uploaded: Array<{
    websiteResortName: string;
    websiteVillaName: string;
    targetType: "banner" | "villa";
    publicUrl: string;
    originalName: string;
  }>;
  notUploaded: Array<{
    websiteResortName: string;
    websiteVillaName: string;
    targetType: string;
    reason: string;
  }>;
  summary: {
    uploadedCount: number;
    notUploadedCount: number;
    affectedResorts: number;
  };
};

const SUPPORTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const NON_VILLA_FOLDERS = new Set([
  "banner",
  "banners",
  "hero",
  "gallery",
  "galleries",
  "resort",
  "general",
  "dining",
  "spa",
  "activities",
  "activity",
  "facilities",
  "facility",
  "restaurants",
  "restaurant",
  "bars",
  "bar",
  "wellness",
  "images",
  "photos",
  "photo",
  "main"
]);
const BANNER_FOLDERS = new Set(["banner", "banners", "hero"]);
const RESORT_STOP_WORDS = new Set(["maldives", "resort", "resorts", "spa", "island", "islands", "the", "hotel", "hotels", "villas", "villa", "atoll", "collection", "private"]);
const NUMBER_WORDS: Record<string, string> = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10"
};
const VILLA_SYNONYMS: Array<[RegExp, string]> = [
  [/\bover\s+water\b/gu, "overwater"],
  [/\bover-water\b/gu, "overwater"],
  [/\bresidences\b/gu, "residence"],
  [/\bvillas\b/gu, "villa"],
  [/\bretreat\b/gu, "villa"],
  [/\bbungalow\b/gu, "villa"]
];
const CRITICAL_TERMS = new Set(["beach", "overwater", "water", "lagoon", "ocean", "sunrise", "sunset", "pool", "family", "residence", "suite", "villa", "duplex", "1", "2", "3", "4"]);

function cleanText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/&/gu, " and ")
    .replace(/['’]/gu, "")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((token) => NUMBER_WORDS[token] ?? token)
    .join(" ");
}

function normalizeResortName(value: string) {
  return cleanText(value)
    .split(" ")
    .filter((token) => !RESORT_STOP_WORDS.has(token))
    .join(" ");
}

function normalizeVillaName(value: string) {
  let output = cleanText(value);
  VILLA_SYNONYMS.forEach(([pattern, replacement]) => {
    output = output.replace(pattern, replacement);
  });
  return output;
}

function tokens(value: string) {
  return new Set(value.split(" ").filter(Boolean));
}

function similarity(left: string, right: string) {
  if (!left || !right) return 0;
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size || 1;
  const tokenScore = intersection / union;
  const lengthScore = 1 - Math.abs(left.length - right.length) / Math.max(left.length, right.length, 1);
  return Math.round(Math.max(tokenScore, lengthScore * 0.72) * 100);
}

function classify(localName: string, websiteName: string, kind: "resort" | "villa") {
  const rawLocal = cleanText(localName);
  const rawWebsite = cleanText(websiteName);
  const normalizedLocal = kind === "resort" ? normalizeResortName(localName) : normalizeVillaName(localName);
  const normalizedWebsite = kind === "resort" ? normalizeResortName(websiteName) : normalizeVillaName(websiteName);

  if (rawLocal && rawLocal === rawWebsite) {
    return { status: "EXACT_MATCH" as const, confidence: 100, reason: "Names match except capitalization or harmless formatting." };
  }

  if (normalizedLocal && normalizedLocal === normalizedWebsite) {
    return { status: "NORMALIZED_MATCH" as const, confidence: 98, reason: "Names match after normalizing punctuation, filler words, or equivalent wording." };
  }

  const confidence = similarity(normalizedLocal, normalizedWebsite);
  return {
    status: confidence >= 82 ? "LIKELY_MATCH" as const : "REVIEW_REQUIRED" as const,
    confidence,
    reason: "Closest normalized name comparison."
  };
}

function meaningfulVillaDifference(localName: string, websiteName: string) {
  const localTerms = tokens(normalizeVillaName(localName));
  const websiteTerms = tokens(normalizeVillaName(websiteName));
  return [...CRITICAL_TERMS].filter((term) => localTerms.has(term) !== websiteTerms.has(term));
}

function bestResortMatch(localName: string, resorts: ResortRecord[]) {
  const ranked = resorts
    .map((resort) => ({ resort, ...classify(localName, resort.name, "resort") }))
    .sort((left, right) => right.confidence - left.confidence);
  const top = ranked[0];
  if (!top || top.confidence < 70) {
    return { match: null, status: "LOCAL_ONLY" as const, confidence: top?.confidence ?? 0, reason: top ? `No strong resort match. Closest website resort: ${top.resort.name}.` : "No website resorts available." };
  }
  if (ranked[1] && top.confidence - ranked[1].confidence <= 4 && ranked[1].confidence >= 80) {
    return { match: top.resort, status: "AMBIGUOUS" as const, confidence: top.confidence, reason: `Multiple plausible resort matches: ${top.resort.name} and ${ranked[1].resort.name}.` };
  }
  return { match: top.resort, status: top.status, confidence: top.confidence, reason: top.reason };
}

function bestVillaMatch(localName: string, rooms: ResortRoomRecord[]) {
  const ranked = rooms
    .map((room) => ({ room, ...classify(localName, room.name, "villa") }))
    .sort((left, right) => right.confidence - left.confidence);
  const top = ranked[0];
  if (!top || top.confidence < 65) {
    return { match: null, status: "LOCAL_ONLY" as const, confidence: top?.confidence ?? 0, reason: top ? `No strong villa match. Closest website villa: ${top.room.name}.` : "This resort has no website villa records." };
  }
  if (ranked[1] && top.confidence - ranked[1].confidence <= 4 && ranked[1].confidence >= 80) {
    return { match: top.room, status: "AMBIGUOUS" as const, confidence: top.confidence, reason: `Multiple plausible villa matches: ${top.room.name} and ${ranked[1].room.name}.` };
  }
  const differences = meaningfulVillaDifference(localName, top.room.name);
  if (differences.length && top.status !== "EXACT_MATCH" && top.status !== "NORMALIZED_MATCH") {
    return { match: top.room, status: "REVIEW_REQUIRED" as const, confidence: top.confidence, reason: `Meaningful villa words differ: ${differences.join(", ")}. Closest website villa: ${top.room.name}.` };
  }
  return { match: top.room, status: top.status, confidence: top.confidence, reason: top.reason };
}

function fileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function splitRelativePath(relativePath: string) {
  return relativePath.replace(/\\/gu, "/").split("/").map((part) => part.trim()).filter(Boolean);
}

function localGroups(files: PhotoImportFileInput[]) {
  const groups = new Map<string, { localResortFolder: string; localVillaFolder: string; targetType: "banner" | "villa" | "review"; files: PhotoImportFileInput[] }>();

  files.forEach((file) => {
    if (!SUPPORTED_EXTENSIONS.has(fileExtension(file.name || file.relativePath))) return;
    const parts = splitRelativePath(file.relativePath || file.name);
    const effectiveParts = cleanText(parts[0] ?? "") === "resortphotos" ? parts.slice(1) : parts;
    const [resortFolder, second] = effectiveParts;
    if (!resortFolder) return;

    let targetType: "banner" | "villa" | "review" = "review";
    let localVillaFolder = "";
    const secondKey = cleanText(second ?? "");

    if (!second) {
      targetType = "review";
      localVillaFolder = "";
    } else if (BANNER_FOLDERS.has(secondKey)) {
      targetType = "banner";
      localVillaFolder = second;
    } else if (!NON_VILLA_FOLDERS.has(secondKey)) {
      targetType = "villa";
      localVillaFolder = second;
    } else {
      targetType = "review";
      localVillaFolder = second;
    }

    const key = `${resortFolder}\u0000${targetType}\u0000${localVillaFolder}`;
    const group = groups.get(key) ?? { localResortFolder: resortFolder, localVillaFolder, targetType, files: [] };
    group.files.push(file);
    groups.set(key, group);
  });

  return [...groups.values()].sort((left, right) =>
    `${left.localResortFolder}/${left.localVillaFolder}`.localeCompare(`${right.localResortFolder}/${right.localVillaFolder}`)
  );
}

export async function previewPhotoImport(input: { propertyType?: PropertyType; files: PhotoImportFileInput[] }): Promise<PhotoImportPreviewResult> {
  const propertyType = normalizePropertyType(input.propertyType);
  const resorts = await listAdminResorts(propertyType);
  const groups = localGroups(input.files);
  const localRootName = splitRelativePath(input.files[0]?.relativePath ?? "")[0] ?? "Selected folder";

  const rows = groups.map((group, index) => {
    const resortMatch = bestResortMatch(group.localResortFolder, resorts);
    const websiteResort = resortMatch.match;
    const base = {
      id: `photo-row-${index}`,
      localResortFolder: group.localResortFolder,
      localVillaFolder: group.localVillaFolder,
      targetType: group.targetType,
      websiteResortName: websiteResort?.name ?? "",
      websiteResortId: websiteResort?.id ?? "",
      websiteResortSlug: websiteResort?.slug ?? "",
      websiteVillaName: "",
      websiteVillaId: "",
      matchStatus: resortMatch.status,
      confidence: resortMatch.confidence,
      reason: resortMatch.reason,
      photoCount: group.files.length,
      safeForAutoImport: false,
      files: group.files
    } satisfies PhotoImportPreviewRow;

    const resortSafe = Boolean(websiteResort) && ["EXACT_MATCH", "NORMALIZED_MATCH"].includes(resortMatch.status) && resortMatch.confidence >= 95;
    if (!resortSafe || !websiteResort) {
      return base;
    }

    if (group.targetType === "banner") {
      return {
        ...base,
        websiteVillaName: "Resort banner",
        matchStatus: resortMatch.status,
        reason: `Banner folder matched to ${websiteResort.name}.`,
        safeForAutoImport: group.files.length > 0
      };
    }

    if (group.targetType !== "villa") {
      return {
        ...base,
        matchStatus: "REVIEW_REQUIRED",
        reason: "Folder is not a recognized banner or villa folder."
      };
    }

    const villaMatch = bestVillaMatch(group.localVillaFolder, websiteResort.roomTypes);
    const villaSafe = ["EXACT_MATCH", "NORMALIZED_MATCH"].includes(villaMatch.status) && villaMatch.confidence >= 95 && group.files.length > 0;
    return {
      ...base,
      websiteVillaName: villaMatch.match?.name ?? "",
      websiteVillaId: villaMatch.match?.id ?? "",
      matchStatus: villaMatch.status,
      confidence: villaMatch.confidence,
      reason: villaMatch.reason,
      safeForAutoImport: villaSafe
    };
  });

  return {
    localRootName,
    rows,
    summary: {
      totalFiles: input.files.length,
      totalGroups: rows.length,
      safeGroups: rows.filter((row) => row.safeForAutoImport).length,
      reviewGroups: rows.filter((row) => !row.safeForAutoImport).length,
      bannerGroups: rows.filter((row) => row.targetType === "banner").length,
      villaGroups: rows.filter((row) => row.targetType === "villa").length
    }
  };
}

export async function commitPhotoImport(input: PhotoImportCommitInput): Promise<PhotoImportCommitResult> {
  const supabase = createSupabaseAdminClient();
  const safeRows = new Map(input.rows.filter((row) => row.safeForAutoImport && row.websiteResortId).map((row) => [row.id, row]));
  const uploaded: PhotoImportCommitResult["uploaded"] = [];
  const notUploaded: PhotoImportCommitResult["notUploaded"] = [];
  const affectedResortIds = new Set<string>();
  const groupedDeletes = new Set<string>();

  for (const item of input.uploadedItems) {
    const row = safeRows.get(item.previewRowId);
    if (!row) {
      notUploaded.push({ websiteResortName: "", websiteVillaName: "", targetType: "unknown", reason: `Skipped ${item.originalName}: preview row was not safe or no longer exists.` });
      continue;
    }

    if (row.targetType === "villa" && !row.websiteVillaId) {
      notUploaded.push({ websiteResortName: row.websiteResortName, websiteVillaName: row.websiteVillaName, targetType: row.targetType, reason: `Skipped ${item.originalName}: matched villa is missing a website room id.` });
      continue;
    }

    if (row.targetType === "review") {
      notUploaded.push({ websiteResortName: row.websiteResortName, websiteVillaName: row.websiteVillaName, targetType: row.targetType, reason: `Skipped ${item.originalName}: review-only rows cannot be imported automatically.` });
      continue;
    }

    const targetKey = `${row.websiteResortId}:${row.targetType}:${row.websiteVillaId || "banner"}`;
    if (input.replaceExisting && !groupedDeletes.has(targetKey)) {
      const deleteQuery = supabase.from("resort_media").delete().eq("resort_id", row.websiteResortId);
      const deleted = row.targetType === "banner"
        ? await deleteQuery.is("room_id", null).eq("is_hero", true)
        : await deleteQuery.eq("room_id", row.websiteVillaId);
      groupedDeletes.add(targetKey);
      if (deleted.error) {
        notUploaded.push({ websiteResortName: row.websiteResortName, websiteVillaName: row.websiteVillaName, targetType: row.targetType, reason: deleted.error.message });
        continue;
      }
    }

    const inserted = await supabase.from("resort_media").insert({
      resort_id: row.websiteResortId,
      room_id: row.targetType === "villa" ? row.websiteVillaId : null,
      file_path: item.publicUrl,
      alt_text: row.targetType === "villa" ? `${row.websiteResortName} ${row.websiteVillaName}` : row.websiteResortName,
      is_hero: row.targetType === "banner",
      sort_order: row.targetType === "banner" ? item.sortOrder : 100 + item.sortOrder
    });

    if (inserted.error) {
      notUploaded.push({ websiteResortName: row.websiteResortName, websiteVillaName: row.websiteVillaName, targetType: row.targetType, reason: inserted.error.message });
      continue;
    }

    affectedResortIds.add(row.websiteResortId);
    uploaded.push({
      websiteResortName: row.websiteResortName,
      websiteVillaName: row.websiteVillaName,
      targetType: row.targetType,
      publicUrl: item.publicUrl,
      originalName: item.originalName
    });
  }

  if (affectedResortIds.size) {
    revalidateTag("resorts-public", "max");
    revalidatePath("/");
    revalidatePath("/resorts");
    revalidatePath("/admin/resorts");
    input.rows
      .filter((row) => affectedResortIds.has(row.websiteResortId) && row.websiteResortSlug)
      .forEach((row) => revalidatePath(`/resorts/${row.websiteResortSlug}`));
  }

  return {
    uploaded,
    notUploaded,
    summary: {
      uploadedCount: uploaded.length,
      notUploadedCount: notUploaded.length,
      affectedResorts: affectedResortIds.size
    }
  };
}
