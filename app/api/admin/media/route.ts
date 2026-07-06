import { NextResponse } from "next/server";

import { requireAdminJson } from "@/lib/auth/require-admin";
import {
  compressExistingSiteImages,
  createSignedSiteAssetUpload,
  SiteAssetUploadError,
  uploadSiteAsset
} from "@/lib/storage/site-assets";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = await requireAdminJson();
  if (!auth.ok) return auth.response;

  const contentTypeHeader = request.headers.get("content-type") ?? "";

  if (contentTypeHeader.includes("multipart/form-data")) {
    const formData = await request.formData();
    const mode = String(formData.get("mode") ?? "");

    if (mode !== "upload-media") {
      return NextResponse.json({ ok: false, error: "Unsupported media upload action." }, { status: 400 });
    }

    const upload = formData.get("mediaFile");
    const folder = String(formData.get("folder") ?? "media-library").trim() || "media-library";
    const originalName = String(formData.get("originalName") ?? "").trim();

    if (!(upload instanceof File) || upload.size === 0) {
      return NextResponse.json({ ok: false, error: "Choose a file to upload." }, { status: 400 });
    }

    try {
      const publicUrl = await uploadSiteAsset(upload, folder, "full", { originalName: originalName || upload.name });
      return NextResponse.json({
        ok: true,
        data: {
          publicUrl,
          name: upload.name,
          compressed: ["image/png", "image/jpeg", "image/webp"].includes(upload.type)
        }
      });
    } catch (error) {
      console.error("Admin media upload failed", {
        filename: upload.name,
        type: upload.type,
        size: upload.size,
        error
      });

      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Failed to upload media.",
          code: error instanceof SiteAssetUploadError ? error.code : "upload_failed"
        },
        { status: error instanceof SiteAssetUploadError ? error.status : 500 }
      );
    }
  }

  const json = await request.json().catch(() => null);
  const mode = typeof json?.mode === "string" ? json.mode : "";

  if (mode === "compress-existing-images") {
    try {
      const data = await compressExistingSiteImages();
      return NextResponse.json({ ok: true, data });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "Failed to compress existing images." },
        { status: 500 }
      );
    }
  }

  if (mode !== "create-upload-url") {
    return NextResponse.json({ ok: false, error: "Unsupported media action." }, { status: 400 });
  }

  const filename = String(json?.filename ?? "").trim();
  const originalName = String(json?.originalName ?? filename).trim() || filename;
  const contentType = String(json?.contentType ?? "").trim() || "application/octet-stream";
  const folder = String(json?.folder ?? "media-library").trim() || "media-library";

  if (!filename) {
    return NextResponse.json({ ok: false, error: "Filename is required." }, { status: 400 });
  }

  try {
    const data = await createSignedSiteAssetUpload(filename, contentType, folder, originalName);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("Signed media upload preparation failed", { filename, contentType, folder, error });
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to prepare media upload." },
      { status: 500 }
    );
  }
}
