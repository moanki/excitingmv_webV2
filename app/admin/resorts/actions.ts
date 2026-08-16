"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdminRole } from "@/lib/auth/require-admin";
import { generateResortSeoCopy, type ResortSeoGenerationInput } from "@/lib/services/resort-ai-service";
import { deleteResort, normalizePropertyType, publishDraftProperties, saveResort, seedSampleResorts, type PropertyType } from "@/lib/services/resort-service";
import { uploadSiteAsset } from "@/lib/storage/site-assets";
import type { PublishStatus } from "@/lib/types";
import {
  adminResortPayloadSchema,
  adminResortSubmitIntentSchema,
  normalizeSafeMediaUrl,
  resortSeoGenerationInputSchema
} from "@/lib/validations";

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
  revalidateTag("resorts-public", "max");
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

type AdminResortSubmitIntent = ReturnType<typeof adminResortSubmitIntentSchema.parse>;

function finalPublishingState(intent: AdminResortSubmitIntent, featuredValue: FormDataEntryValue | null): { status: PublishStatus; isFeaturedHomepage: boolean } {
  const isFeaturedHomepage = featuredValue === "on";

  if (intent === "publish" || intent === "updatePublished") {
    return { status: "published", isFeaturedHomepage };
  }

  if (intent === "archive") {
    return { status: "archived", isFeaturedHomepage };
  }

  return { status: "draft", isFeaturedHomepage };
}

function successMessage(intent: AdminResortSubmitIntent) {
  if (intent === "saveDraft") return "Draft saved";
  if (intent === "publish") return "Resort published";
  if (intent === "updatePublished") return "Published resort updated";
  if (intent === "unpublish") return "Resort unpublished to draft";
  if (intent === "archive") return "Resort archived";
  if (intent === "restoreDraft") return "Resort restored to draft";
  return `${name} saved`;
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

    if (photoUrl) {
      photoUrl = normalizeSafeMediaUrl(photoUrl);
    }

    if (!name && !description && !seoDescription && !photoUrl && !sizeLabel && !maxOccupancyValue && !bedType && !viewLabel && !amenities.length) {
      continue;
    }

    if (!name) {
      throw new Error(`Room ${index + 1} needs a room name before saving.`);
    }

    let maxOccupancy: number | null = null;
    if (maxOccupancyValue) {
      const parsedOccupancy = Number(maxOccupancyValue);
      if (!Number.isInteger(parsedOccupancy) || parsedOccupancy <= 0) {
        throw new Error(`Room ${index + 1} max occupancy must be a positive whole number.`);
      }
      maxOccupancy = parsedOccupancy;
    }

    rooms.push({
      name,
      description,
      seoDescription,
      photoUrl,
      sizeLabel,
      maxOccupancy,
      bedType,
      viewLabel,
      amenities
    });
  }

  return rooms;
}

async function parseCuratedMoments(formData: FormData) {
  const momentCount = Number(formData.get("curatedMomentCount") ?? 0);
  const moments = [];

  for (let index = 0; index < momentCount; index += 1) {
    const title = String(formData.get(`curatedMoment_${index}_title`) ?? "").trim();
    const description = String(formData.get(`curatedMoment_${index}_description`) ?? "").trim();
    const existingIconUrl = String(formData.get(`curatedMoment_${index}_iconUrl`) ?? "").trim();
    const iconFile = formData.get(`curatedMoment_${index}_iconFile`);
    let iconUrl = existingIconUrl;

    if (iconFile instanceof File && iconFile.size > 0) {
      try {
        iconUrl = await uploadSiteAsset(iconFile, "media-library/resorts/icons", "badge");
      } catch (error) {
        console.error("Curated moment icon upload failed", { filename: iconFile.name, title, error });
        throw new Error(
          `Curated moment icon failed for ${title || `item ${index + 1}`}: ${
            error instanceof Error ? error.message : "Icon could not be uploaded."
          }`
        );
      }
    }

    if (iconUrl) {
      iconUrl = normalizeSafeMediaUrl(iconUrl);
    }

    if (!title && !description && !iconUrl) {
      continue;
    }

    moments.push({
      title: title || "Curated moment",
      description,
      iconUrl
    });
  }

  return moments;
}

export async function saveResortAction(_: ActionState, formData: FormData) {
  try {
    await requireAdminRole(["super_admin", "admin", "content_manager"]);
    const name = String(formData.get("name") ?? "").trim();
    const propertyType = normalizePropertyType(formData.get("propertyType"));
    const submitIntent = adminResortSubmitIntentSchema.parse(String(formData.get("submitIntent") ?? "saveDraft"));
    const publishing = finalPublishingState(submitIntent, formData.get("isFeaturedHomepage"));
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
    uploadedHeroImage = normalizeSafeMediaUrl(uploadedHeroImage);

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
      .filter(Boolean)
      .map((item) => normalizeSafeMediaUrl(item));
    const roomTypes = await parseRoomTypes(formData);
    const curatedMoments = await parseCuratedMoments(formData);
    const submittedSlug = String(formData.get("slug") ?? "").trim();
    const normalizedSlug = slugify(submittedSlug || name);
    if (submittedSlug && submittedSlug !== normalizedSlug) {
      return { error: "Slug must be lowercase, URL-safe, and cannot contain spaces or unsafe characters." };
    }
    const parsedInput = adminResortPayloadSchema.safeParse({
      id: String(formData.get("id") ?? "").trim() || undefined,
      propertyType,
      submitIntent,
      slug: normalizedSlug,
      name,
      location: String(formData.get("location") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      transferType: String(formData.get("transferType") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      highlights: splitLines(String(formData.get("highlights") ?? "")),
      mealPlans: splitLines(String(formData.get("mealPlans") ?? "")),
      curatedMoments,
      seoTitle: String(formData.get("seoTitle") ?? name).trim(),
      seoDescription: String(formData.get("seoDescription") ?? "").trim(),
      seoSummary: String(formData.get("seoSummary") ?? "").trim(),
      heroImageUrl: uploadedHeroImage,
      galleryMediaUrls: [...galleryMediaUrls, ...uploadedGalleryImages],
      roomTypes,
      isFeaturedHomepage: publishing.isFeaturedHomepage
    });

    if (!parsedInput.success) {
      return { error: parsedInput.error.issues[0]?.message ?? "Check the resort form and try again." };
    }

    const input = {
      ...parsedInput.data,
      status: publishing.status,
      isFeaturedHomepage: publishing.isFeaturedHomepage
    };

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
    return { message: `${successMessage(submitIntent)}.${galleryMessage}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save property." };
  }
}

export async function deleteResortAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminRole(["super_admin", "admin", "content_manager"]);
    const id = String(formData.get("id") ?? "");
    const propertyType = normalizePropertyType(formData.get("propertyType"));
    if (!id) return { error: "Property ID is required." };
    await deleteResort(id);
    revalidateResortPaths(propertyType);
    return { message: "Property deleted successfully." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete property." };
  }
}

export async function publishSelectedDraftsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminRole(["super_admin", "admin", "content_manager"]);
    const propertyType = normalizePropertyType(formData.get("propertyType"));
    const ids = formData.getAll("ids").map((id) => String(id));

    if (!ids.length) {
      return { error: "Select at least one draft to publish." };
    }

    const result = await publishDraftProperties({ ids, propertyType });

    if (!result.count) {
      return { error: "No selected draft properties were available to publish." };
    }

    revalidateResortPaths(propertyType);
    return {
      message: `${result.count} draft ${result.count === 1 ? "property" : "properties"} published.`
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to publish selected drafts." };
  }
}

export async function seedResortsAction(_: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    await requireAdminRole(["super_admin"]);
    await seedSampleResorts();
    revalidateResortPaths();
    return { message: "Starter properties added successfully." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to seed starter properties." };
  }
}

export async function generateResortSeoAction(input: ResortSeoGenerationInput) {
  await requireAdminRole(["super_admin", "admin", "content_manager"]);
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
