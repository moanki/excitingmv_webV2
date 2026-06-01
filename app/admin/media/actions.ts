"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { deleteSiteAsset, uploadSiteAsset } from "@/lib/storage/site-assets";

type MediaActionState = { message?: string; error?: string } | undefined;

function revalidateMediaLibrary() {
  revalidatePath("/admin/media");
  revalidatePath("/admin/resorts");
  revalidatePath("/admin/resorts/new");
  revalidatePath("/admin/settings");
}

export async function uploadMediaLibraryAssetAction(
  _: MediaActionState,
  formData: FormData
): Promise<MediaActionState> {
  try {
    await requireAdmin();
    const file = formData.get("mediaFile");
    const usage = String(formData.get("usage") ?? "full");

    if (!(file instanceof File) || file.size === 0) {
      return { error: "Choose an image, video, or file to upload." };
    }

    const safeUsage = usage === "hero" || usage === "banner" || usage === "card" || usage === "logo" ? usage : "full";
    await uploadSiteAsset(file, "media-library", safeUsage);
    revalidateMediaLibrary();

    return { message: `${file.name || "Media file"} uploaded.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to upload media." };
  }
}

export async function deleteMediaLibraryAssetAction(formData: FormData) {
  await requireAdmin();
  const url = String(formData.get("url") ?? "").trim();

  if (!url) {
    return;
  }

  await deleteSiteAsset(url);
  revalidateMediaLibrary();
}
