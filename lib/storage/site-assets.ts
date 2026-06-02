import { requireAdminRole } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";

export const SITE_ASSET_BUCKET = "site-assets";
export const MAX_SITE_ASSET_FILE_SIZE = 50 * 1024 * 1024;
type SiteAssetUsage = "hero" | "banner" | "portrait" | "card" | "badge" | "logo" | "full";
export const ALLOWED_SITE_ASSET_MIME_TYPES = [
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
const HEIC_EXTENSIONS = ["heic", "heif"];
const ALLOWED_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "mp4",
  "webm",
  "mov"
];

export class SiteAssetUploadError extends Error {
  status: number;
  code: "missing_file" | "file_too_large" | "unsupported_file_type" | "image_processing_failed" | "storage_upload_failed";
  details?: unknown;

  constructor(
    code: SiteAssetUploadError["code"],
    message: string,
    options: { status?: number; details?: unknown; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "SiteAssetUploadError";
    this.code = code;
    this.status = options.status ?? 400;
    this.details = options.details;
  }
}

const IMAGE_PROFILES: Record<SiteAssetUsage, { width: number; height?: number; fit: "cover" | "inside"; quality: number }> = {
  hero: { width: 2600, height: 1460, fit: "cover", quality: 92 },
  banner: { width: 2200, height: 1238, fit: "cover", quality: 91 },
  portrait: { width: 1400, height: 1750, fit: "cover", quality: 90 },
  card: { width: 1400, height: 1050, fit: "cover", quality: 89 },
  badge: { width: 720, height: 360, fit: "inside", quality: 96 },
  logo: { width: 900, height: 320, fit: "inside", quality: 98 },
  full: { width: 2400, fit: "inside", quality: 91 }
};

const VARIANT_PROFILES: Record<string, { width: number; height?: number; fit: "cover" | "inside"; quality: number }> = {
  thumb: { width: 520, height: 360, fit: "cover", quality: 84 },
  card: { width: 1100, height: 825, fit: "cover", quality: 88 },
  banner: { width: 1800, height: 1012, fit: "cover", quality: 90 }
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

function fileNameExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function validateSiteAssetType(filename: string, contentType: string) {
  const extension = fileNameExtension(filename);
  const type = contentType || "application/octet-stream";

  if (HEIC_EXTENSIONS.includes(extension) || ["image/heic", "image/heif"].includes(type)) {
    throw new SiteAssetUploadError("unsupported_file_type", "HEIC images are not supported yet. Please convert to JPG or PNG.", {
      status: 415
    });
  }

  if (!ALLOWED_SITE_ASSET_MIME_TYPES.includes(type) && !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new SiteAssetUploadError("unsupported_file_type", "Unsupported file type. Upload JPG, PNG, WebP, SVG, PDF, document, video, or CSV files.", {
      status: 415,
      details: { filename, type }
    });
  }
}

export function validateSiteAssetFile(file: File) {
  if (!file || file.size === 0) {
    throw new SiteAssetUploadError("missing_file", "Choose a file to upload.", { status: 400 });
  }

  if (file.size > MAX_SITE_ASSET_FILE_SIZE) {
    throw new SiteAssetUploadError("file_too_large", "File is too large. Keep uploads under 50 MB.", { status: 413 });
  }

  validateSiteAssetType(file.name, file.type || "application/octet-stream");
}

function isOptimizableImage(file: File) {
  const extension = fileNameExtension(file.name);
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type) || ["png", "jpg", "jpeg", "webp"].includes(extension);
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

  try {
    return await sharp(source, { animated: false, limitInputPixels: 80_000_000 })
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
  } catch (error) {
    console.error("Image optimization failed", { filename: file.name, type: file.type, size: file.size, error });
    throw new SiteAssetUploadError(
      "image_processing_failed",
      "This image could not be processed. Please try a JPG/PNG/WebP image with standard RGB color.",
      { status: 422, cause: error }
    );
  }
}

async function optimizedStorageBuffer(source: Buffer, usage: SiteAssetUsage = "full") {
  const profile = IMAGE_PROFILES[usage] ?? IMAGE_PROFILES.full;

  return sharp(source, { animated: false, limitInputPixels: 80_000_000 })
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

  return sharp(source, { animated: false, limitInputPixels: 80_000_000 })
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
        fileSizeLimit: `${MAX_SITE_ASSET_FILE_SIZE}`,
        allowedMimeTypes: ALLOWED_SITE_ASSET_MIME_TYPES
      })
      .catch(() => undefined);
    return supabase;
  }

  const created = await supabase.storage.createBucket(SITE_ASSET_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_SITE_ASSET_FILE_SIZE}`,
    allowedMimeTypes: ALLOWED_SITE_ASSET_MIME_TYPES
  });

  if (created.error) {
    throw new Error(created.error.message);
  }

  return supabase;
}

export async function uploadSiteAsset(file: File, folder: string, usage: SiteAssetUsage = "full") {
  await requireAdminRole(["super_admin", "admin", "content_manager"]);
  validateSiteAssetFile(file);

  const supabase = await ensureBucket();
  const safeFolder = normalizeFolderPath(folder);
  const shouldOptimize = isOptimizableImage(file);
  const assetId = `${Date.now()}-${crypto.randomUUID()}`;
  let body: Buffer | File = file;
  let contentType = file.type || undefined;
  let extension = fileExtension(file);

  if (shouldOptimize) {
    try {
      body = await imageBuffer(file, usage);
      contentType = "image/webp";
      extension = "webp";
    } catch (error) {
      console.warn("Image optimization failed; uploading original image instead", {
        filename: file.name,
        type: file.type,
        size: file.size,
        error
      });
      body = file;
      contentType = file.type || undefined;
      extension = fileExtension(file);
    }
  }

  const path = `${safeFolder}/${assetId}.${extension}`;

  const uploaded = await supabase.storage.from(SITE_ASSET_BUCKET).upload(path, body, {
    cacheControl: "31536000",
    contentType,
    upsert: true
  });

  if (uploaded.error) {
    console.error("Storage upload failed", { path, filename: file.name, error: uploaded.error });
    throw new SiteAssetUploadError("storage_upload_failed", "Storage upload failed. Please try again.", {
      status: 502,
      details: uploaded.error,
      cause: uploaded.error
    });
  }

  if (shouldOptimize && contentType === "image/webp") {
    const variantResults = await Promise.allSettled(
      Object.entries(VARIANT_PROFILES).map(async ([variant]) => {
        const variantPath = `${safeFolder}/${assetId}-${variant}.webp`;
        const variantBody = await imageVariantBuffer(file, variant);

        const variantUpload = await supabase.storage.from(SITE_ASSET_BUCKET).upload(variantPath, variantBody, {
          cacheControl: "31536000",
          contentType: "image/webp",
          upsert: true
        });

        if (variantUpload.error) {
          throw variantUpload.error;
        }
      })
    );

    const failedVariants = variantResults.filter((result) => result.status === "rejected");
    if (failedVariants.length) {
      console.warn("Variant generation failed after main upload succeeded", {
        path,
        filename: file.name,
        failedCount: failedVariants.length,
        reasons: failedVariants.map((result) => (result as PromiseRejectedResult).reason)
      });
    }
  }

  const publicUrl = supabase.storage.from(SITE_ASSET_BUCKET).getPublicUrl(path);
  return publicUrl.data.publicUrl;
}

export async function createSignedSiteAssetUpload(filename: string, contentType: string, folder: string) {
  await requireAdminRole(["super_admin", "admin", "content_manager"]);
  validateSiteAssetType(filename, contentType);
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
  await requireAdminRole(["super_admin", "admin", "content_manager"]);
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
  await requireAdminRole(["super_admin", "admin", "content_manager"]);
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
