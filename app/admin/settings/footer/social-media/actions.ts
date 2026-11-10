"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/components/admin/action-feedback";
import { defaultFooterSocialMedia, footerSocialMediaKey, footerSocialPlatforms } from "@/lib/footer-social-media";
import { saveSiteSettingDraft } from "@/lib/site-content";

export async function saveFooterSocialMediaAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const links = { ...defaultFooterSocialMedia };

  for (const { key, label } of footerSocialPlatforms) {
    const value = formData.get(key);
    const href = typeof value === "string" ? value.trim() : "";
    const url = URL.parse(href);

    if (typeof value !== "string" || (href && (
      href.length > 2048 || !url || !/^https?:\/\//i.test(href) || url.username || url.password
    ))) {
      return { error: `Enter a valid HTTP or HTTPS URL for ${label}.` };
    }

    links[key] = href;
  }

  try {
    const publish = formData.get("intent") === "publish";
    await saveSiteSettingDraft(footerSocialMediaKey, defaultFooterSocialMedia, links, publish);
    revalidatePath("/admin/settings/footer/social-media");
    if (publish) revalidatePath("/", "layout");
    return { message: publish ? "Social media links published." : "Social media draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save the social media links." };
  }
}
