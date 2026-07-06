"use client";

import { publicEnv } from "@/lib/public-env";

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;
const API_UPLOAD_SOFT_LIMIT = 3.5 * 1024 * 1024;
const RASTER_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_UPLOAD_TYPES = new Set([
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
]);
const ALLOWED_UPLOAD_EXTENSIONS = new Set([
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
]);

type UploadStatus = "validating" | "optimizing" | "preparing" | "uploading" | "saving";

export type AdminMediaUploadResult = {
  publicUrl: string;
  compressed: boolean;
  direct: boolean;
};

export function formatUploadBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function adminMediaFileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

export function validateAdminMediaFile(file: File) {
  const extension = adminMediaFileExtension(file);

  if (!file || file.size === 0) {
    return "Choose a file to upload.";
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return "File is too large. Keep uploads under 50 MB.";
  }

  if (["heic", "heif"].includes(extension) || ["image/heic", "image/heif"].includes(file.type)) {
    return "HEIC images are not supported yet. Please convert to JPG or PNG.";
  }

  if (!ALLOWED_UPLOAD_TYPES.has(file.type || "application/octet-stream") && !ALLOWED_UPLOAD_EXTENSIONS.has(extension)) {
    return "Unsupported file type. Upload JPG, PNG, WebP, SVG, PDF, document, video, or CSV files.";
  }

  return "";
}

export function isRasterAdminImage(file: File) {
  const extension = adminMediaFileExtension(file);
  return RASTER_IMAGE_TYPES.has(file.type) || ["png", "jpg", "jpeg", "webp"].includes(extension);
}

function safeWebpName(file: File) {
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9._-]+/gi, "-") || "image";
  return `${base}.webp`;
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });
}

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressRasterImage(file: File) {
  const image = await loadImage(file);
  const maxWidth = 2400;
  const maxHeight = 2400;
  const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("This browser could not prepare the image for upload.");
  }

  context.drawImage(image, 0, 0, width, height);

  for (const quality of [0.92, 0.88, 0.84]) {
    const blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size > 0 && (blob.size < file.size || blob.size <= API_UPLOAD_SOFT_LIMIT)) {
      return new File([blob], safeWebpName(file), { type: "image/webp", lastModified: Date.now() });
    }
  }

  const fallbackBlob = await canvasToBlob(canvas, 0.8);
  if (!fallbackBlob || fallbackBlob.size === 0) {
    throw new Error("This image could not be optimized. Please try a standard JPG, PNG, or WebP image.");
  }

  return new File([fallbackBlob], safeWebpName(file), { type: "image/webp", lastModified: Date.now() });
}

function uploadRequest<T>(
  url: string,
  method: "POST" | "PUT",
  body: FormData,
  headers: Record<string, string>,
  onProgress?: (progress: number) => void
) {
  return new Promise<{ status: number; payload: T | null }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onerror = () => reject(new Error("The upload connection failed. Please try again."));
    xhr.onload = () => {
      let payload: T | null = null;
      try {
        payload = JSON.parse(xhr.responseText) as T;
      } catch {
        payload = null;
      }
      resolve({ status: xhr.status, payload });
    };
    xhr.send(body);
  });
}

async function postThroughMediaRoute(file: File, folder: string, originalName: string, onProgress?: (progress: number) => void) {
  const formData = new FormData();
  formData.set("mode", "upload-media");
  formData.set("folder", folder);
  formData.set("originalName", originalName);
  formData.set("mediaFile", file);

  const { status, payload } = await uploadRequest<{
        ok?: boolean;
        error?: string;
        data?: {
          publicUrl: string;
          compressed?: boolean;
        };
      }>("/api/admin/media", "POST", formData, {}, onProgress);

  if (status < 200 || status >= 300 || !payload?.ok || !payload.data) {
    throw new Error(payload?.error || (status === 413 ? "The selected file is too large for this upload path." : "Could not upload the selected media."));
  }

  return payload.data.publicUrl;
}

async function uploadWithSignedUrl(file: File, folder: string, originalName: string, onProgress?: (progress: number) => void) {
  const signedResponse = await fetch("/api/admin/media", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mode: "create-upload-url",
      filename: file.name,
      originalName,
      contentType: file.type || "application/octet-stream",
      folder
    })
  });
  const signedPayload = (await signedResponse.json().catch(() => null)) as
    | {
        ok?: boolean;
        error?: string;
        data?: {
          bucket: string;
          path: string;
          token: string;
          signedUrl: string;
          publicUrl: string;
          contentType: string;
          metadata: { originalName: string; category: string };
        };
      }
    | null;

  if (!signedResponse.ok || !signedPayload?.ok || !signedPayload.data) {
    throw new Error(signedPayload?.error || "Could not prepare a direct media upload.");
  }

  const uploadBody = new FormData();
  uploadBody.append("cacheControl", "31536000");
  uploadBody.append("metadata", JSON.stringify(signedPayload.data.metadata));
  uploadBody.append("", file);
  const uploaded = await uploadRequest<{ error?: string; message?: string }>(
    signedPayload.data.signedUrl,
    "PUT",
    uploadBody,
    {
      apikey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      "x-upsert": "true"
    },
    onProgress
  );

  if (uploaded.status < 200 || uploaded.status >= 300) {
    throw new Error(uploaded.payload?.message || uploaded.payload?.error || "Storage upload failed. Please try again.");
  }

  return signedPayload.data.publicUrl;
}

export async function uploadAdminMediaFile(
  file: File,
  options: {
    folder?: string;
    onStatus?: (status: UploadStatus, message: string) => void;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<AdminMediaUploadResult> {
  const folder = options.folder ?? "media-library";
  options.onStatus?.("validating", "Checking file...");
  const validationError = validateAdminMediaFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  let uploadFile = file;
  let compressed = false;

  if (isRasterAdminImage(file)) {
    try {
      options.onStatus?.("optimizing", "Optimizing image before upload...");
      uploadFile = await compressRasterImage(file);
      compressed = true;
    } catch (error) {
      console.warn("Browser image optimization failed; falling back to direct original upload", {
        filename: file.name,
        type: file.type,
        size: file.size,
        error
      });
      uploadFile = file;
      compressed = false;
    }
  }

  if (uploadFile.size <= API_UPLOAD_SOFT_LIMIT) {
    try {
      options.onStatus?.("uploading", compressed ? "Uploading optimized image..." : "Uploading media...");
      const publicUrl = await postThroughMediaRoute(uploadFile, folder, file.name, options.onProgress);
      return { publicUrl, compressed, direct: false };
    } catch (error) {
      if (!(error instanceof Error) || !/large|413|payload/i.test(error.message)) {
        throw error;
      }
    }
  }

  options.onStatus?.("preparing", "Preparing direct storage upload...");
  options.onStatus?.("uploading", "Uploading media directly to storage...");
  const publicUrl = await uploadWithSignedUrl(uploadFile, folder, file.name, options.onProgress);
  return { publicUrl, compressed, direct: true };
}
