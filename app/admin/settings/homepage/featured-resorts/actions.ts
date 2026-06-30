"use server";

import { revalidatePath, revalidateTag, updateTag } from "next/cache";

import {
  defaultHomepageFeaturedResorts,
  getHomepageFeaturedResortsSetting,
  publishSiteSetting,
  saveSiteSettingDraft,
  type HomepageFeaturedResortItem
} from "@/lib/site-content";

function normalizeItems(items: HomepageFeaturedResortItem[]) {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (!item.resortId || seen.has(item.resortId)) {
        return false;
      }
      seen.add(item.resortId);
      return true;
    })
    .slice(0, 5)
    .map((item, index) => ({
      resortId: item.resortId,
      sortOrder: index + 1
    }));
}

async function saveFeaturedResorts(items: HomepageFeaturedResortItem[]) {
  const normalized = normalizeItems(items);
  await saveSiteSettingDraft("homepage.featuredResorts", defaultHomepageFeaturedResorts, normalized);
  await publishSiteSetting("homepage.featuredResorts", defaultHomepageFeaturedResorts);
  revalidatePath("/");
  revalidatePath("/admin/settings/homepage/features");
  revalidatePath("/admin/settings/homepage/featured-resorts");
  revalidateTag("resorts-public", "max");
  updateTag("resorts-public");
}

type FeaturedActionState = { message?: string; error?: string } | undefined;

async function updateFeatured(
  formData: FormData,
  update: (items: HomepageFeaturedResortItem[], resortId: string) => HomepageFeaturedResortItem[],
  message: string
): Promise<FeaturedActionState> {
  try {
    const resortId = String(formData.get("resortId") ?? "").trim();
    if (!resortId) return { error: "Choose a resort." };
    const { content } = await getHomepageFeaturedResortsSetting("draft");
    await saveFeaturedResorts(update(content, resortId));
    return { message };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update featured retreats." };
  }
}

export async function addHomepageFeaturedResortAction(_: FeaturedActionState, formData: FormData) {
  return updateFeatured(formData, (content, resortId) => {
    if (content.some((item) => item.resortId === resortId) || content.length >= 5) return content;
    return [...content, { resortId, sortOrder: content.length + 1 }];
  }, "Retreat added successfully.");
}

export async function removeHomepageFeaturedResortAction(_: FeaturedActionState, formData: FormData) {
  return updateFeatured(formData, (content, resortId) => content.filter((item) => item.resortId !== resortId), "Retreat removed successfully.");
}

export async function moveHomepageFeaturedResortAction(_: FeaturedActionState, formData: FormData): Promise<FeaturedActionState> {
  const resortId = String(formData.get("resortId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "");
  return updateFeatured(formData, (content) => {
    const index = content.findIndex((item) => item.resortId === resortId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || targetIndex < 0 || targetIndex >= content.length) return content;
    const next = [...content];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    return next;
  }, "Display order updated.");
}
