import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminJson } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { brochureFolderName, brochureStoragePrefix } from "@/lib/brochure-import";
import type { PropertyType } from "@/lib/services/resort-service";

export const runtime = "nodejs";

const BROCHURE_BUCKET = "resort-brochures";

type ResortOption = { id: string; name: string; slug: string; brochure_path: string | null };

async function listProperties(propertyType: PropertyType) {
  const supabase = createSupabaseAdminClient();
  const resorts: ResortOption[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("property")
      .select("id,name,slug,brochure_path")
      .eq("property_type", propertyType)
      .order("name")
      .range(from, from + 999);
    if (error) throw error;
    resorts.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return resorts;
}

export async function POST(request: Request) {
  const auth = await requireAdminJson(["super_admin", "admin", "content_manager"]);
  if (!auth.ok) return auth.response;

  try {
    const input = await request.json();
    const mode = String(input?.mode ?? "");
    const propertyType = input?.propertyType ?? "resort";
    if (propertyType !== "resort" && propertyType !== "hotels" && propertyType !== "liveaboards") {
      return NextResponse.json({ ok: false, error: "Invalid property type." }, { status: 400 });
    }
    const folderType = propertyType === "resort" ? "resorts" : propertyType;
    const singular = propertyType === "resort" ? "resort" : propertyType === "hotels" ? "hotel" : "liveaboard";
    const supabase = createSupabaseAdminClient();

    if (mode === "preview") {
      const files = Array.isArray(input.files) ? input.files : [];
      if (files.length > 1000) {
        return NextResponse.json({ ok: false, error: "Import up to 1,000 PDFs at a time." }, { status: 400 });
      }
      const resorts = await listProperties(propertyType);
      const rows = files.map((file: { relativePath?: string; size?: number }) => {
        const relativePath = String(file.relativePath ?? "");
        const folder = brochureFolderName(relativePath);
        const name = relativePath.split(/[\\/]/).at(-1) ?? "";
        const validPdf = /\.pdf$/i.test(name) && Number(file.size) > 0;
        const matches = resorts.filter((resort) => resort.name.trim().toLocaleLowerCase() === folder.trim().toLocaleLowerCase());
        return {
          relativePath,
          folder,
          name,
          size: Number(file.size),
          resortId: validPdf && matches.length === 1 ? matches[0].id : "",
          status: !folder ? `Expected Parent Folder / ${singular} Name / file.pdf.`
            : !validPdf ? "Only non-empty PDF files are accepted."
            : matches.length === 1 ? `Exact ${singular} folder match` : matches.length > 1 ? `Multiple ${propertyType} share this name. Review required.` : `No exact ${singular} match. Review required.`
        };
      });
      const counts = new Map<string, number>();
      rows.forEach((row: { folder: string }) => counts.set(row.folder.toLocaleLowerCase(), (counts.get(row.folder.toLocaleLowerCase()) ?? 0) + 1));
      return NextResponse.json({ ok: true, data: {
        resorts: resorts.map(({ id, name, brochure_path }) => ({ id, name, hasBrochure: Boolean(brochure_path) })),
        rows: rows.map((row: typeof rows[number]) => ({ ...row, duplicate: (counts.get(row.folder.toLocaleLowerCase()) ?? 0) > 1 }))
      } });
    }

    const resortId = String(input?.resortId ?? "");
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(resortId)) {
      return NextResponse.json({ ok: false, error: "Select a valid resort." }, { status: 400 });
    }
    const { data: resort, error: resortError } = await supabase.from("property")
      .select("id,name,slug,brochure_path")
      .eq("id", resortId).eq("property_type", propertyType).maybeSingle();
    if (resortError) throw resortError;
    if (!resort) return NextResponse.json({ ok: false, error: `${singular} not found.` }, { status: 404 });

    if (mode === "sign") {
      const filename = String(input?.filename ?? "");
      const size = Number(input?.size);
      if (!/\.pdf$/i.test(filename) || !Number.isFinite(size) || size <= 0) {
        return NextResponse.json({ ok: false, error: "Choose a non-empty PDF." }, { status: 400 });
      }
      const path = `${brochureStoragePrefix(propertyType, resortId)}${Date.now()}-${crypto.randomUUID()}.pdf`;
      const signed = await supabase.storage.from(BROCHURE_BUCKET).createSignedUploadUrl(path);
      if (signed.error || !signed.data) throw signed.error ?? new Error("Could not prepare PDF upload.");
      return NextResponse.json({ ok: true, data: { bucket: BROCHURE_BUCKET, path, token: signed.data.token } });
    }

    if (mode === "attach" || mode === "discard") {
      const path = String(input?.path ?? "");
      const prefix = brochureStoragePrefix(propertyType, resortId);
      const basename = path.slice(prefix.length);
      if (!path.startsWith(prefix) || !/^[0-9]+-[0-9a-f-]+\.pdf$/i.test(basename)) {
        return NextResponse.json({ ok: false, error: "Invalid brochure Storage path." }, { status: 400 });
      }
      if (mode === "discard") {
        if (resort.brochure_path === path) {
          return NextResponse.json({ ok: false, error: "This brochure is attached to the resort and cannot be discarded." }, { status: 400 });
        }
        const removed = await supabase.storage.from(BROCHURE_BUCKET).remove([path]);
        if (removed.error) throw removed.error;
        return NextResponse.json({ ok: true });
      }
      const { data: stored, error: storageError } = await supabase.storage.from(BROCHURE_BUCKET)
        .list(prefix.slice(0, -1), { search: basename, limit: 100 });
      if (storageError) throw storageError;
      const object = stored?.find((item) => item.name === basename && item.id);
      if (!object || (object.metadata?.mimetype && object.metadata.mimetype !== "application/pdf")) {
        return NextResponse.json({ ok: false, error: `Uploaded PDF was not found in this ${singular}'s brochure folder.` }, { status: 400 });
      }
      const { error } = await supabase.from("property").update({ brochure_path: path }).eq("id", resortId);
      if (error) throw error;
      if (resort.brochure_path && resort.brochure_path !== path && resort.brochure_path.startsWith(prefix)) {
        const removed = await supabase.storage.from(BROCHURE_BUCKET).remove([resort.brochure_path]);
        if (removed.error) console.warn("Old brochure cleanup failed", removed.error);
      }
      revalidatePath(`/${folderType}/${resort.slug}`);
      return NextResponse.json({ ok: true, data: { path, name: resort.name } });
    }

    if (mode === "remove") {
      const { error } = await supabase.from("property").update({ brochure_path: null }).eq("id", resortId);
      if (error) throw error;
      if (resort.brochure_path?.startsWith(brochureStoragePrefix(propertyType, resortId))) {
        const removed = await supabase.storage.from(BROCHURE_BUCKET).remove([resort.brochure_path]);
        if (removed.error) console.warn("Brochure cleanup failed", removed.error);
      }
      revalidatePath(`/${folderType}/${resort.slug}`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unsupported brochure action." }, { status: 400 });
  } catch (error) {
    console.error("Brochure action failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Brochure action failed." }, { status: 500 });
  }
}
