import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

import { normalizeGoogleMapsEmbedUrl, parseOptionalCoordinates } from "@/lib/resort-map";

export type ResortMapRecord = {
  id: string;
  name: string;
  slug: string;
  map_embed_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type ResortMapPreviewRow = {
  index: number;
  slug: string;
  resortId: string;
  resortName: string;
  mapEmbedUrl: string;
  latitude: number | null;
  longitude: number | null;
  current: string;
  status: "ready" | "unchanged" | "invalid" | "unmatched" | "duplicate";
  detail: string;
};

type CsvRecord = Record<"slug" | "map_embed_url" | "latitude" | "longitude", string>;
const COLUMNS = ["slug", "map_embed_url", "latitude", "longitude"] as const;

export function createResortMapTemplate(resorts: ResortMapRecord[]) {
  return stringify(resorts.map((resort) => ({
    slug: resort.slug,
    map_embed_url: resort.map_embed_url ?? "",
    latitude: resort.latitude ?? "",
    longitude: resort.longitude ?? ""
  })), { header: true, columns: [...COLUMNS], bom: true, escape_formulas: true });
}

export function previewResortMapCsv(text: string, resorts: ResortMapRecord[]): ResortMapPreviewRow[] {
  const records = parse(text, {
    bom: true,
    trim: true,
    skip_empty_lines: true,
    max_record_size: 12000,
    columns: (headers: string[]) => {
      const normalized = headers.map((header) => header.trim().toLowerCase());
      if (normalized.length !== COLUMNS.length || COLUMNS.some((column) => !normalized.includes(column))) {
        throw new Error(`CSV columns must be: ${COLUMNS.join(", ")}.`);
      }
      return normalized;
    }
  }) as CsvRecord[];

  if (records.length > 250) throw new Error("Import up to 250 property rows in one CSV.");

  const activeRecords = records.map((record, index) => ({ record, index: index + 1 }))
    .filter(({ record }) => record.map_embed_url || record.latitude || record.longitude);
  const counts = new Map<string, number>();
  for (const { record } of activeRecords) {
    const slug = record.slug.toLowerCase();
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  const bySlug = new Map(resorts.map((resort) => [resort.slug.toLowerCase(), resort]));

  return activeRecords.map(({ record, index }) => {
    const slug = record.slug.trim().toLowerCase();
    const resort = bySlug.get(slug);
    const current = resort?.map_embed_url ? "Google map" : resort?.latitude !== null && resort?.latitude !== undefined ? `${resort.latitude}, ${resort.longitude}` : "Not set";
    const row: ResortMapPreviewRow = {
      index,
      slug,
      resortId: resort?.id ?? "",
      resortName: resort?.name ?? "",
      mapEmbedUrl: "",
      latitude: null,
      longitude: null,
      current,
      status: "invalid",
      detail: ""
    };

    if (!slug) {
      row.detail = "Property slug is required.";
    } else if ((counts.get(slug) ?? 0) > 1) {
      row.status = "duplicate";
      row.detail = "This property slug appears more than once in the CSV.";
    } else if (!resort) {
      row.status = "unmatched";
      row.detail = "No matching property has this exact slug on the test site.";
    } else {
      try {
        if (record.map_embed_url && (record.latitude || record.longitude)) {
          throw new Error("Use a Google Maps embed link or coordinates, not both.");
        }
        row.mapEmbedUrl = normalizeGoogleMapsEmbedUrl(record.map_embed_url);
        if (!row.mapEmbedUrl) {
          const coordinates = parseOptionalCoordinates(record.latitude, record.longitude);
          row.latitude = coordinates.latitude;
          row.longitude = coordinates.longitude;
        }
        const unchanged = row.mapEmbedUrl === (resort.map_embed_url ?? "") &&
          row.latitude === resort.latitude && row.longitude === resort.longitude;
        row.status = unchanged ? "unchanged" : "ready";
        row.detail = unchanged ? "Already matches the saved location." : "Ready to update.";
      } catch (error) {
        row.detail = error instanceof Error ? error.message : "Invalid map location.";
      }
    }
    return row;
  });
}
