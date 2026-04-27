import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";

export const SITE_ASSET_BUCKET = "site-assets";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
type SiteAssetUsage = "hero" | "banner" | "portrait" | "card" | "badge" | "logo" | "full";

const IMAGE_PROFILES: Record<SiteAssetUsage, { width: number; height?: number; fit: "cover" | "inside"; quality: number }> = {
  hero: { width: 2400, height: 1350, fit: "cover", quality: 84 },
  banner: { width: 1800, height: 900, fit: "cover", quality: 84 },
  portrait: { width: 1200, height: 1500, fit: "cover", quality: 84 },
  card: { width: 1100, height: 825, fit: "cover", quality: 82 },
  badge: { width: 520, height: 260, fit: "inside", quality: 90 },
  logo: { width: 720, height: 260, fit: "inside", quality: 92 },
  full: { width: 1800, fit: "inside", quality: 84 }
};

const VARIANT_PROFILES: Record<string, { width: number; height?: number; fit: "cover" | "inside"; quality: number }> = {
  thumb: { width: 420, height: 280, fit: "cover", quality: 78 },
  card: { width: 900, height: 675, fit: "cover", quality: 82 },
  banner: { width: 1600, height: 900, fit: "cover", quality: 84 }
};
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

function isOptimizableImage(file: File) {
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type);
}

async function imageBuffer(file: File, usage: SiteAssetUsage) {
  const source = Buffer.from(await file.arrayBuffer());
  const profile = IMAGE_PROFILES[usage] ?? IMAGE_PROFILES.full;

  return sharp(source, { animated: false })
    .rotate()
    .resize({
      width: profile.width,
      height: profile.height,
      fit: profile.fit,
      withoutEnlargement: true,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .webp({ quality: profile.quality, smartSubsample: true })
    .toBuffer();
}

async function imageVariantBuffer(file: File, variant: keyof typeof VARIANT_PROFILES) {
  const source = Buffer.from(await file.arrayBuffer());
  const profile = VARIANT_PROFILES[variant];

  return sharp(source, { animated: false })
    .rotate()
    .resize({
      width: profile.width,
      height: profile.height,
      fit: profile.fit,
      withoutEnlargement: true,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .webp({ quality: profile.quality, smartSubsample: true })
    .toBuffer();
}

async function ensureBucket() {
  const supabase = createSupabaseAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const existing = buckets?.find((bucket) => bucket.name === SITE_ASSET_BUCKET);

  if (existing) {
    await supabase.storage
      .updateBucket(SITE_ASSET_BUCKET, {
        public: true,
        fileSizeLimit: `${MAX_FILE_SIZE}`,
        allowedMimeTypes: [
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/svg+xml",
          "application/pdf",
          "video/mp4",
          "video/webm",
          "video/quicktime"
        ]
      })
      .catch(() => undefined);
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
      "application/pdf",
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

export async function uploadSiteAsset(file: File, folder: string, usage: SiteAssetUsage = "full") {
  if (!file || file.size === 0) {
    throw new Error("No file provided.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Keep uploads under 50 MB.");
  }

  const supabase = await ensureBucket();
  const safeFolder = normalizeFolderPath(folder);
  const shouldOptimize = isOptimizableImage(file);
  const extension = shouldOptimize ? "webp" : fileExtension(file);
  const assetId = `${Date.now()}-${crypto.randomUUID()}`;
  const path = `${safeFolder}/${assetId}.${extension}`;
  const body = shouldOptimize ? await imageBuffer(file, usage) : file;
  const contentType = shouldOptimize ? "image/webp" : file.type || undefined;

  const uploaded = await supabase.storage.from(SITE_ASSET_BUCKET).upload(path, body, {
    cacheControl: "31536000",
    contentType,
    upsert: true
  });

  if (uploaded.error) {
    throw new Error(uploaded.error.message);
  }

  if (shouldOptimize) {
    await Promise.all(
      Object.entries(VARIANT_PROFILES).map(async ([variant]) => {
        const variantPath = `${safeFolder}/${assetId}-${variant}.webp`;
        const variantBody = await imageVariantBuffer(file, variant);

        await supabase.storage.from(SITE_ASSET_BUCKET).upload(variantPath, variantBody, {
          cacheControl: "31536000",
          contentType: "image/webp",
          upsert: true
        });
      })
    );
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
