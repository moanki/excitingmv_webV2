import ExcelJS from "exceljs";

import { toErrorMessage } from "@/lib/error-message";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/lib/types";
import {
  listAdminResorts,
  normalizePropertyType,
  type PropertyType,
  type ResortRecord
} from "@/lib/services/resort-service";

type ExcelCellValue = string | number | boolean | Date | null;

type ParsedSheet = {
  name: string;
  rows: ExcelCellValue[][];
};

export type ExcelSyncStatus =
  | "ready_to_update"
  | "ready_to_create"
  | "needs_review"
  | "parse_error"
  | "updated"
  | "created"
  | "failed"
  | "skipped"
  | "no_source_workbook";

export type ExcelResortRoomModel = {
  name: string;
  description: string;
  seoDescription: string;
  sizeLabel: string;
  maxOccupancy: number | null;
  bedType: string;
  viewLabel: string;
  amenities: string[];
  source: string;
};

export type ExcelResortImportModel = {
  sourceFile: {
    sourceUrl: string;
    filename: string;
    sheets: string[];
  };
  resort: {
    name: string;
    slug: string;
    location: string;
    category: string;
    transferType: string;
    description: string;
    highlights: string[];
    mealPlans: string[];
    seoTitle?: string;
    seoDescription?: string;
    seoSummary?: string;
  };
  rooms: ExcelResortRoomModel[];
  warnings: string[];
};

export type ExcelResortMatch =
  | {
      status: "matched";
      resortId: string;
      resortName: string;
      confidence: "manual" | "exact";
    }
  | {
      status: "new";
    }
  | {
      status: "review_required";
      candidates: Array<{ resortId: string; resortName: string; reason: string }>;
    };

export type ExcelResortPreview = {
  stagingId: string;
  sourceIndex: number;
  sourceUrl: string;
  filename: string;
  status: ExcelSyncStatus;
  action: "update" | "create" | "review" | "error" | "skipped";
  model?: ExcelResortImportModel;
  match?: ExcelResortMatch;
  diff?: ExcelResortDiff;
  error?: string;
  warnings: string[];
  existingPhotosCount: number;
  matchingRoomPhotosPreserved: number;
};

export type ExcelResortDiff = {
  rootFields: Array<{ field: string; current: string; excel: string; action: "Update" | "Clear" | "Keep protected" }>;
  rooms: {
    added: number;
    updated: number;
    removed: number;
    final: number;
  };
  highlights: {
    current: number;
    excel: number;
    action: "Synchronize";
  };
  mealPlans: {
    current: number;
    excel: number;
    action: "Synchronize";
  };
};

export type ExcelSyncStartResult = {
  batchId: string;
  sourceFiles: string[];
  message: string;
};

export type ExcelSyncDelta = {
  processedSources: number;
  readyToUpdate: number;
  readyToCreate: number;
  needsReview: number;
  parseErrors: number;
  noSourceWorkbook: number;
  previews: ExcelResortPreview[];
};

export type ExcelSyncApplyResult = {
  status: ExcelSyncStatus;
  message: string;
  resortId?: string;
  resortName?: string;
};

type PropertyRow = {
  id: string;
  property_type?: string | null;
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
  status: string;
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
  id: string;
  resort_id: string;
  room_id: string | null;
  file_path: string;
  is_hero: boolean;
  sort_order: number | null;
};

type StagingPayload = {
  kind: "excel_resort_sync_preview";
  version: 1;
  propertyType: PropertyType;
  sourceIndex: number;
  sourceUrl: string;
  filename: string;
  status: ExcelSyncStatus;
  action: ExcelResortPreview["action"];
  model?: ExcelResortImportModel;
  match?: ExcelResortMatch;
  diff?: ExcelResortDiff;
  error?: string;
  warnings: string[];
  existingPhotosCount: number;
  matchingRoomPhotosPreserved: number;
};

const SHEET_ALIASES = {
  general: ["general", "overview", "resort", "property", "facts", "fact sheet"],
  rooms: ["villas", "villa", "rooms", "room", "accommodation", "accommodations", "suites"],
  mealPlans: ["meal plans", "meal plan", "meals", "dining plans"]
};

const ROOT_FIELD_ALIASES: Record<string, keyof ExcelResortImportModel["resort"]> = {
  resortname: "name",
  propertyname: "name",
  name: "name",
  slug: "slug",
  atoll: "location",
  location: "location",
  island: "location",
  category: "category",
  resortcategory: "category",
  transfertype: "transferType",
  transfer: "transferType",
  description: "description",
  summary: "description",
  highlights: "highlights",
  facilities: "highlights",
  amenities: "highlights",
  mealplans: "mealPlans",
  mealplan: "mealPlans",
  seotitle: "seoTitle",
  seodescription: "seoDescription",
  seosummary: "seoSummary"
};

const VIEW_LABEL_FEATURE_PREFIX = "__viewLabel:";
const MAX_LIVE_PREVIEWS = 24;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeIdentity(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(resort|spa|maldives|hotel|island)\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function cellToValue(value: ExcelJS.CellValue): ExcelCellValue {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object" && "text" in value && typeof value.text === "string") return value.text;
  if (typeof value === "object" && "result" in value) return cellToValue(value.result as ExcelJS.CellValue);
  if (typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((item) => item.text).join("");
  }
  return String(value);
}

function valueToString(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [];
}

function splitList(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|;|,/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function parseNumber(value: string) {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function sheetMatches(sheetName: string, aliases: string[]) {
  const normalized = normalizeKey(sheetName);
  return aliases.some((alias) => normalized.includes(normalizeKey(alias)));
}

function uniqueSlug(base: string, existing: ResortRecord[]) {
  const root = slugify(base) || "resort";
  const slugs = new Set(existing.map((resort) => resort.slug));
  if (!slugs.has(root)) return root;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${root}-${index}`;
    if (!slugs.has(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}

function createEmptyModel(sourceUrl: string, filename: string, sheets: string[]): ExcelResortImportModel {
  return {
    sourceFile: { sourceUrl, filename, sheets },
    resort: {
      name: "",
      slug: "",
      location: "",
      category: "",
      transferType: "",
      description: "",
      highlights: [],
      mealPlans: []
    },
    rooms: [],
    warnings: []
  };
}

async function workbookToSheets(bytes: Uint8Array): Promise<ParsedSheet[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);

  return workbook.worksheets.map((sheet) => {
    const rows: ExcelCellValue[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      const cells = values.map(cellToValue);
      if (cells.some((cell) => valueToString(cell))) {
        rows.push(cells);
      }
    });
    return { name: sheet.name, rows };
  });
}

function applyGeneralSheet(model: ExcelResortImportModel, sheet: ParsedSheet) {
  for (const row of sheet.rows) {
    const first = valueToString(row[0]);
    const second = valueToString(row[1]);
    if (!first || !second) continue;
    const field = ROOT_FIELD_ALIASES[normalizeKey(first)];
    if (!field) continue;

    if (field === "highlights" || field === "mealPlans") {
      model.resort[field] = splitList(second);
    } else {
      model.resort[field] = second;
    }
  }
}

function findHeaderRow(rows: ExcelCellValue[][]) {
  for (let index = 0; index < rows.length; index += 1) {
    const normalized = rows[index].map((cell) => normalizeKey(valueToString(cell)));
    if (normalized.some((cell) => ["name", "roomname", "villas", "villaname", "accommodation"].includes(cell))) {
      return index;
    }
  }
  return -1;
}

function columnIndex(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.some((alias) => header.includes(alias)));
}

function applyRoomsSheet(model: ExcelResortImportModel, sheet: ParsedSheet) {
  const headerIndex = findHeaderRow(sheet.rows);
  if (headerIndex < 0) {
    model.warnings.push(`${sheet.name}: could not identify a room header row.`);
    return;
  }

  const headers = sheet.rows[headerIndex].map((cell) => normalizeKey(valueToString(cell)));
  const nameIndex = columnIndex(headers, ["villaname", "roomname", "accommodation", "name", "villa", "room"]);
  if (nameIndex < 0) {
    model.warnings.push(`${sheet.name}: room name column is missing.`);
    return;
  }

  const descriptionIndex = columnIndex(headers, ["description", "summary"]);
  const sizeIndex = columnIndex(headers, ["size", "sqm", "m2"]);
  const occupancyIndex = columnIndex(headers, ["occupancy", "pax", "capacity", "guests"]);
  const bedIndex = columnIndex(headers, ["bed", "bedding"]);
  const viewIndex = columnIndex(headers, ["view"]);
  const amenitiesIndex = columnIndex(headers, ["amenities", "features", "facilities"]);

  for (const row of sheet.rows.slice(headerIndex + 1)) {
    const name = valueToString(row[nameIndex]);
    if (!name) continue;
    const description = descriptionIndex >= 0 ? valueToString(row[descriptionIndex]) : "";
    const amenities = amenitiesIndex >= 0 ? splitList(valueToString(row[amenitiesIndex])) : [];
    model.rooms.push({
      name,
      description,
      seoDescription: description,
      sizeLabel: sizeIndex >= 0 ? valueToString(row[sizeIndex]) : "",
      maxOccupancy: occupancyIndex >= 0 ? parseNumber(valueToString(row[occupancyIndex])) : null,
      bedType: bedIndex >= 0 ? valueToString(row[bedIndex]) : "",
      viewLabel: viewIndex >= 0 ? valueToString(row[viewIndex]) : "",
      amenities,
      source: sheet.name
    });
  }
}

function validateExcelModel(model: ExcelResortImportModel) {
  const errors: string[] = [];
  const roomNames = model.rooms.map((room) => normalizeIdentity(room.name)).filter(Boolean);
  const duplicateRoomNames = Array.from(new Set(roomNames.filter((name, index) => roomNames.indexOf(name) !== index)));

  if (!model.sourceFile.sheets.length) errors.push("The workbook contains no readable sheets.");
  if (!model.resort.name.trim()) errors.push("A resort name is required.");
  if (!model.resort.slug.trim()) errors.push("A resort slug could not be derived from the workbook.");
  if (duplicateRoomNames.length) {
    model.warnings.push(`Ambiguous villa names require review: ${duplicateRoomNames.join(", ")}.`);
  }

  return { errors, hasAmbiguousRooms: duplicateRoomNames.length > 0 };
}

function applyListSheet(model: ExcelResortImportModel, sheet: ParsedSheet, field: "mealPlans" | "highlights") {
  const values = sheet.rows
    .flatMap((row) => row.map(valueToString))
    .flatMap(splitList)
    .filter(Boolean);
  if (values.length) {
    model.resort[field] = Array.from(new Set([...(model.resort[field] ?? []), ...values]));
  }
}

export async function parseExcelResortWorkbook(input: {
  sourceUrl: string;
  filename: string;
  bytes: Uint8Array;
}): Promise<ExcelResortImportModel> {
  const sheets = await workbookToSheets(input.bytes);
  const model = createEmptyModel(input.sourceUrl, input.filename, sheets.map((sheet) => sheet.name));

  for (const sheet of sheets) {
    if (sheetMatches(sheet.name, SHEET_ALIASES.general)) {
      applyGeneralSheet(model, sheet);
    } else if (sheetMatches(sheet.name, SHEET_ALIASES.rooms)) {
      applyRoomsSheet(model, sheet);
    } else if (sheetMatches(sheet.name, SHEET_ALIASES.mealPlans)) {
      applyListSheet(model, sheet, "mealPlans");
    } else if (sheet.rows.length) {
      model.warnings.push(`${sheet.name}: sheet was retained as source metadata but is not mapped to the current schema yet.`);
    }
  }

  if (!model.resort.name) {
    model.resort.name = input.filename.replace(/\.[^.]+$/u, "").trim();
    model.warnings.push("General sheet did not contain a resort name; filename was used for matching only.");
  }

  model.resort.slug = slugify(model.resort.slug || model.resort.name);
  return model;
}

function matchResort(model: ExcelResortImportModel, existing: ResortRecord[], manualResortId?: string): ExcelResortMatch {
  if (manualResortId) {
    const manual = existing.find((resort) => resort.id === manualResortId);
    if (manual) {
      return { status: "matched", resortId: manual.id, resortName: manual.name, confidence: "manual" };
    }
  }

  const slug = slugify(model.resort.slug || model.resort.name);
  const normalizedName = normalizeIdentity(model.resort.name);
  const filenameName = normalizeIdentity(model.sourceFile.filename.replace(/\.[^.]+$/u, ""));
  const exactMatches = existing.filter(
    (resort) =>
      slugify(resort.slug || resort.name) === slug ||
      normalizeIdentity(resort.name) === normalizedName ||
      normalizeIdentity(resort.name) === filenameName
  );

  if (exactMatches.length === 1) {
    return {
      status: "matched",
      resortId: exactMatches[0].id,
      resortName: exactMatches[0].name,
      confidence: "exact"
    };
  }

  if (exactMatches.length > 1) {
    return {
      status: "review_required",
      candidates: exactMatches.map((resort) => ({
        resortId: resort.id,
        resortName: resort.name,
        reason: "Exact normalized identity collision"
      }))
    };
  }

  return { status: "new" };
}

function countMedia(resort: ResortRecord | undefined) {
  if (!resort) return 0;
  return new Set([resort.heroImageUrl, ...resort.galleryMediaUrls, ...resort.roomTypes.map((room) => room.photoUrl)].filter(Boolean)).size;
}

function roomPhotoPreservation(model: ExcelResortImportModel, resort: ResortRecord | undefined) {
  if (!resort) return 0;
  const existingByName = new Map(resort.roomTypes.map((room) => [normalizeIdentity(room.name), room]));
  return model.rooms.filter((room) => existingByName.get(normalizeIdentity(room.name))?.photoUrl).length;
}

function buildDiff(model: ExcelResortImportModel, resort: ResortRecord | undefined): ExcelResortDiff {
  const rootFields: ExcelResortDiff["rootFields"] = [];
  const compare = (field: string, current: string, excel: string) => {
    if (current !== excel) {
      rootFields.push({ field, current, excel, action: excel ? "Update" : "Clear" });
    }
  };

  if (resort) {
    compare("Name", resort.name, model.resort.name);
    compare("Location", resort.location, model.resort.location);
    compare("Category", resort.category, model.resort.category);
    compare("Transfer", resort.transferType, model.resort.transferType);
    compare("Description", resort.description, model.resort.description);
    if (model.resort.seoTitle !== undefined) compare("SEO title", resort.seoTitle, model.resort.seoTitle);
    if (model.resort.seoDescription !== undefined) compare("SEO description", resort.seoDescription, model.resort.seoDescription);
    if (model.resort.seoSummary !== undefined) compare("SEO summary", resort.seoSummary, model.resort.seoSummary);
  } else {
    rootFields.push({ field: "Property", current: "Not in database", excel: model.resort.name, action: "Update" });
  }

  const existingRoomNames = new Set((resort?.roomTypes ?? []).map((room) => normalizeIdentity(room.name)));
  const excelRoomNames = new Set(model.rooms.map((room) => normalizeIdentity(room.name)));
  const updated = model.rooms.filter((room) => existingRoomNames.has(normalizeIdentity(room.name))).length;

  return {
    rootFields,
    rooms: {
      added: model.rooms.length - updated,
      updated,
      removed: [...existingRoomNames].filter((name) => !excelRoomNames.has(name)).length,
      final: model.rooms.length
    },
    highlights: {
      current: resort?.highlights.length ?? 0,
      excel: model.resort.highlights.length,
      action: "Synchronize"
    },
    mealPlans: {
      current: resort?.mealPlans.length ?? 0,
      excel: model.resort.mealPlans.length,
      action: "Synchronize"
    }
  };
}

async function resolveGoogleDriveExcelSources(url: string) {
  const parsed = new URL(url);
  const folderMatch = parsed.pathname.match(/\/drive\/folders\/([^/?]+)/);
  if (!folderMatch?.[1]) return [normalizeGoogleDriveExcelUrl(url)];

  const html = await fetch(url, { cache: "no-store" }).then((response) => response.text());
  const matches = Array.from(
    new Set(
      [
        ...Array.from(html.matchAll(/https:\/\/drive\.google\.com\/file\/d\/[^"'&<\s]+/g)).map((match) => match[0]),
        ...Array.from(html.matchAll(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[^"'&<\s]+/g)).map((match) => match[0]),
        ...Array.from(html.matchAll(/https?:\/\/[^"'<> \t\r\n]+\.xlsx(?:\?[^"'<> \t\r\n]*)?/gi)).map((match) => match[0])
      ]
        .map((item) => normalizeGoogleDriveExcelUrl(item.replace(/&amp;/g, "&")))
        .filter(Boolean)
    )
  );

  if (!matches.length) throw new Error("No readable Excel workbooks were found in that Google Drive folder.");
  return matches;
}

function normalizeGoogleDriveExcelUrl(url: string) {
  const parsed = new URL(url);
  const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
  if (fileMatch?.[1]) {
    const normalized = new URL("https://drive.google.com/uc");
    normalized.searchParams.set("export", "download");
    normalized.searchParams.set("id", fileMatch[1]);
    return normalized.toString();
  }

  const sheetMatch = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (sheetMatch?.[1]) {
    const normalized = new URL(`https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export`);
    normalized.searchParams.set("format", "xlsx");
    return normalized.toString();
  }

  return url;
}

function guessExcelFilename(url: string, index: number) {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").filter(Boolean).pop() || `resort-${index + 1}.xlsx`;
    return /\.(xlsx|xlsm|xls)$/i.test(last) ? last : `resort-${index + 1}.xlsx`;
  } catch {
    return `resort-${index + 1}.xlsx`;
  }
}

async function downloadExcelSource(sourceUrl: string, index: number) {
  const response = await fetch(sourceUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to download Excel workbook from ${sourceUrl}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return {
    sourceUrl,
    filename: guessExcelFilename(sourceUrl, index),
    bytes
  };
}

async function createBatchRecord(sourceUrl: string, propertyType: PropertyType) {
  const supabase = createSupabaseAdminClient();
  const stamp = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("import_batches")
    .insert({
      batch_name: `Excel resort sync ${stamp}`,
      source_type: `google_drive_excel:${propertyType}`,
      file_path: sourceUrl,
      status: "analyzing"
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to start Excel sync.");
  return (data as { id: string }).id;
}

async function insertPreview(batchId: string, payload: StagingPayload) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("resort_staging")
    .insert({
      batch_id: batchId,
      raw_payload: {
        sourceUrl: payload.sourceUrl,
        filename: payload.filename,
        propertyType: payload.propertyType,
        sheets: payload.model?.sourceFile.sheets ?? []
      },
      extracted_payload: payload,
      review_status: payload.status
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to store Excel sync preview.");
  return (data as { id: string }).id;
}

async function saveExcelMapping(input: {
  model: ExcelResortImportModel;
  propertyType: PropertyType;
  match: Extract<ExcelResortMatch, { status: "matched" }>;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("excel_resort_sync_mappings").upsert(
    {
      source_identifier: input.model.resort.slug || normalizeIdentity(input.model.resort.name),
      source_filename: input.model.sourceFile.filename,
      property_type: input.propertyType,
      resort_id: input.match.resortId,
      confidence: input.match.confidence,
      updated_at: new Date().toISOString()
    },
    { onConflict: "source_identifier,property_type" }
  );
  if (error) throw new Error(error.message);
}

function payloadToPreview(stagingId: string, payload: StagingPayload): ExcelResortPreview {
  return {
    stagingId,
    sourceIndex: payload.sourceIndex,
    sourceUrl: payload.sourceUrl,
    filename: payload.filename,
    status: payload.status,
    action: payload.action,
    model: payload.model,
    match: payload.match,
    diff: payload.diff,
    error: payload.error,
    warnings: payload.warnings,
    existingPhotosCount: payload.existingPhotosCount,
    matchingRoomPhotosPreserved: payload.matchingRoomPhotosPreserved
  };
}

export async function startExcelResortSync(input: {
  googleDriveUrl: string;
  propertyType?: PropertyType;
}): Promise<ServiceResult<ExcelSyncStartResult>> {
  try {
    const sourceUrl = input.googleDriveUrl.trim();
    if (!sourceUrl) return { ok: false, error: "Google Drive folder or workbook URL is required.", status: 400 };
    const propertyType = normalizePropertyType(input.propertyType);
    const sourceFiles = await resolveGoogleDriveExcelSources(sourceUrl);
    const batchId = await createBatchRecord(sourceUrl, propertyType);
    return {
      ok: true,
      data: {
        batchId,
        sourceFiles,
        message: `Found ${sourceFiles.length} Excel workbook${sourceFiles.length === 1 ? "" : "s"} to analyze.`
      }
    };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, "Failed to prepare Excel sync.") };
  }
}

export async function processExcelResortSyncSource(input: {
  batchId: string;
  sourceUrl: string;
  sourceIndex: number;
  propertyType?: PropertyType;
  manualMatchResortId?: string;
}): Promise<ServiceResult<ExcelSyncDelta>> {
  try {
    const propertyType = normalizePropertyType(input.propertyType);
    const existingResorts = await listAdminResorts(propertyType);
    const downloaded = await downloadExcelSource(input.sourceUrl, input.sourceIndex);
    const model = await parseExcelResortWorkbook(downloaded);
    const validation = validateExcelModel(model);
    const match = matchResort(model, existingResorts, input.manualMatchResortId);
    const existing = match.status === "matched" ? existingResorts.find((resort) => resort.id === match.resortId) : undefined;
    const diff = buildDiff(model, existing);
    const status: ExcelSyncStatus =
      validation.errors.length > 0
        ? "parse_error"
        : validation.hasAmbiguousRooms || match.status === "review_required"
          ? "needs_review"
          : match.status === "matched"
            ? "ready_to_update"
            : "ready_to_create";
    const action = status === "parse_error" ? "error" : status === "needs_review" ? "review" : match.status === "matched" ? "update" : "create";
    const payload: StagingPayload = {
      kind: "excel_resort_sync_preview",
      version: 1,
      propertyType,
      sourceIndex: input.sourceIndex,
      sourceUrl: downloaded.sourceUrl,
      filename: downloaded.filename,
      status,
      action,
      model,
      match,
      diff,
      error: validation.errors.length ? validation.errors.join(" ") : undefined,
      warnings: model.warnings,
      existingPhotosCount: countMedia(existing),
      matchingRoomPhotosPreserved: roomPhotoPreservation(model, existing)
    };
    const stagingId = await insertPreview(input.batchId, payload);
    const preview = payloadToPreview(stagingId, payload);

    return {
      ok: true,
      data: {
        processedSources: 1,
        readyToUpdate: status === "ready_to_update" ? 1 : 0,
        readyToCreate: status === "ready_to_create" ? 1 : 0,
        needsReview: status === "needs_review" ? 1 : 0,
        parseErrors: status === "parse_error" ? 1 : 0,
        noSourceWorkbook: 0,
        previews: [preview]
      }
    };
  } catch (error) {
    const propertyType = normalizePropertyType(input.propertyType);
    const payload: StagingPayload = {
      kind: "excel_resort_sync_preview",
      version: 1,
      propertyType,
      sourceIndex: input.sourceIndex,
      sourceUrl: input.sourceUrl,
      filename: guessExcelFilename(input.sourceUrl, input.sourceIndex),
      status: "parse_error",
      action: "error",
      error: toErrorMessage(error, "Workbook could not be parsed."),
      warnings: [],
      existingPhotosCount: 0,
      matchingRoomPhotosPreserved: 0
    };
    const stagingId = await insertPreview(input.batchId, payload);
    return {
      ok: true,
      data: {
        processedSources: 1,
        readyToUpdate: 0,
        readyToCreate: 0,
        needsReview: 0,
        parseErrors: 1,
        noSourceWorkbook: 0,
        previews: [payloadToPreview(stagingId, payload)]
      }
    };
  }
}

async function loadStagingPayload(stagingId: string): Promise<{ payload: StagingPayload; reviewStatus: string }> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("resort_staging")
    .select("extracted_payload,review_status")
    .eq("id", stagingId)
    .maybeSingle();

  if (error || !data) throw new Error(error?.message ?? "Excel sync preview was not found.");
  const payload = (data as { extracted_payload: unknown }).extracted_payload as StagingPayload;
  if (payload?.kind !== "excel_resort_sync_preview" || payload.version !== 1) {
    throw new Error("Selected checkpoint is not an Excel resort sync preview.");
  }
  return { payload, reviewStatus: String((data as { review_status?: unknown }).review_status ?? "") };
}

async function fetchCurrentProperty(resortId: string): Promise<PropertyRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("property").select("*").eq("id", resortId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PropertyRow | null) ?? null;
}

async function fetchCurrentRooms(resortId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id,resort_id,name,short_description,size_label,max_occupancy,bed_type,features,seo_summary,sort_order")
    .eq("resort_id", resortId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as RoomRow[];
}

async function fetchCurrentMedia(resortId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("resort_media")
    .select("id,resort_id,room_id,file_path,is_hero,sort_order")
    .eq("resort_id", resortId);
  if (error) throw new Error(error.message);
  return (data ?? []) as MediaRow[];
}

function roomFeatures(room: ExcelResortRoomModel) {
  return [
    ...(room.viewLabel.trim() ? [`${VIEW_LABEL_FEATURE_PREFIX}${room.viewLabel.trim()}`] : []),
    ...room.amenities.map((item) => item.trim()).filter(Boolean)
  ];
}

async function syncRooms(resortId: string, rooms: ExcelResortRoomModel[]) {
  const supabase = createSupabaseAdminClient();
  const currentRooms = await fetchCurrentRooms(resortId);
  const currentByName = new Map(currentRooms.map((room) => [normalizeIdentity(room.name), room]));
  const incomingNames = new Set(rooms.map((room) => normalizeIdentity(room.name)));

  for (let index = 0; index < rooms.length; index += 1) {
    const room = rooms[index];
    const matched = currentByName.get(normalizeIdentity(room.name));
    const payload = {
      resort_id: resortId,
      name: room.name.trim(),
      short_description: room.description.trim() || null,
      size_label: room.sizeLabel.trim() || null,
      max_occupancy: room.maxOccupancy,
      bed_type: room.bedType.trim() || null,
      features: roomFeatures(room),
      seo_summary: room.seoDescription.trim() || room.description.trim() || null,
      sort_order: index
    };

    if (matched) {
      const { error } = await supabase.from("rooms").update(payload).eq("id", matched.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("rooms").insert(payload);
      if (error) throw new Error(error.message);
    }
  }

  const removedIds = currentRooms.filter((room) => !incomingNames.has(normalizeIdentity(room.name))).map((room) => room.id);
  if (removedIds.length) {
    const detach = await supabase.from("resort_media").update({ room_id: null }).in("room_id", removedIds);
    if (detach.error) throw new Error(detach.error.message);
    const remove = await supabase.from("rooms").delete().in("id", removedIds);
    if (remove.error) throw new Error(remove.error.message);
  }
}

async function createPropertyFromExcel(model: ExcelResortImportModel, propertyType: PropertyType) {
  const supabase = createSupabaseAdminClient();
  const existing = await listAdminResorts(propertyType);
  const now = new Date().toISOString();
  const slug = uniqueSlug(model.resort.slug || model.resort.name, existing);
  const { data, error } = await supabase
    .from("property")
    .insert({
      property_type: propertyType,
      slug,
      name: model.resort.name,
      atoll: model.resort.location,
      category: model.resort.category,
      transfer_type: model.resort.transferType,
      description: model.resort.description,
      highlights: model.resort.highlights,
      meal_plans: model.resort.mealPlans,
      seo_title: model.resort.seoTitle ?? model.resort.name,
      seo_description: model.resort.seoDescription ?? model.resort.description,
      seo_summary: model.resort.seoSummary ?? model.resort.description,
      status: "draft",
      is_featured_homepage: false,
      published_at: null,
      updated_at: now
    })
    .select("id,name")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create resort from Excel.");
  await syncRooms((data as { id: string }).id, model.rooms);
  return data as { id: string; name: string };
}

async function updatePropertyFromExcel(resortId: string, model: ExcelResortImportModel) {
  const supabase = createSupabaseAdminClient();
  const before = await fetchCurrentProperty(resortId);
  if (!before) throw new Error("Matched resort no longer exists.");
  const updatePayload = {
    name: model.resort.name,
    atoll: model.resort.location,
    category: model.resort.category,
    transfer_type: model.resort.transferType,
    description: model.resort.description,
    highlights: model.resort.highlights,
    meal_plans: model.resort.mealPlans,
    ...(model.resort.seoTitle !== undefined ? { seo_title: model.resort.seoTitle } : {}),
    ...(model.resort.seoDescription !== undefined ? { seo_description: model.resort.seoDescription } : {}),
    ...(model.resort.seoSummary !== undefined ? { seo_summary: model.resort.seoSummary } : {}),
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("property").update(updatePayload).eq("id", resortId);
  if (error) throw new Error(error.message);
  await syncRooms(resortId, model.rooms);
  return { id: before.id, name: before.name };
}

async function writeAuditLog(input: {
  action: string;
  resortId: string;
  beforeState: unknown;
  afterState: unknown;
  metadata: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("audit_logs").insert({
    action: input.action,
    entity_type: "property",
    entity_id: input.resortId,
    before_state: input.beforeState,
    after_state: input.afterState,
    metadata: input.metadata
  });
}

export async function applyExcelResortSyncPreview(stagingId: string): Promise<ServiceResult<ExcelSyncApplyResult>> {
  try {
    const staged = await loadStagingPayload(stagingId);
    const payload = staged.payload;
    if (!payload.model || !payload.match) {
      return { ok: false, error: "Only parsed Excel previews can be synchronized.", status: 400 };
    }
    if (payload.status !== "ready_to_update" && payload.status !== "ready_to_create") {
      return { ok: false, error: "Only ready Excel sync previews can be applied.", status: 400 };
    }
    if (staged.reviewStatus !== payload.status) {
      return { ok: false, error: "This Excel preview is no longer pending approval.", status: 409 };
    }

    const supabase = createSupabaseAdminClient();
    let result: { id: string; name: string };
    let beforeState: unknown = null;
    if (payload.match.status === "matched") {
      beforeState = {
        property: await fetchCurrentProperty(payload.match.resortId),
        rooms: await fetchCurrentRooms(payload.match.resortId),
        media: await fetchCurrentMedia(payload.match.resortId)
      };
      result = await updatePropertyFromExcel(payload.match.resortId, payload.model);
      await saveExcelMapping({ model: payload.model, propertyType: payload.propertyType, match: payload.match });
    } else if (payload.match.status === "new") {
      result = await createPropertyFromExcel(payload.model, payload.propertyType);
    } else {
      return { ok: false, error: "Manual review is required before this workbook can be applied.", status: 400 };
    }

    const afterState = {
      property: await fetchCurrentProperty(result.id),
      rooms: await fetchCurrentRooms(result.id),
      media: await fetchCurrentMedia(result.id)
    };
    await writeAuditLog({
      action: payload.match.status === "new" ? "excel_resort_sync_create" : "excel_resort_sync_update",
      resortId: result.id,
      beforeState,
      afterState,
      metadata: {
        sourceUrl: payload.sourceUrl,
        filename: payload.filename,
        sheets: payload.model.sourceFile.sheets,
        mediaPreserved: true,
        mode: "authoritative_excel_sync"
      }
    });

    const status: ExcelSyncStatus = payload.match.status === "new" ? "created" : "updated";
    await supabase.from("resort_staging").update({ review_status: status }).eq("id", stagingId);
    return {
      ok: true,
      data: {
        status,
        resortId: result.id,
        resortName: result.name,
        message: `${result.name} ${status === "created" ? "created" : "updated"} from Excel.`
      }
    };
  } catch (error) {
    try {
      const supabase = createSupabaseAdminClient();
      await supabase.from("resort_staging").update({ review_status: "failed" }).eq("id", stagingId);
    } catch {
      // Keep the original failure visible.
    }
    return { ok: false, error: toErrorMessage(error, "Excel sync failed.") };
  }
}

export function compactExcelPreviews(previews: ExcelResortPreview[]) {
  return previews.slice(0, MAX_LIVE_PREVIEWS);
}
