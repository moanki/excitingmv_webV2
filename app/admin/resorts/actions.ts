"use server";

import { revalidatePath } from "next/cache";

import { deleteResort, saveResort, seedSampleResorts } from "@/lib/services/resort-service";
import { uploadSiteAsset } from "@/lib/storage/site-assets";
import type { PublishStatus } from "@/lib/types";

type ActionState = { message?: string; error?: string } | undefined;

function revalidateResortPaths() {
  revalidatePath("/");
  revalidatePath("/resorts");
  revalidatePath("/partner/resorts");
  revalidatePath("/admin");
  revalidatePath("/admin/resorts");
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publishingState(value: string): { status: PublishStatus; isFeaturedHomepage: boolean } {
  if (value === "published_featured") {
    return { status: "published", isFeaturedHomepage: true };
  }

  if (value === "published_standard") {
    return { status: "published", isFeaturedHomepage: false };
  }

  if (value === "archived") {
    return { status: "archived", isFeaturedHomepage: false };
  }

  return { status: "draft", isFeaturedHomepage: false };
}

async function parseRoomTypes(formData: FormData) {
  const roomCount = Number(formData.get("roomCount") ?? 0);
  const rooms = [];

  for (let index = 0; index < roomCount; index += 1) {
    const name = String(formData.get(`room_${index}_name`) ?? "").trim();
    const description = String(formData.get(`room_${index}_description`) ?? "").trim();
    const seoDescription = String(formData.get(`room_${index}_seoDescription`) ?? "").trim();
    const roomPhotoFile = formData.get(`room_${index}_photoFile`);
    const existingPhoto = String(formData.get(`room_${index}_photoUrl`) ?? "").trim();
    const photoUrl =
      roomPhotoFile instanceof File && roomPhotoFile.size > 0
        ? await uploadSiteAsset(roomPhotoFile, "resorts")
        : existingPhoto;

    if (!name && !description && !seoDescription && !photoUrl) {
      continue;
    }

    if (!name) {
      continue;
    }

    rooms.push({
      name,
      description,
      seoDescription,
      photoUrl
    });
  }

  return rooms;
}

export async function saveResortAction(_: ActionState, formData: FormData) {
  try {
    const name = String(formData.get("name") ?? "").trim();
    const publishing = publishingState(String(formData.get("publishingMode") ?? "draft").trim());
    const heroImageFile = formData.get("heroImageFile");
    const galleryFiles = formData.getAll("galleryMediaFiles");
    const uploadedHeroImage =
      heroImageFile instanceof File && heroImageFile.size > 0
        ? await uploadSiteAsset(heroImageFile, "resorts")
        : String(formData.get("heroImageUrl") ?? "").trim();
    const uploadedGalleryImages = (
      await Promise.all(
        galleryFiles.map(async (item) => {
          if (!(item instanceof File) || item.size === 0) return "";
          return uploadSiteAsset(item, "resorts");
        })
      )
    ).filter(Boolean);
    const galleryMediaUrls = String(formData.get("galleryMediaUrls") ?? "")
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    const roomTypes = await parseRoomTypes(formData);
    const input = {
      id: String(formData.get("id") ?? "").trim() || undefined,
      slug: slugify(String(formData.get("slug") ?? name)),
      name,
      location: String(formData.get("location") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      transferType: String(formData.get("transferType") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      highlights: splitLines(String(formData.get("highlights") ?? "")),
      mealPlans: splitLines(String(formData.get("mealPlans") ?? "")),
      seoTitle: String(formData.get("seoTitle") ?? name).trim(),
      seoDescription: String(formData.get("seoDescription") ?? "").trim(),
      seoSummary: String(formData.get("seoSummary") ?? "").trim(),
      heroImageUrl: uploadedHeroImage,
      galleryMediaUrls: [...galleryMediaUrls, ...uploadedGalleryImages],
      roomTypes,
      status: publishing.status,
      isFeaturedHomepage: publishing.isFeaturedHomepage
    };

    if (!input.name || !input.slug) {
      return { error: "Property name and slug are required." };
    }

    await saveResort(input);
    revalidateResortPaths();
    revalidatePath(`/resorts/${input.slug}`);
    return { message: `${input.name} saved.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save property." };
  }
}

export async function deleteResortAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await deleteResort(id);
  revalidateResortPaths();
}

export async function seedResortsAction() {
  await seedSampleResorts();
  revalidateResortPaths();
}
