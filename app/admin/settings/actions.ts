"use server";

import { revalidatePath } from "next/cache";

import {
  defaultFooterContent,
  defaultHeroContent,
  defaultHomepageFeatures,
  publishSiteSetting,
  saveSiteSettingDraft,
  type FooterContent,
  type HomepageFeatureCard,
  type HomepageHeroContent
} from "@/lib/site-content";

function revalidateSiteContent() {
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}

export async function saveHeroDraftAction(_: { message?: string; error?: string } | undefined, formData: FormData) {
  try {
    const hero: HomepageHeroContent = {
      eyebrow: String(formData.get("eyebrow") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      primaryCtaLabel: String(formData.get("primaryCtaLabel") ?? ""),
      primaryCtaHref: String(formData.get("primaryCtaHref") ?? ""),
      secondaryCtaLabel: String(formData.get("secondaryCtaLabel") ?? ""),
      secondaryCtaHref: String(formData.get("secondaryCtaHref") ?? "")
    };

    await saveSiteSettingDraft("homepage.hero", defaultHeroContent, hero);
    revalidateSiteContent();
    return { message: "Hero draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save hero draft." };
  }
}

export async function publishHeroAction() {
  await publishSiteSetting("homepage.hero", defaultHeroContent);
  revalidateSiteContent();
}

export async function saveFeaturesDraftAction(
  _: { message?: string; error?: string } | undefined,
  formData: FormData
) {
  try {
    const features: HomepageFeatureCard[] = [0, 1, 2].map((index) => ({
      eyebrow: String(formData.get(`feature_${index}_eyebrow`) ?? ""),
      title: String(formData.get(`feature_${index}_title`) ?? ""),
      description: String(formData.get(`feature_${index}_description`) ?? "")
    }));

    await saveSiteSettingDraft("homepage.features", defaultHomepageFeatures, features);
    revalidateSiteContent();
    return { message: "Feature card draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save feature draft." };
  }
}

export async function publishFeaturesAction() {
  await publishSiteSetting("homepage.features", defaultHomepageFeatures);
  revalidateSiteContent();
}

export async function saveFooterDraftAction(
  _: { message?: string; error?: string } | undefined,
  formData: FormData
) {
  try {
    const footer: FooterContent = {
      companyLabel: String(formData.get("companyLabel") ?? ""),
      description: String(formData.get("description") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
      samoaUrl: String(formData.get("samoaUrl") ?? "")
    };

    await saveSiteSettingDraft("site.footer", defaultFooterContent, footer);
    revalidateSiteContent();
    return { message: "Footer draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save footer draft." };
  }
}

export async function publishFooterAction() {
  await publishSiteSetting("site.footer", defaultFooterContent);
  revalidateSiteContent();
}
