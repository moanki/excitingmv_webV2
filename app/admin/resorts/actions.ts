"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { generateResortSeoCopy, type ResortSeoGenerationInput } from "@/lib/services/resort-ai-service";
import { deleteResort, normalizePropertyType, saveResort, seedSampleResorts, type PropertyType } from "@/lib/services/resort-service";
import { uploadSiteAsset } from "@/lib/storage/site-assets";
import type { PublishStatus } from "@/lib/types";
import { resortSeoGenerationInputSchema } from "@/lib/validations";

type ActionState = { message?: string; error?: string } | undefined;

function adminPathForProperty(propertyType: PropertyType) {
  return propertyType === "liveaboards" ? "/admin/liveaboards" : propertyType === "hotels" ? "/admin/hotels" : "/admin/resorts";
}

function publicPathForProperty(propertyType: PropertyType) {
  return propertyType === "liveaboards" ? "/liveaboards" : propertyType === "hotels" ? "/hotels" : "/resorts";
}

function revalidateResortPaths(propertyType: PropertyType = "resort") {
  revalidatePath("/");
  revalidatePath(publicPathForProperty(propertyType));
  revalidatePath("/partner/resorts");
  revalidatePath("/admin");
  revalidatePath(adminPathForProperty(propertyType));
  revalidateTag("resorts-public");
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

function publishingStateFromStatus(statusValue: string, featuredValue: FormDataEntryValue | null) {
  const status = statusValue === "published" || statusValue === "archived" ? statusValue : "draft";
  const isFeaturedHomepage = featuredValue === "on" && status === "published";

  return {
    status,
    isFeaturedHomepage
  } as const;
}

async function parseRoomTypes(formData: FormData) {
  const roomCount = Number(formData.get("roomCount") ?? 0);
  const rooms = [];

  for (let index = 0; index < roomCount; index += 1) {
    const name = String(formData.get(`room_${index}_name`) ?? "").trim();
    const description = String(formData.get(`room_${index}_description`) ?? "").trim();
    const seoDescription = String(formData.get(`room_${index}_seoDescription`) ?? "").trim();
    const sizeLabel = String(formData.get(`room_${index}_sizeLabel`) ?? "").trim();
    const maxOccupancyValue = String(formData.get(`room_${index}_maxOccupancy`) ?? "").trim();
    const bedType = String(formData.get(`room_${index}_bedType`) ?? "").trim();
    const viewLabel = String(formData.get(`room_${index}_viewLabel`) ?? "").trim();
    const amenities = String(formData.get(`room_${index}_amenities`) ?? "")
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    const roomPhotoFile = formData.get(`room_${index}_photoFile`);
    const existingPhoto = String(formData.get(`room_${index}_photoUrl`) ?? "").trim();
    let photoUrl = existingPhoto;
    if (roomPhotoFile instanceof File && roomPhotoFile.size > 0) {
      try {
        photoUrl = await uploadSiteAsset(roomPhotoFile, "resorts", "card");
      } catch (error) {
        console.error("Room photo upload failed", { filename: roomPhotoFile.name, roomName: name, error });
        throw new Error(
          `Room photo failed for ${name || `room ${index + 1}`}: ${
            error instanceof Error ? error.message : "Image could not be uploaded."
          }`
        );
      }
    }

    if (!name && !description && !seoDescription && !photoUrl && !sizeLabel && !maxOccupancyValue && !bedType && !viewLabel && !amenities.length) {
      continue;
    }

    if (!name) {
      continue;
    }

    rooms.push({
      name,
      description,
      seoDescription,
      photoUrl,
      sizeLabel,
      maxOccupancy: maxOccupancyValue ? Number(maxOccupancyValue) : null,
      bedType,
      viewLabel,
      amenities
    });
  }

  return rooms;
}

export async function saveResortAction(_: ActionState, formData: FormData) {
  try {
    const name = String(formData.get("name") ?? "").trim();
    const propertyType = normalizePropertyType(formData.get("propertyType"));
    const explicitPublishingMode = String(formData.get("publishingMode") ?? "").trim();
    const publishing = explicitPublishingMode
      ? publishingState(explicitPublishingMode)
      : publishingStateFromStatus(
          String(formData.get("status") ?? "draft").trim(),
          formData.get("isFeaturedHomepage")
        );
    const heroImageFile = formData.get("heroImageFile");
    const galleryFiles = formData.getAll("galleryMediaFiles");
    let uploadedHeroImage = String(formData.get("heroImageUrl") ?? "").trim();
    if (heroImageFile instanceof File && heroImageFile.size > 0) {
      try {
        uploadedHeroImage = await uploadSiteAsset(heroImageFile, "resorts", "banner");
      } catch (error) {
        console.error("Hero image upload failed", { filename: heroImageFile.name, error });
        return {
          error: `Hero image failed: ${error instanceof Error ? error.message : "Image could not be uploaded."}`
        };
      }
    }

    const galleryUploadFiles = galleryFiles.filter((item): item is File => item instanceof File && item.size > 0);
    const galleryUploadResults = await Promise.allSettled(
      galleryUploadFiles.map(async (file) => ({
        filename: file.name,
        url: await uploadSiteAsset(file, "resorts", "card")
      }))
    );
    const uploadedGalleryImages = galleryUploadResults
      .filter((result): result is PromiseFulfilledResult<{ filename: string; url: string }> => result.status === "fulfilled")
      .map((result) => result.value.url)
      .filter(Boolean);
    const failedGalleryImages = galleryUploadResults
      .map((result, index) => ({ result, file: galleryUploadFiles[index] }))
      .filter((item): item is { result: PromiseRejectedResult; file: File } => item.result.status === "rejected");

    if (failedGalleryImages.length) {
      console.warn("Some gallery images failed to upload", {
        failed: failedGalleryImages.map((item) => ({
          filename: item.file.name,
          reason: item.result.reason
        }))
      });
    }
    const galleryMediaUrls = String(formData.get("galleryMediaUrls") ?? "")
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    const roomTypes = await parseRoomTypes(formData);
    const input = {
      id: String(formData.get("id") ?? "").trim() || undefined,
      propertyType,
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
    revalidateResortPaths(propertyType);
    revalidatePath(`${publicPathForProperty(propertyType)}/${input.slug}`);
    if (input.id) {
      revalidatePath(`${adminPathForProperty(propertyType)}/${input.id}/edit`);
    }
    const galleryMessage =
      galleryUploadFiles.length && failedGalleryImages.length
        ? ` ${uploadedGalleryImages.length} gallery image${uploadedGalleryImages.length === 1 ? "" : "s"} uploaded. ${failedGalleryImages.length} failed: ${failedGalleryImages.map((item) => item.file.name).join(", ")}.`
        : galleryUploadFiles.length
          ? ` ${uploadedGalleryImages.length} gallery image${uploadedGalleryImages.length === 1 ? "" : "s"} uploaded.`
          : "";
    return { message: `${input.name} saved.${galleryMessage}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save property." };
  }
}

export async function deleteResortAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const propertyType = normalizePropertyType(formData.get("propertyType"));
  if (!id) {
    return;
  }

  await deleteResort(id);
  revalidateResortPaths(propertyType);
}

export async function seedResortsAction() {
  await seedSampleResorts();
  revalidateResortPaths();
}

export async function generateResortSeoAction(input: ResortSeoGenerationInput) {
  const parsed = resortSeoGenerationInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Enter enough resort details to generate SEO copy."
    };
  }

  try {
    const result = await generateResortSeoCopy(parsed.data);
    return {
      ok: true as const,
      data: {
        ...result.data,
        model: result.usedModel,
        provider: result.usedProvider
      }
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to generate SEO copy."
    };
  }
}
