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

export async function addHomepageFeaturedResortAction(formData: FormData) {
  const resortId = String(formData.get("resortId") ?? "").trim();

  if (!resortId) {
    return;
  }

  const { content } = await getHomepageFeaturedResortsSetting("draft");

  if (content.some((item) => item.resortId === resortId)) {
    return;
  }

  if (content.length >= 5) {
    return;
  }

  await saveFeaturedResorts([...content, { resortId, sortOrder: content.length + 1 }]);
}

export async function removeHomepageFeaturedResortAction(formData: FormData) {
  const resortId = String(formData.get("resortId") ?? "").trim();
  const { content } = await getHomepageFeaturedResortsSetting("draft");
  await saveFeaturedResorts(content.filter((item) => item.resortId !== resortId));
}

export async function moveHomepageFeaturedResortAction(formData: FormData) {
  const resortId = String(formData.get("resortId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "");
  const { content } = await getHomepageFeaturedResortsSetting("draft");
  const index = content.findIndex((item) => item.resortId === resortId);

  if (index === -1) {
    return;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= content.length) {
    return;
  }

  const next = [...content];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  await saveFeaturedResorts(next);
}
