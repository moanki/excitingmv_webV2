import { NextResponse } from "next/server";

import { createSignedSiteAssetUpload } from "@/lib/storage/site-assets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const mode = typeof json?.mode === "string" ? json.mode : "";

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
