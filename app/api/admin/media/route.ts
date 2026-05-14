import { NextResponse } from "next/server";

import { compressExistingSiteImages, createSignedSiteAssetUpload, uploadSiteAsset } from "@/lib/storage/site-assets";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const contentTypeHeader = request.headers.get("content-type") ?? "";

  if (contentTypeHeader.includes("multipart/form-data")) {
    const formData = await request.formData();
    const mode = String(formData.get("mode") ?? "");

    if (mode !== "upload-media") {
      return NextResponse.json({ ok: false, error: "Unsupported media upload action." }, { status: 400 });
    }

    const upload = formData.get("mediaFile");
    const folder = String(formData.get("folder") ?? "media-library").trim() || "media-library";

    if (!(upload instanceof File) || upload.size === 0) {
      return NextResponse.json({ ok: false, error: "Choose a file to upload." }, { status: 400 });
    }

    try {
      const publicUrl = await uploadSiteAsset(upload, folder, "full");
      return NextResponse.json({
        ok: true,
        data: {
          publicUrl,
          name: upload.name,
          compressed: ["image/png", "image/jpeg", "image/webp"].includes(upload.type)
        }
      });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "Failed to upload media." },
        { status: 500 }
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
  const contentType = String(json?.contentType ?? "").trim() || "application/octet-stream";
  const folder = String(json?.folder ?? "media-library").trim() || "media-library";

  if (!filename) {
    return NextResponse.json({ ok: false, error: "Filename is required." }, { status: 400 });
  }

  try {
    const data = await createSignedSiteAssetUpload(filename, contentType, folder);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to prepare media upload." },
      { status: 500 }
    );
  }
}
