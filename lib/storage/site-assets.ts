import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SITE_ASSET_BUCKET = "site-assets";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const SITE_ASSET_PREFIXES = [
  "homepage/hero",
  "homepage/features",
  "homepage/ceo",
  "homepage/story",
  "homepage/guide",
  "homepage/newsletter",
  "homepage/awards",
  "site/logos",
  "site/footer",
  "site/membership",
  "site/award",
  "resorts"
];

function slugSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function normalizeFolderPath(folder: string) {
  const segments = folder
    .split("/")
    .map((segment) => slugSegment(segment))
    .filter(Boolean);

  return segments.join("/") || "general";
}

function fileExtension(file: File) {
  const source = file.name.split(".").pop()?.toLowerCase();
  if (source) return source;

  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/svg+xml") return "svg";
  return "bin";
}

async function ensureBucket() {
  const supabase = createSupabaseAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const existing = buckets?.find((bucket) => bucket.name === SITE_ASSET_BUCKET);

  if (existing) {
    return supabase;
  }

  const created = await supabase.storage.createBucket(SITE_ASSET_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_FILE_SIZE}`,
    allowedMimeTypes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "video/quicktime"
    ]
  });

  if (created.error) {
    throw new Error(created.error.message);
  }

  return supabase;
}

export async function uploadSiteAsset(file: File, folder: string) {
  if (!file || file.size === 0) {
    throw new Error("No file provided.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Keep uploads under 50 MB.");
  }

  const supabase = await ensureBucket();
  const safeFolder = normalizeFolderPath(folder);
  const extension = fileExtension(file);
  const path = `${safeFolder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const uploaded = await supabase.storage.from(SITE_ASSET_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: true
  });

  if (uploaded.error) {
    throw new Error(uploaded.error.message);
  }

  const publicUrl = supabase.storage.from(SITE_ASSET_BUCKET).getPublicUrl(path);
  return publicUrl.data.publicUrl;
}

function fileType(path: string) {
  const lower = path.toLowerCase();
  if (/\.(mp4|webm|mov)$/.test(lower)) return "video" as const;
  if (/\.(png|jpg|jpeg|webp|svg|gif|avif)$/.test(lower)) return "image" as const;
  return "file" as const;
}

export async function listSiteAssets() {
  try {
    const supabase = await ensureBucket();
    const items: { name: string; url: string; type: "image" | "video" | "file" }[] = [];

    for (const prefix of SITE_ASSET_PREFIXES) {
      const { data, error } = await supabase.storage.from(SITE_ASSET_BUCKET).list(prefix, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" }
      });

      if (error || !data) {
        continue;
      }

      for (const entry of data) {
        if (!entry.name || entry.id === null) {
          continue;
        }

        const path = `${prefix}/${entry.name}`;
        const publicUrl = supabase.storage.from(SITE_ASSET_BUCKET).getPublicUrl(path);
        items.push({
          name: entry.name,
          url: publicUrl.data.publicUrl,
          type: fileType(path)
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}
