import ExcelJS from "exceljs";

import { toErrorMessage } from "@/lib/error-message";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/lib/types";
import { convertDocumentToMarkdown } from "@/lib/services/resort-ai-service";
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
  | "new_candidate"
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
  providedFields: string[];
  source: string;
};

export type ExcelResortImportModel = {
  sourceFile: {
    sourceUrl: string;
    filename: string;
    sheets: string[];
    normalizedMarkdown?: string;
    sourceType: "excel" | "google_drive";
  };
  resort: {
    name: string;
    slug: string;
    location: string;
    villaSummary: string;
    curatedMoments: string[];
    butlerService: {
      available?: boolean;
      displayName?: string;
      description?: string;
    };
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
  sections: {
    generic: ExcelSectionSummary;
    rooms: ExcelSectionSummary;
  };
  providedResortFields: string[];
  ignoredExampleRows: Array<{
    sheet: string;
    rowNumber: number;
    values: string[];
    reason: string;
  }>;
  warnings: string[];
};

export type ExcelSectionSummary = {
  actualRows: number;
  ignoredExampleRows: number;
  status: "ready" | "no_update";
};

export type ExcelResortMatch =
  | {
      status: "matched";
      resortId: string;
      resortName: string;
      confidence: "manual" | "exact";
    }
  | {
      status: "new_candidate";
      candidates: Array<{ resortId: string; resortName: string; reason: string }>;
    }
  | {
      status: "review_required";
      candidates: Array<{ resortId: string; resortName: string; reason: string }>;
    };

export type ExcelResortPreview = {
  stagingId: string;
  sourceIndex: number;
  modelIndex?: number;
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
  rootFields: Array<{ field: string; current: string; excel: string; action: "Update" | "Same" | "No update" | "Protected" | "Review" }>;
  rooms: {
    added: number;
    updated: number;
    removed: number;
    untouched: number;
    final: number;
    action: "Update" | "No update";
  };
  highlights: {
    current: number;
    excel: number;
    action: "Update" | "No update";
  };
  mealPlans: {
    current: number;
    excel: number;
    action: "Update" | "No update";
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
  newCandidates: number;
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
  modelIndex?: number;
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
  general: ["general", "generic", "overview", "resort", "property", "facts", "fact sheet"],
  rooms: ["villas", "villa details", "villa", "rooms", "room", "accommodation", "accommodations", "suites"],
  mealPlans: ["meal plans", "meal plan", "meals", "dining plans"],
  curatedMoments: ["curated moments", "signature experiences", "resort experiences"]
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
  resorts: "name",
  noofvillas: "villaSummary",
  numberofvillas: "villaSummary",
  accommodation: "villaSummary",
  transfertype: "transferType",
  transfer: "transferType",
  description: "description",
  summary: "description",
  highlights: "highlights",
  facilities: "highlights",
  amenities: "highlights",
  mealplans: "mealPlans",
  mealplan: "mealPlans",
  curatedmoments: "curatedMoments",
  signatureexperiences: "curatedMoments",
  resortexperiences: "curatedMoments",
  butlerservice: "butlerService",
  hostservice: "butlerService",
  personalhost: "butlerService",
  villahost: "butlerService",
  jadugarservice: "butlerService",
  kuwaanuservice: "butlerService",
  seotitle: "seoTitle",
  seodescription: "seoDescription",
  seosummary: "seoSummary"
};

const VIEW_LABEL_FEATURE_PREFIX = "__viewLabel:";
const MAX_LIVE_PREVIEWS = 24;
type ContentTable = "property" | "resorts";

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
    .replace(/[_-]+/g, " ")
    .replace(/\b(resort|spa|maldives|hotel|island|islands|the|website|eth|completed)\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function deriveResortNameFromFilename(filename: string) {
  const ignoredFilenameWords = new Set(["eth", "website", "completed", "complete", "template", "example", "sample"]);
  const baseName = filename
    .replace(/\.[^.]+$/u, "")
    .replace(/[()[\]]/g, " ")
    .replace(/[_-]+/g, " ");

  return baseName
    .split(/\s+/u)
    .filter((word) => word && !ignoredFilenameWords.has(word.toLowerCase()))
    .join(" ")
    .trim();
}

function villaSheetBelongsToResort(sheetName: string, resortName: string) {
  const sheetIdentity = villaSheetResortIdentity(sheetName);
  if (!sheetIdentity) return true;

  const resortIdentity = normalizeIdentity(resortName);
  return Boolean(resortIdentity) && (sheetIdentity === resortIdentity || sheetIdentity.includes(resortIdentity) || resortIdentity.includes(sheetIdentity));
}

function villaSheetResortIdentity(sheetName: string) {
  return normalizeIdentity(sheetName.replace(/\b(villa|villas|room|rooms|details|detail|type|types|accommodation|accommodations)\b/giu, ""));
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isMissingTableError(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";
  return message.includes("Could not find the table") || message.includes("schema cache") || message.includes("does not exist");
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

function splitCuratedMoments(value: string) {
  return Array.from(
    new Set(
      splitList(value)
        .map((item) => item.replace(/^[-*+]\s*/u, "").trim())
        .filter((item) => item && !classifyExampleRow([item]))
    )
  );
}

function inferResortNameFromLocation(value: string) {
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  const first = parts[0] ?? "";
  if (!first || !/(?:maldives|resort|joali|anantara|naladhu|ritz-carlton)/iu.test(first)) return null;
  return { name: first, location: parts.slice(1).join(", ") || value };
}

function normalizeButlerService(value: string) {
  const displayName = value.trim();
  if (!displayName) return {};
  const unavailable = /^(no|none|not available|n\/a)$/iu.test(displayName);
  return {
    available: !unavailable,
    displayName
  };
}

function parseMaximumOccupancy(value: string) {
  const alternatives = value
    .split(/\bor\b/iu)
    .map((alternative) => Array.from(alternative.matchAll(/\d+(?:\.\d+)?/gu)).reduce((total, match) => total + Number(match[0]), 0))
    .filter((total) => Number.isFinite(total) && total > 0);
  return alternatives.length ? Math.max(...alternatives) : parseNumber(value);
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
    sourceFile: { sourceUrl, filename, sheets, sourceType: sourceUrl.startsWith("upload:") ? "excel" : "google_drive" },
    resort: {
      name: "",
      slug: "",
      location: "",
      villaSummary: "",
      curatedMoments: [],
      butlerService: {},
      category: "",
      transferType: "",
      description: "",
      highlights: [],
      mealPlans: []
    },
    rooms: [],
    sections: {
      generic: { actualRows: 0, ignoredExampleRows: 0, status: "no_update" },
      rooms: { actualRows: 0, ignoredExampleRows: 0, status: "no_update" }
    },
    providedResortFields: [],
    ignoredExampleRows: [],
    warnings: []
  };
}

function classifyExampleRow(values: ExcelCellValue[]) {
  const text = values.map(valueToString).filter(Boolean).join(" | ");
  const markers: Array<[RegExp, string]> = [
    [/\be\s*g\s*:/iu, "Contains an example marker"],
    [/\be\.\s*g\.\s*:/iu, "Contains an example marker"],
    [/\bexample\b/iu, "Contains an example marker"],
    [/\bsample\b/iu, "Contains a sample marker"],
    [/\byes\s*\/\s*no\b/iu, "Contains a Yes/No template value"],
    [/\b(?:enter|replace|fill\s+in)\s+(?:your|the|this)\b/iu, "Contains instructional template text"]
  ];

  return markers.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

function markIgnoredExampleRow(model: ExcelResortImportModel, sheet: string, rowNumber: number, values: ExcelCellValue[], reason: string, section: "generic" | "rooms") {
  model.ignoredExampleRows.push({
    sheet,
    rowNumber,
    values: values.map(valueToString).filter(Boolean),
    reason
  });
  model.sections[section].ignoredExampleRows += 1;
}

function markProvidedField(model: ExcelResortImportModel, field: string) {
  if (!model.providedResortFields.includes(field)) model.providedResortFields.push(field);
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

type GenericResortRecord = {
  name: string;
  location: string;
  villaSummary: string;
  curatedMoments: string[];
  butlerService: ReturnType<typeof normalizeButlerService>;
  transferType: string;
  category: string;
  description: string;
  highlights: string[];
  mealPlans: string[];
};

type GenericParseResult = {
  records: GenericResortRecord[];
  ignoredExampleRows: ExcelResortImportModel["ignoredExampleRows"];
  hasResortNameColumn: boolean;
};

function emptyGenericResortRecord(): GenericResortRecord {
  return { name: "", location: "", villaSummary: "", curatedMoments: [], butlerService: {}, transferType: "", category: "", description: "", highlights: [], mealPlans: [] };
}

function extractGenericResortRecords(sheet: ParsedSheet): GenericParseResult {
  const rows = sheet.rows;
  const ignoredExampleRows: ExcelResortImportModel["ignoredExampleRows"] = [];
  const records: GenericResortRecord[] = [];
  let hasResortNameColumn = false;
  const addIgnored = (rowIndex: number, row: ExcelCellValue[], reason: string) => {
    ignoredExampleRows.push({
      sheet: sheet.name,
      rowNumber: rowIndex + 1,
      values: row.map(valueToString).filter(Boolean),
      reason
    });
  };

  const headerIndex = rows.findIndex((row) => {
    const headers = row.map((cell) => normalizeKey(valueToString(cell)));
    const matches = new Set(
      ["resorts", "resort", "locationofresort", "noofvillas", "transfer", "resortcatergory", "resortcategory", "descriptionofresort", "butlerservice", "curatedmoments", "signatureexperiences", "resortexperiences"]
        .filter((alias) => headers.some((header) => header.includes(alias)))
    );
    return matches.has("resorts") || matches.has("locationofresort") || matches.size >= 3;
  });

  if (headerIndex >= 0) {
    const headers = rows[headerIndex].map((cell) => normalizeKey(valueToString(cell)));
    const indexes = {
      name: headers.findIndex((header) => ["resorts", "resort", "resortname", "propertyname"].includes(header)),
      location: columnIndex(headers, ["locationofresort", "location", "atoll"]),
      villaSummary: columnIndex(headers, ["noofvillas", "numberofvillas", "accommodation"]),
      curatedMoments: columnIndex(headers, ["curatedmoments", "signatureexperiences", "resortexperiences"]),
      butlerService: columnIndex(headers, ["butlerservice", "hostservice", "personalhost", "villahost", "jadugarservice", "kuwaanuservice"]),
      transfer: columnIndex(headers, ["transfer"]),
      category: columnIndex(headers, ["resortcatergory", "resortcategory", "category"]),
      description: columnIndex(headers, ["descriptionofresort", "description"])
    };
    hasResortNameColumn = indexes.name >= 0;
    const hasNameColumn = indexes.name >= 0;

    for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      if (!row.some((cell) => valueToString(cell))) continue;
      const exampleReason = classifyExampleRow(row);
      if (exampleReason) {
        addIgnored(rowIndex, row, exampleReason);
        continue;
      }

      const record = emptyGenericResortRecord();
      const fields: Array<[keyof typeof indexes, "name" | "location" | "villaSummary" | "curatedMoments" | "butlerService" | "transferType" | "category" | "description"]> = [
        ["name", "name"], ["location", "location"], ["villaSummary", "villaSummary"],
        ["curatedMoments", "curatedMoments"], ["butlerService", "butlerService"],
        ["transfer", "transferType"], ["category", "category"], ["description", "description"]
      ];
      for (const [indexKey, field] of fields) {
        const value = indexes[indexKey] >= 0 ? valueToString(row[indexes[indexKey]]) : "";
        if (!value) continue;
        if (field === "name") record.name = value;
        if (field === "location") record.location = value;
        if (field === "villaSummary") record.villaSummary = value;
        if (field === "curatedMoments") record.curatedMoments = splitCuratedMoments(value);
        if (field === "butlerService") record.butlerService = normalizeButlerService(value);
        if (field === "transferType") record.transferType = value;
        if (field === "category") record.category = value;
        if (field === "description") record.description = value;
      }
      if (!record.name && indexes.name < 0) {
        const inferred = inferResortNameFromLocation(record.location);
        if (inferred) {
          record.name = inferred.name;
          record.location = inferred.location;
        }
      }
      if (hasNameColumn && !record.name) continue;
      if (!record.name && !record.location && !record.villaSummary && !record.transferType && !record.category && !record.description) continue;
      records.push(record);
    }
  } else {
    const record = emptyGenericResortRecord();
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const first = valueToString(row[0]);
      const second = valueToString(row[1]);
      if (!first || !second) continue;
      const exampleReason = classifyExampleRow(row);
      if (exampleReason) {
        addIgnored(rowIndex, row, exampleReason);
        continue;
      }
      const field = ROOT_FIELD_ALIASES[normalizeKey(first)];
      if (!field) continue;
      if (field === "highlights") record.highlights = splitList(second);
      if (field === "mealPlans") record.mealPlans = splitList(second);
      if (field === "name") record.name = second;
      if (field === "location") record.location = second;
      if (field === "villaSummary") record.villaSummary = second;
      if (field === "curatedMoments") record.curatedMoments = splitCuratedMoments(second);
      if (field === "butlerService") record.butlerService = normalizeButlerService(second);
      if (field === "transferType") record.transferType = second;
      if (field === "category") record.category = second;
      if (field === "description") record.description = second;
    }
    if (record.name || record.location || record.villaSummary || record.curatedMoments.length || Object.keys(record.butlerService).length || record.transferType || record.category || record.description || record.highlights.length || record.mealPlans.length) {
      records.push(record);
    }
  }

  return { records, ignoredExampleRows, hasResortNameColumn };
}

function applyGenericResortRecord(model: ExcelResortImportModel, record: GenericResortRecord, ignoredExampleRows: ExcelResortImportModel["ignoredExampleRows"]) {
  model.resort.name = record.name;
  model.resort.location = record.location;
  model.resort.villaSummary = record.villaSummary;
  model.resort.curatedMoments = record.curatedMoments;
  model.resort.butlerService = record.butlerService;
  model.resort.transferType = record.transferType;
  model.resort.category = record.category;
  model.resort.description = record.description;
  model.resort.highlights = record.highlights;
  model.resort.mealPlans = record.mealPlans;

  for (const field of ["name", "location", "transferType", "category", "description"] as const) {
    if (model.resort[field]) markProvidedField(model, field);
  }
  if (model.resort.highlights.length) markProvidedField(model, "highlights");
  if (model.resort.mealPlans.length) markProvidedField(model, "mealPlans");
  if (model.resort.curatedMoments.length) markProvidedField(model, "curatedMoments");
  if (Object.keys(model.resort.butlerService).length) markProvidedField(model, "butlerService");
  model.sections.generic.ignoredExampleRows = ignoredExampleRows.length;
  model.sections.generic.actualRows = record.name || record.location || record.villaSummary || record.curatedMoments.length || Object.keys(record.butlerService).length || record.transferType || record.category || record.description || record.highlights.length || record.mealPlans.length ? 1 : 0;
  model.sections.generic.status = model.sections.generic.actualRows > 0 ? "ready" : "no_update";
  model.ignoredExampleRows.push(...ignoredExampleRows);
}

function findHeaderRow(rows: ExcelCellValue[][]) {
  for (let index = 0; index < rows.length; index += 1) {
    const normalized = rows[index].map((cell) => normalizeKey(valueToString(cell)));
    if (normalized.some((cell) => ["name", "roomname", "roomtype", "roomcategory", "villatype", "villacategory", "villas", "villaname", "accommodation"].includes(cell))) {
      return index;
    }
  }
  return -1;
}

function columnIndex(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.some((alias) => header.includes(alias)));
}

function applyRoomsSheet(model: ExcelResortImportModel, sheet: ParsedSheet, multipleModels = false) {
  if (multipleModels && !villaSheetResortIdentity(sheet.name)) {
    model.warnings.push(`${sheet.name}: skipped because it does not identify which bundled resort owns these villa details.`);
    return;
  }
  if (!villaSheetBelongsToResort(sheet.name, model.resort.name)) {
    model.warnings.push(`${sheet.name}: skipped because the sheet names a different resort than ${model.resort.name}.`);
    return;
  }

  const headerIndex = findHeaderRow(sheet.rows);
  if (headerIndex < 0) {
    model.warnings.push(`${sheet.name}: could not identify a room header row.`);
    return;
  }

  const headers = sheet.rows[headerIndex].map((cell) => normalizeKey(valueToString(cell)));
  const nameIndex = columnIndex(headers, ["villaname", "roomname", "roomtype", "roomcategory", "villatype", "villacategory", "accommodation", "name", "villa", "room"]);
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
    const exampleReason = classifyExampleRow(row);
    if (exampleReason) {
      markIgnoredExampleRow(model, sheet.name, sheet.rows.indexOf(row) + 1, row, exampleReason, "rooms");
      continue;
    }
    const name = valueToString(row[nameIndex]);
    if (!name) continue;
    const description = descriptionIndex >= 0 ? valueToString(row[descriptionIndex]) : "";
    const amenities = amenitiesIndex >= 0 ? splitList(valueToString(row[amenitiesIndex])) : [];
    model.rooms.push({
      name,
      description,
      seoDescription: description,
      sizeLabel: sizeIndex >= 0 ? valueToString(row[sizeIndex]) : "",
      maxOccupancy: occupancyIndex >= 0 ? parseMaximumOccupancy(valueToString(row[occupancyIndex])) : null,
      bedType: bedIndex >= 0 ? valueToString(row[bedIndex]) : "",
      viewLabel: viewIndex >= 0 ? valueToString(row[viewIndex]) : "",
      amenities,
      providedFields: [
        ...(description ? ["description"] : []),
        ...(sizeIndex >= 0 && valueToString(row[sizeIndex]) ? ["sizeLabel"] : []),
        ...(occupancyIndex >= 0 && valueToString(row[occupancyIndex]) ? ["maxOccupancy"] : []),
        ...(bedIndex >= 0 && valueToString(row[bedIndex]) ? ["bedType"] : []),
        ...(viewIndex >= 0 && valueToString(row[viewIndex]) ? ["viewLabel"] : []),
        ...(amenities.length ? ["amenities"] : [])
      ],
      source: sheet.name
    });
    model.sections.rooms.actualRows += 1;
  }
  model.sections.rooms.status = model.sections.rooms.actualRows > 0 ? "ready" : "no_update";
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
    markProvidedField(model, field);
  }
}

function curatedSheetBelongsToResort(sheetName: string, resortName: string) {
  const sheetIdentity = normalizeIdentity(sheetName.replace(/\b(curated|moments|signature|experiences|resort)\b/giu, ""));
  if (!sheetIdentity) return true;
  const resortIdentity = normalizeIdentity(resortName);
  return Boolean(resortIdentity) && (sheetIdentity === resortIdentity || sheetIdentity.includes(resortIdentity) || resortIdentity.includes(sheetIdentity));
}

function applyCuratedMomentsSheet(model: ExcelResortImportModel, sheet: ParsedSheet, multipleModels = false) {
  if (multipleModels && !curatedSheetBelongsToResort(sheet.name, model.resort.name)) return;
  const values = sheet.rows
    .flatMap((row) => row.map(valueToString))
    .flatMap(splitCuratedMoments)
    .filter((value) => !/^(?:curated moments|signature experiences|resort experiences|highlights)$/iu.test(value));
  if (!values.length) return;
  model.resort.curatedMoments = Array.from(new Set([...model.resort.curatedMoments, ...values]));
  markProvidedField(model, "curatedMoments");
}

export async function parseExcelResortWorkbook(input: {
  sourceUrl: string;
  filename: string;
  bytes: Uint8Array;
  normalizedMarkdown?: string;
}): Promise<ExcelResortImportModel[]> {
  const sheets = await workbookToSheets(input.bytes);
  const genericResults = sheets
    .filter((sheet) => !sheetMatches(sheet.name, SHEET_ALIASES.rooms) && !sheetMatches(sheet.name, SHEET_ALIASES.curatedMoments) && sheetMatches(sheet.name, SHEET_ALIASES.general))
    .map(extractGenericResortRecords);
  const genericRecords = genericResults.flatMap((result) => result.records);
  const ignoredExampleRows = genericResults.flatMap((result) => result.ignoredExampleRows);
  const hasResortNameColumn = genericResults.some((result) => result.hasResortNameColumn);
  const records = genericRecords.length ? genericRecords : [emptyGenericResortRecord()];
  const models = records.map((record) => {
    const model = createEmptyModel(input.sourceUrl, input.filename, sheets.map((sheet) => sheet.name));
    model.sourceFile.normalizedMarkdown = input.normalizedMarkdown;
    applyGenericResortRecord(model, record, ignoredExampleRows);
    return model;
  });

  for (const model of models) {
    if (!model.resort.name) {
      if (hasResortNameColumn) {
        model.warnings.push("A Resorts column was found, but no actual resort row could be identified. Filename fallback is disabled for bundled workbooks.");
      } else {
        model.resort.name = deriveResortNameFromFilename(input.filename);
        model.warnings.push("General sheet did not contain a resort name; a cleaned filename was used for matching and new-resort preview only.");
      }
    }
    for (const sheet of sheets) {
      if (sheetMatches(sheet.name, SHEET_ALIASES.rooms)) applyRoomsSheet(model, sheet, models.length > 1);
    }

    for (const sheet of sheets) {
      if (sheetMatches(sheet.name, SHEET_ALIASES.curatedMoments)) applyCuratedMomentsSheet(model, sheet, models.length > 1);
    }

    for (const sheet of sheets) {
      if (sheetMatches(sheet.name, SHEET_ALIASES.mealPlans)) applyListSheet(model, sheet, "mealPlans");
    }

    for (const sheet of sheets) {
      if (!sheet.rows.length || sheetMatches(sheet.name, SHEET_ALIASES.rooms) || sheetMatches(sheet.name, SHEET_ALIASES.general) || sheetMatches(sheet.name, SHEET_ALIASES.mealPlans) || sheetMatches(sheet.name, SHEET_ALIASES.curatedMoments)) continue;
      model.warnings.push(`${sheet.name}: sheet was retained as source metadata but is not mapped to the current schema yet.`);
    }

    model.resort.slug = slugify(model.resort.slug || model.resort.name);
  }

  return models;
}

function identitySimilarity(left: string, right: string) {
  const leftTokens = new Set(left.match(/[a-z0-9]{3,}/g) ?? []);
  const rightTokens = new Set(right.match(/[a-z0-9]{3,}/g) ?? []);
  if (!leftTokens.size || !rightTokens.size) return 0;
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function matchResort(model: ExcelResortImportModel, existing: ResortRecord[], manualResortId?: string, savedResortId?: string): ExcelResortMatch {
  if (savedResortId) {
    const saved = existing.find((resort) => resort.id === savedResortId);
    if (saved) {
      return { status: "matched", resortId: saved.id, resortName: saved.name, confidence: "exact" };
    }
  }
  if (manualResortId) {
    const manual = existing.find((resort) => resort.id === manualResortId);
    if (manual) {
      return { status: "matched", resortId: manual.id, resortName: manual.name, confidence: "manual" };
    }
  }

  const slug = slugify(model.resort.slug || model.resort.name);
  const normalizedName = model.providedResortFields.includes("name") ? normalizeIdentity(model.resort.name) : "";
  const filenameName = normalizedName ? "" : normalizeIdentity(model.sourceFile.filename.replace(/\.[^.]+$/u, ""));
  const exactMatches = existing.filter(
    (resort) =>
      slugify(resort.slug || resort.name) === slug ||
      (normalizedName.length >= 5 && normalizeIdentity(resort.name) === normalizedName) ||
      (filenameName.length >= 5 && (
        normalizeIdentity(resort.name) === filenameName ||
        normalizeIdentity(resort.name).includes(filenameName) ||
        filenameName.includes(normalizeIdentity(resort.name))
      ))
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

  const candidates = existing
    .map((resort) => ({
      resort,
      score: Math.max(
        identitySimilarity(normalizedName, normalizeIdentity(resort.name)),
        identitySimilarity(normalizeIdentity(model.resort.location), normalizeIdentity(resort.location))
      )
    }))
    .filter((candidate) => candidate.score >= 0.25)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map(({ resort, score }) => ({
      resortId: resort.id,
      resortName: resort.name,
      reason: `Similarity suggestion (${Math.round(score * 100)}%)`
    }));

  return { status: "new_candidate", candidates };
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
      rootFields.push({ field, current, excel, action: "Update" });
    }
  };

  if (resort) {
    if (model.providedResortFields.includes("name")) compare("Name", resort.name, model.resort.name);
    if (model.providedResortFields.includes("location")) compare("Location", resort.location, model.resort.location);
    if (model.providedResortFields.includes("villaSummary")) compare("Accommodation summary", resort.accommodationSummary, model.resort.villaSummary);
    if (model.providedResortFields.includes("category")) compare("Category", resort.category, model.resort.category);
    if (model.providedResortFields.includes("transferType")) compare("Transfer", resort.transferType, model.resort.transferType);
    if (model.providedResortFields.includes("description")) compare("Description", resort.description, model.resort.description);
    if (model.providedResortFields.includes("curatedMoments")) compare("Curated Moments", resort.curatedMoments.join("\n"), model.resort.curatedMoments.join("\n"));
    if (model.providedResortFields.includes("butlerService")) compare("Butler / Host Service", resort.butlerService.displayName ?? "", model.resort.butlerService.displayName ?? "");
    if (model.providedResortFields.includes("seoTitle") && model.resort.seoTitle !== undefined) compare("SEO title", resort.seoTitle, model.resort.seoTitle);
    if (model.providedResortFields.includes("seoDescription") && model.resort.seoDescription !== undefined) compare("SEO description", resort.seoDescription, model.resort.seoDescription);
    if (model.providedResortFields.includes("seoSummary") && model.resort.seoSummary !== undefined) compare("SEO summary", resort.seoSummary, model.resort.seoSummary);
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
      removed: 0,
      untouched: model.sections.rooms.actualRows > 0 ? [...existingRoomNames].filter((name) => !excelRoomNames.has(name)).length : existingRoomNames.size,
      final: model.rooms.length,
      action: model.sections.rooms.actualRows > 0 ? "Update" : "No update"
    },
    highlights: {
      current: resort?.highlights.length ?? 0,
      excel: model.resort.highlights.length,
      action: model.providedResortFields.includes("highlights") ? "Update" : "No update"
    },
    mealPlans: {
      current: resort?.mealPlans.length ?? 0,
      excel: model.resort.mealPlans.length,
      action: model.providedResortFields.includes("mealPlans") ? "Update" : "No update"
    }
  };
}

async function resolveGoogleDriveExcelSources(url: string) {
  const parsed = new URL(url);
  const folderMatch = parsed.pathname.match(/\/drive\/folders\/([^/?]+)/);
  if (!folderMatch?.[1]) return [normalizeGoogleDriveExcelUrl(url)];

  const html = (await fetch(url, { cache: "no-store" }).then((response) => response.text()))
    .replaceAll("\\/", "/")
    .replaceAll("\\u003d", "=")
    .replaceAll("\\u0026", "&");
  const matches = Array.from(
    new Set(
      [
        ...Array.from(html.matchAll(/https:\/\/drive\.google\.com\/file\/d\/[^"'&<\s]+/g)).map((match) => match[0]),
        ...Array.from(html.matchAll(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[^"'&<\s]+/g)).map((match) => match[0]),
        ...Array.from(html.matchAll(/https?:\/\/(?:drive\.google\.com|drive\.usercontent\.google\.com)\/[^"'<>\s]+[?&](?:export=download&)?id=[A-Za-z0-9_-]{10,}[^"'<>\s]*/gi)).map((match) => match[0]),
        ...Array.from(html.matchAll(/https?:\/\/[^"'<> \t\r\n]+\.xlsx(?:\?[^"'<> \t\r\n]*)?/gi)).map((match) => match[0])
      ]
        .map((item) => {
          try {
            return normalizeGoogleDriveExcelUrl(item.replace(/&amp;/g, "&"));
          } catch {
            return "";
          }
        })
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
    if (!isGoogleDriveId(fileMatch[1])) throw new Error("Google Drive file URL does not contain a valid file id.");
    const normalized = new URL("https://drive.google.com/uc");
    normalized.searchParams.set("export", "download");
    normalized.searchParams.set("id", fileMatch[1]);
    return normalized.toString();
  }

  const sheetMatch = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (sheetMatch?.[1]) {
    if (!isGoogleDriveId(sheetMatch[1])) throw new Error("Google Sheets URL does not contain a valid spreadsheet id.");
    const normalized = new URL(`https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export`);
    normalized.searchParams.set("format", "xlsx");
    return normalized.toString();
  }

  const queryId = parsed.searchParams.get("id");
  if (queryId && (parsed.hostname === "drive.google.com" || parsed.hostname === "drive.usercontent.google.com")) {
    if (!isGoogleDriveId(queryId)) throw new Error("Google Drive download URL does not contain a valid file id.");
    const normalized = new URL("https://drive.google.com/uc");
    normalized.searchParams.set("export", "download");
    normalized.searchParams.set("id", queryId);
    return normalized.toString();
  }

  return url;
}

function isGoogleDriveId(value: string) {
  try {
    return /^[A-Za-z0-9_-]{10,}$/u.test(decodeURIComponent(value));
  } catch {
    return false;
  }
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
  const disposition = response.headers.get("content-disposition");
  return {
    sourceUrl,
    filename: filenameFromContentDisposition(disposition) ?? guessExcelFilename(response.url || sourceUrl, index),
    bytes
  };
}

function filenameFromContentDisposition(value: string | null) {
  if (!value) return null;
  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = value.match(/filename\s*=\s*"?([^";]+)"?/i)?.[1];
  const candidate = encoded ?? plain;
  if (!candidate) return null;
  try {
    const decoded = decodeURIComponent(candidate).trim();
    const safe = decoded.replace(/[\\/:*?"<>|]+/g, "-");
    return safe || null;
  } catch {
    return candidate.trim() || null;
  }
}

async function createBatchRecord(sourceUrl: string, propertyType: PropertyType, sourceType = "google_drive_excel") {
  const supabase = createSupabaseAdminClient();
  const stamp = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("import_batches")
    .insert({
      batch_name: `Excel resort sync ${stamp}`,
      source_type: `${sourceType}:${propertyType}`,
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
  if (error && !isMissingTableError(error)) throw new Error(error.message);
}

async function findSavedExcelMapping(model: ExcelResortImportModel, propertyType: PropertyType) {
  const sourceIdentifier = model.resort.slug || normalizeIdentity(model.resort.name);
  if (!sourceIdentifier) return undefined;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("excel_resort_sync_mappings")
    .select("resort_id")
    .eq("source_identifier", sourceIdentifier)
    .eq("property_type", propertyType)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return undefined;
    throw new Error(error.message);
  }
  return typeof (data as { resort_id?: unknown } | null)?.resort_id === "string"
    ? (data as { resort_id: string }).resort_id
    : undefined;
}

async function resolveContentTable(): Promise<ContentTable> {
  const supabase = createSupabaseAdminClient();
  for (const tableName of ["property", "resorts"] as const) {
    const { error } = await supabase.from(tableName).select("id").limit(1);
    if (!error) return tableName;
    if (!isMissingTableError(error)) throw new Error(error.message);
  }
  throw new Error("Neither public.property nor public.resorts is available in the database schema.");
}

function payloadToPreview(stagingId: string, payload: StagingPayload): ExcelResortPreview {
  return {
    stagingId,
    sourceIndex: payload.sourceIndex,
    modelIndex: payload.modelIndex,
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
  modelIndex?: number;
  propertyType?: PropertyType;
  manualMatchResortId?: string;
  sourceBytes?: Uint8Array;
  sourceFilename?: string;
}): Promise<ServiceResult<ExcelSyncDelta>> {
  try {
    const propertyType = normalizePropertyType(input.propertyType);
    const existingResorts = await listAdminResorts(propertyType);
    const downloaded = input.sourceBytes
      ? {
          sourceUrl: input.sourceUrl,
          filename: input.sourceFilename ?? guessExcelFilename(input.sourceUrl, input.sourceIndex),
          bytes: input.sourceBytes
        }
      : await downloadExcelSource(input.sourceUrl, input.sourceIndex);
    // Normalize the bytes already downloaded by the Drive/upload path. This keeps
    // preview parsing deterministic and avoids a second, potentially restricted URL fetch.
    const normalized = await convertDocumentToMarkdown({
      ...downloaded,
      sourceUrl: `upload:${downloaded.filename}`
    });
    const models = await parseExcelResortWorkbook({ ...downloaded, normalizedMarkdown: normalized.markdown });
    const selectedModels = input.modelIndex === undefined
      ? models.map((model, modelIndex) => ({ model, modelIndex }))
      : models[input.modelIndex]
        ? [{ model: models[input.modelIndex], modelIndex: input.modelIndex }]
        : [];
    if (!selectedModels.length) throw new Error("The selected resort section was not found in this workbook.");

    const previews: ExcelResortPreview[] = [];
    let readyToUpdate = 0;
    let readyToCreate = 0;
    let needsReview = 0;
    let newCandidates = 0;
    let parseErrors = 0;
    for (const { model, modelIndex } of selectedModels) {
      const validation = validateExcelModel(model);
      const savedMapping = await findSavedExcelMapping(model, propertyType);
      const match = matchResort(model, existingResorts, input.manualMatchResortId, savedMapping);
      const existing = match.status === "matched" ? existingResorts.find((resort) => resort.id === match.resortId) : undefined;
      const diff = buildDiff(model, existing);
      const status: ExcelSyncStatus =
        validation.errors.length > 0
          ? "parse_error"
          : validation.hasAmbiguousRooms || match.status === "review_required"
            ? "needs_review"
            : match.status === "matched"
              ? "ready_to_update"
              : "new_candidate";
      const action = status === "parse_error" ? "error" : status === "needs_review" || status === "new_candidate" ? "review" : "update";
      const payload: StagingPayload = {
        kind: "excel_resort_sync_preview",
        version: 1,
        propertyType,
        sourceIndex: input.sourceIndex,
        modelIndex,
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
      previews.push(payloadToPreview(stagingId, payload));
      if (status === "ready_to_update") readyToUpdate += 1;
      if (status === "needs_review") needsReview += 1;
      if (status === "new_candidate") newCandidates += 1;
      if (status === "parse_error") parseErrors += 1;
    }

    return {
      ok: true,
      data: {
        processedSources: 1,
        readyToUpdate,
        readyToCreate,
        newCandidates,
        needsReview,
        parseErrors,
        noSourceWorkbook: 0,
        previews
      }
    };
  } catch (error) {
    const propertyType = normalizePropertyType(input.propertyType);
    const payload: StagingPayload = {
      kind: "excel_resort_sync_preview",
      version: 1,
      propertyType,
      sourceIndex: input.sourceIndex,
      modelIndex: input.modelIndex,
      sourceUrl: input.sourceUrl,
      filename: input.sourceFilename ?? guessExcelFilename(input.sourceUrl, input.sourceIndex),
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
        newCandidates: 0,
        needsReview: 0,
        parseErrors: 1,
        noSourceWorkbook: 0,
        previews: [payloadToPreview(stagingId, payload)]
      }
    };
  }
}

export async function processUploadedExcelResortSource(input: {
  filename: string;
  bytes: Uint8Array;
  propertyType?: PropertyType;
  manualMatchResortId?: string;
  modelIndex?: number;
}): Promise<ServiceResult<ExcelSyncDelta & { batchId: string }>> {
  try {
    const propertyType = normalizePropertyType(input.propertyType);
    const batchId = await createBatchRecord(`upload:${input.filename}`, propertyType, "excel_upload");
    const result = await processExcelResortSyncSource({
      batchId,
      sourceUrl: `upload:${input.filename}`,
      sourceIndex: 0,
      sourceFilename: input.filename,
      sourceBytes: input.bytes,
      propertyType,
      manualMatchResortId: input.manualMatchResortId,
      modelIndex: input.modelIndex
    });

    if (!result.ok) return result;
    return { ok: true, data: { ...result.data, batchId } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, "Uploaded Excel workbook could not be staged.") };
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
  const tableName = await resolveContentTable();
  const { data, error } = await supabase.from(tableName).select("*").eq("id", resortId).maybeSingle();
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
  if (!rooms.length) return;

  const supabase = createSupabaseAdminClient();
  const currentRooms = await fetchCurrentRooms(resortId);
  const currentByName = new Map(currentRooms.map((room) => [normalizeIdentity(room.name), room]));

  for (let index = 0; index < rooms.length; index += 1) {
    const room = rooms[index];
    const matched = currentByName.get(normalizeIdentity(room.name));
    const payload = {
      resort_id: resortId,
      name: room.name.trim(),
      ...(room.providedFields.includes("description") ? { short_description: room.description.trim() || null, seo_summary: room.seoDescription.trim() || room.description.trim() || null } : {}),
      ...(room.providedFields.includes("sizeLabel") ? { size_label: room.sizeLabel.trim() || null } : {}),
      ...(room.providedFields.includes("maxOccupancy") ? { max_occupancy: room.maxOccupancy } : {}),
      ...(room.providedFields.includes("bedType") ? { bed_type: room.bedType.trim() || null } : {}),
      ...(room.providedFields.includes("amenities") || room.providedFields.includes("viewLabel") ? { features: roomFeatures(room) } : {}),
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

}

async function createPropertyFromExcel(model: ExcelResortImportModel, propertyType: PropertyType) {
  const supabase = createSupabaseAdminClient();
  const tableName = await resolveContentTable();
  const existing = await listAdminResorts(propertyType);
  const now = new Date().toISOString();
  const slug = uniqueSlug(model.resort.slug || model.resort.name, existing);
  const basePayload = {
    slug,
    name: model.resort.name,
    atoll: model.resort.location,
    category: model.resort.category,
    transfer_type: model.resort.transferType,
    description: model.resort.description,
    accommodation_summary: model.resort.villaSummary || null,
    highlights: model.resort.highlights,
    meal_plans: model.resort.mealPlans,
    curated_moments: model.resort.curatedMoments,
    butler_service: model.resort.butlerService,
    seo_title: model.resort.seoTitle ?? model.resort.name,
    seo_description: model.resort.seoDescription ?? model.resort.description,
    seo_summary: model.resort.seoSummary ?? model.resort.description,
    status: "draft",
    published_at: null,
    updated_at: now
  };
  const { data, error } = await supabase
    .from(tableName)
    .insert(tableName === "property" ? { ...basePayload, property_type: propertyType, is_featured_homepage: false } : basePayload)
    .select("id,name")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create resort from Excel.");
  await syncRooms((data as { id: string }).id, model.rooms);
  return data as { id: string; name: string };
}

async function updatePropertyFromExcel(resortId: string, model: ExcelResortImportModel) {
  const supabase = createSupabaseAdminClient();
  const tableName = await resolveContentTable();
  const before = await fetchCurrentProperty(resortId);
  if (!before) throw new Error("Matched resort no longer exists.");
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (model.providedResortFields.includes("name")) updatePayload.name = model.resort.name;
  if (model.providedResortFields.includes("location")) updatePayload.atoll = model.resort.location;
  if (model.providedResortFields.includes("villaSummary")) updatePayload.accommodation_summary = model.resort.villaSummary;
  if (model.providedResortFields.includes("transferType")) updatePayload.transfer_type = model.resort.transferType;
  if (model.providedResortFields.includes("category")) updatePayload.category = model.resort.category;
  if (model.providedResortFields.includes("description")) updatePayload.description = model.resort.description;
  if (model.providedResortFields.includes("highlights")) updatePayload.highlights = model.resort.highlights;
  if (model.providedResortFields.includes("mealPlans")) updatePayload.meal_plans = model.resort.mealPlans;
  if (model.providedResortFields.includes("curatedMoments")) updatePayload.curated_moments = model.resort.curatedMoments;
  if (model.providedResortFields.includes("butlerService")) updatePayload.butler_service = model.resort.butlerService;
  if (model.providedResortFields.includes("seoTitle") && model.resort.seoTitle !== undefined) updatePayload.seo_title = model.resort.seoTitle;
  if (model.providedResortFields.includes("seoDescription") && model.resort.seoDescription !== undefined) updatePayload.seo_description = model.resort.seoDescription;
  if (model.providedResortFields.includes("seoSummary") && model.resort.seoSummary !== undefined) updatePayload.seo_summary = model.resort.seoSummary;
  const { error } = await supabase.from(tableName).update(updatePayload).eq("id", resortId);
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

export async function applyExcelResortSyncPreview(stagingId: string, decision: "update" | "create_draft" = "update"): Promise<ServiceResult<ExcelSyncApplyResult>> {
  try {
    const staged = await loadStagingPayload(stagingId);
    const payload = staged.payload;
    if (!payload.model || !payload.match) {
      return { ok: false, error: "Only parsed Excel previews can be synchronized.", status: 400 };
    }
    if (payload.status !== "ready_to_update" && !(payload.status === "new_candidate" && decision === "create_draft")) {
      return { ok: false, error: "Review this resort candidate and choose an explicit action before applying it.", status: 400 };
    }
    if (staged.reviewStatus !== payload.status) {
      return { ok: false, error: "This Excel preview is no longer pending approval.", status: 409 };
    }

    const supabase = createSupabaseAdminClient();
    let effectiveMatch = payload.match;
    if (payload.match.status === "new_candidate") {
      const latestResorts = await listAdminResorts(payload.propertyType);
      effectiveMatch = matchResort(payload.model, latestResorts);
      if (effectiveMatch.status === "review_required") {
        return { ok: false, error: "A possible existing resort match was found after preview. Review the workbook again before applying it.", status: 409 };
      }
    }

    let result: { id: string; name: string };
    let beforeState: unknown = null;
    if (effectiveMatch.status === "matched") {
      beforeState = {
        property: await fetchCurrentProperty(effectiveMatch.resortId),
        rooms: await fetchCurrentRooms(effectiveMatch.resortId),
        media: await fetchCurrentMedia(effectiveMatch.resortId)
      };
      result = await updatePropertyFromExcel(effectiveMatch.resortId, payload.model);
      await saveExcelMapping({ model: payload.model, propertyType: payload.propertyType, match: effectiveMatch });
    } else if (effectiveMatch.status === "new_candidate" && decision === "create_draft") {
      result = await createPropertyFromExcel(payload.model, payload.propertyType);
    } else {
      return { ok: false, error: "Manual review is required before this workbook can be applied.", status: 400 };
    }

    const afterState = {
      property: await fetchCurrentProperty(result.id),
      rooms: await fetchCurrentRooms(result.id),
      media: await fetchCurrentMedia(result.id)
    };
    try {
      await writeAuditLog({
        action: effectiveMatch.status === "new_candidate" ? "excel_resort_sync_create" : "excel_resort_sync_update",
        resortId: result.id,
        beforeState,
        afterState,
        metadata: {
          sourceUrl: payload.sourceUrl,
          filename: payload.filename,
          sourceType: payload.model.sourceFile.sourceType,
          sheets: payload.model.sourceFile.sheets,
          normalizedMarkdown: payload.model.sourceFile.normalizedMarkdown,
          mediaPreserved: true,
          mode: "document_resort_import"
        }
      });
    } catch (auditError) {
      console.error("Excel resort update completed but audit logging failed", auditError);
    }

    const status: ExcelSyncStatus = effectiveMatch.status === "new_candidate" ? "created" : "updated";
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
