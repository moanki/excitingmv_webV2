import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";

export const SITE_ASSET_BUCKET = "site-assets";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
type SiteAssetUsage = "hero" | "banner" | "portrait" | "card" | "badge" | "logo" | "full";
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "video/mp4",
  "video/webm",
  "video/quicktime"
];

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
  "admin/login",
  "chat-attachments",
  "media-library",
  "imports",
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

function isOptimizablePath(path: string, contentType?: string | null) {
  const lower = path.toLowerCase();
  return (
    ["image/png", "image/jpeg", "image/webp"].includes(contentType ?? "") ||
    /\.(png|jpe?g|webp)$/i.test(lower)
  );
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

async function optimizedStorageBuffer(source: Buffer, usage: SiteAssetUsage = "full") {
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
        allowedMimeTypes: ALLOWED_MIME_TYPES
      })
      .catch(() => undefined);
    return supabase;
  }

  const created = await supabase.storage.createBucket(SITE_ASSET_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_FILE_SIZE}`,
    allowedMimeTypes: ALLOWED_MIME_TYPES
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

export async function createSignedSiteAssetUpload(filename: string, contentType: string, folder: string) {
  const supabase = await ensureBucket();
  const safeFolder = normalizeFolderPath(folder);
  const extension = fileExtension({ name: filename, type: contentType } as File);
  const assetId = `${Date.now()}-${crypto.randomUUID()}`;
  const path = `${safeFolder}/${assetId}.${extension}`;
  const signed = await supabase.storage.from(SITE_ASSET_BUCKET).createSignedUploadUrl(path, {
    upsert: true
  });

  if (signed.error || !signed.data) {
    throw new Error(signed.error?.message ?? "Failed to prepare media upload.");
  }

  const publicUrl = supabase.storage.from(SITE_ASSET_BUCKET).getPublicUrl(path);

  return {
    bucket: SITE_ASSET_BUCKET,
    path,
    token: signed.data.token,
    signedUrl: signed.data.signedUrl,
    publicUrl: publicUrl.data.publicUrl,
    contentType
  };
}

async function listStoragePaths(prefix: string): Promise<Array<{ path: string; contentType: string | null; size: number | null }>> {
  const supabase = await ensureBucket();
  const output: Array<{ path: string; contentType: string | null; size: number | null }> = [];
  const { data, error } = await supabase.storage.from(SITE_ASSET_BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" }
  });

  if (error || !data) {
    return output;
  }

  for (const entry of data) {
    const path = `${prefix}/${entry.name}`;
    const isFolder = !entry.metadata && entry.id === null;

    if (isFolder) {
      output.push(...(await listStoragePaths(path)));
      continue;
    }

    output.push({
      path,
      contentType: typeof entry.metadata?.mimetype === "string" ? entry.metadata.mimetype : null,
      size: typeof entry.metadata?.size === "number" ? entry.metadata.size : null
    });
  }

  return output;
}

export async function compressExistingSiteImages() {
  const supabase = await ensureBucket();
  const uniquePaths = new Map<string, { contentType: string | null; size: number | null }>();

  for (const prefix of SITE_ASSET_PREFIXES) {
    const paths = await listStoragePaths(prefix);
    paths.forEach((item) => uniquePaths.set(item.path, { contentType: item.contentType, size: item.size }));
  }

  let scanned = 0;
  let compressed = 0;
  let skipped = 0;
  let failed = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  for (const [path, meta] of uniquePaths) {
    if (/(?:-(?:thumb|card|banner))\.webp$/i.test(path) || !isOptimizablePath(path, meta.contentType)) {
      skipped += 1;
      continue;
    }

    scanned += 1;

    try {
      const downloaded = await supabase.storage.from(SITE_ASSET_BUCKET).download(path);
      if (downloaded.error || !downloaded.data) {
        failed += 1;
        continue;
      }

      const source = Buffer.from(await downloaded.data.arrayBuffer());
      const optimized = await optimizedStorageBuffer(source, "full");

      bytesBefore += source.byteLength;

      if (optimized.byteLength >= source.byteLength) {
        bytesAfter += source.byteLength;
        skipped += 1;
        continue;
      }

      const uploaded = await supabase.storage.from(SITE_ASSET_BUCKET).upload(path, optimized, {
        cacheControl: "31536000",
        contentType: "image/webp",
        upsert: true
      });

      if (uploaded.error) {
        failed += 1;
        bytesAfter += source.byteLength;
        continue;
      }

      compressed += 1;
      bytesAfter += optimized.byteLength;
    } catch {
      failed += 1;
    }
  }

  return {
    scanned,
    compressed,
    skipped,
    failed,
    bytesBefore,
    bytesAfter,
    savedBytes: Math.max(0, bytesBefore - bytesAfter)
  };
}

function fileType(path: string) {
  const lower = path.toLowerCase();
  if (/\.(mp4|webm|mov)$/.test(lower)) return "video" as const;
  if (/\.(png|jpg|jpeg|webp|svg|gif|avif)$/.test(lower)) return "image" as const;
  return "file" as const;
}

export async function listSiteAssets({ limitPerPrefix = 24 }: { limitPerPrefix?: number } = {}) {
  try {
    const supabase = await ensureBucket();
    const items: { name: string; url: string; type: "image" | "video" | "file" }[] = [];

    for (const prefix of SITE_ASSET_PREFIXES) {
      const { data, error } = await supabase.storage.from(SITE_ASSET_BUCKET).list(prefix, {
        limit: limitPerPrefix,
        sortBy: { column: "created_at", order: "desc" }
      });

      if (error || !data) {
        continue;
      }

      for (const entry of data) {
        if (!entry.name || entry.id === null || /-(thumb|card|banner)\.webp$/i.test(entry.name)) {
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

function storagePathFromPublicUrl(url: string) {
  try {
    const parsed = new URL(url);
    const marker = `/object/public/${SITE_ASSET_BUCKET}/`;
    const index = parsed.pathname.indexOf(marker);

    if (index === -1) {
      return "";
    }

    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return "";
  }
}

function variantPathsFor(path: string) {
  const match = path.match(/^(.*)\.([a-z0-9]+)$/i);
  if (!match) {
    return [path];
  }

  const [, base, extension] = match;
  if (extension.toLowerCase() !== "webp") {
    return [path];
  }

  return [path, `${base}-thumb.webp`, `${base}-card.webp`, `${base}-banner.webp`];
}

export async function deleteSiteAsset(publicUrl: string) {
  const path = storagePathFromPublicUrl(publicUrl);

  if (!path) {
    throw new Error("Could not identify the selected media file.");
  }

  const supabase = await ensureBucket();
  const { error } = await supabase.storage.from(SITE_ASSET_BUCKET).remove(variantPathsFor(path));

  if (error) {
    throw new Error(error.message);
  }
}
