import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminJson } from "@/lib/auth/require-admin";
import { createResortMapTemplate, previewResortMapCsv, type ResortMapRecord } from "@/lib/resort-map-csv";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

async function listProperties(propertyType: "resort" | "hotels"): Promise<ResortMapRecord[]> {
  const supabase = createSupabaseAdminClient();
  const resorts: ResortMapRecord[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("property")
      .select("id,name,slug,map_embed_url,latitude,longitude")
      .eq("property_type", propertyType)
      .order("slug")
      .range(from, from + 999);
    if (error) throw error;
    resorts.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return resorts;
}

function mapPropertyType(value: unknown): "resort" | "hotels" {
  if (value === "resort" || value === "hotels") return value;
  throw new Error("Map import is available for resorts and hotels only.");
}

export async function GET(request: Request) {
  const auth = await requireAdminJson(["super_admin", "admin", "content_manager"]);
  if (!auth.ok) return auth.response;

  try {
    const propertyType = mapPropertyType(new URL(request.url).searchParams.get("propertyType") ?? "resort");
    const csv = createResortMapTemplate(await listProperties(propertyType));
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${propertyType === "resort" ? "resort" : "hotel"}-map-locations.csv"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not create template." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminJson(["super_admin", "admin", "content_manager"]);
  if (!auth.ok) return auth.response;

  try {
    const form = await request.formData();
    const propertyType = mapPropertyType(form.get("propertyType") ?? "resort");
    const file = form.get("file");
    const mode = form.get("mode");
    if (!(file instanceof File) || !/\.csv$/i.test(file.name) || file.size === 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Choose a non-empty CSV file up to 5 MB." }, { status: 400 });
    }
    if (mode !== "preview" && mode !== "apply") {
      return NextResponse.json({ ok: false, error: "Invalid import action." }, { status: 400 });
    }

    const rows = previewResortMapCsv(await file.text(), await listProperties(propertyType));
    if (mode === "preview") {
      return NextResponse.json({ ok: true, rows, ignoredBlankRows: "Rows without a map link or coordinates are skipped." });
    }

    const rawSelected = form.get("selected");
    const selected = typeof rawSelected === "string" ? JSON.parse(rawSelected) : null;
    if (!Array.isArray(selected) || !selected.length || selected.length > 250 ||
        selected.some((index) => !Number.isInteger(index) || index < 1) || new Set(selected).size !== selected.length) {
      return NextResponse.json({ ok: false, error: "Select valid CSV rows to apply." }, { status: 400 });
    }
    const byIndex = new Map(rows.map((row) => [row.index, row]));
    const accepted = selected.map((index: number) => byIndex.get(index));
    if (accepted.some((row) => !row || row.status !== "ready")) {
      return NextResponse.json({ ok: false, error: "One or more selected rows are no longer ready. Preview the CSV again." }, { status: 409 });
    }

    const supabase = createSupabaseAdminClient();
    const results: Array<{ index: number; status: "updated" | "failed"; detail: string }> = [];
    for (const row of accepted) {
      if (!row) continue;
      const { data, error } = await supabase.from("property")
        .update({
          map_embed_url: row.mapEmbedUrl || null,
          latitude: row.latitude,
          longitude: row.longitude
        })
        .eq("id", row.resortId)
        .eq("property_type", propertyType)
        .select("id")
        .maybeSingle();
      if (error || !data) {
        results.push({ index: row.index, status: "failed", detail: error?.message ?? "Property no longer exists." });
      } else {
        const basePath = propertyType === "resort" ? "resorts" : "hotels";
        revalidatePath(`/${basePath}/${row.slug}`);
        revalidatePath(`/admin/${basePath}/${row.resortId}/edit`);
        results.push({ index: row.index, status: "updated", detail: "Map location updated." });
      }
    }
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Resort map CSV import failed." }, { status: 400 });
  }
}
