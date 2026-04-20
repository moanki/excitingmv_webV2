"use server";

import { revalidatePath } from "next/cache";

import {
  defaultFooterContent,
  defaultHeroContent,
  defaultHomepageFeatures,
  defaultMarketSettings,
  defaultNavbarContent,
  defaultNotificationSettings,
  defaultWhatsAppSettings,
  publishSiteSetting,
  saveSiteSettingDraft,
  type FooterBadge,
  type FooterContent,
  type FooterLinkGroup,
  type HomepageFeatureCard,
  type HomepageHeroContent,
  type MarketSettings,
  type NavbarContent,
  type NotificationSettings,
  type WhatsAppSettings
} from "@/lib/site-content";

type ActionState = { message?: string; error?: string } | undefined;

function revalidateSiteContent() {
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}

function booleanValue(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function parseFooterBadges(formData: FormData, prefix: "membership" | "award"): FooterBadge[] {
  return [0, 1, 2].map((index) => ({
    name: String(formData.get(`${prefix}_${index}_name`) ?? ""),
    href: String(formData.get(`${prefix}_${index}_href`) ?? ""),
    enabled: booleanValue(formData, `${prefix}_${index}_enabled`)
  }));
}

function parseFooterGroups(formData: FormData): FooterLinkGroup[] {
  return [0, 1, 2].map((groupIndex) => ({
    title: String(formData.get(`group_${groupIndex}_title`) ?? ""),
    enabled: booleanValue(formData, `group_${groupIndex}_enabled`),
    items: [0, 1, 2].map((itemIndex) => ({
      label: String(formData.get(`group_${groupIndex}_item_${itemIndex}_label`) ?? ""),
      href: String(formData.get(`group_${groupIndex}_item_${itemIndex}_href`) ?? ""),
      enabled: booleanValue(formData, `group_${groupIndex}_item_${itemIndex}_enabled`),
      external: booleanValue(formData, `group_${groupIndex}_item_${itemIndex}_external`)
    }))
  }));
}

export async function saveHeroDraftAction(_: ActionState, formData: FormData) {
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

export async function saveFeaturesDraftAction(_: ActionState, formData: FormData) {
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

export async function saveNavbarDraftAction(_: ActionState, formData: FormData) {
  try {
    const navbar: NavbarContent = {
      brandKicker: String(formData.get("brandKicker") ?? ""),
      brandLabel: String(formData.get("brandLabel") ?? ""),
      primaryLogoText: String(formData.get("primaryLogoText") ?? ""),
      whiteLogoText: String(formData.get("whiteLogoText") ?? ""),
      blackLogoText: String(formData.get("blackLogoText") ?? ""),
      navItems: [0, 1, 2, 3, 4, 5].map((index) => ({
        label: String(formData.get(`nav_${index}_label`) ?? ""),
        href: String(formData.get(`nav_${index}_href`) ?? ""),
        enabled: booleanValue(formData, `nav_${index}_enabled`),
        external: booleanValue(formData, `nav_${index}_external`)
      })),
      ctaLabel: String(formData.get("ctaLabel") ?? ""),
      ctaHref: String(formData.get("ctaHref") ?? ""),
      ctaEnabled: booleanValue(formData, "ctaEnabled")
    };

    await saveSiteSettingDraft("site.navbar", defaultNavbarContent, navbar);
    revalidateSiteContent();
    return { message: "Navbar draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save navbar draft." };
  }
}

export async function publishNavbarAction() {
  await publishSiteSetting("site.navbar", defaultNavbarContent);
  revalidateSiteContent();
}

export async function saveFooterDraftAction(_: ActionState, formData: FormData) {
  try {
    const footer: FooterContent = {
      companyLabel: String(formData.get("companyLabel") ?? ""),
      description: String(formData.get("description") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
      address: String(formData.get("address") ?? ""),
      samoaUrl: String(formData.get("samoaUrl") ?? ""),
      linkGroups: parseFooterGroups(formData),
      memberships: parseFooterBadges(formData, "membership"),
      awards: parseFooterBadges(formData, "award")
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

export async function saveWhatsAppDraftAction(_: ActionState, formData: FormData) {
  try {
    const whatsApp: WhatsAppSettings = {
      enabled: booleanValue(formData, "enabled"),
      label: String(formData.get("label") ?? ""),
      number: String(formData.get("number") ?? ""),
      link: String(formData.get("link") ?? ""),
      presetMessage: String(formData.get("presetMessage") ?? "")
    };

    await saveSiteSettingDraft("site.whatsapp", defaultWhatsAppSettings, whatsApp);
    revalidateSiteContent();
    return { message: "WhatsApp draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save WhatsApp draft." };
  }
}

export async function publishWhatsAppAction() {
  await publishSiteSetting("site.whatsapp", defaultWhatsAppSettings);
  revalidateSiteContent();
}

export async function saveNotificationDraftAction(_: ActionState, formData: FormData) {
  try {
    const notifications: NotificationSettings = {
      partnerRequestEmail: String(formData.get("partnerRequestEmail") ?? ""),
      newsletterEmail: String(formData.get("newsletterEmail") ?? ""),
      businessContactEmail: String(formData.get("businessContactEmail") ?? "")
    };

    await saveSiteSettingDraft("site.notifications", defaultNotificationSettings, notifications);
    revalidateSiteContent();
    return { message: "Notification draft saved." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to save notification settings."
    };
  }
}

export async function publishNotificationAction() {
  await publishSiteSetting("site.notifications", defaultNotificationSettings);
  revalidateSiteContent();
}

export async function saveMarketDraftAction(_: ActionState, formData: FormData) {
  try {
    const markets: MarketSettings = {
      sectionTitle: String(formData.get("sectionTitle") ?? ""),
      options: [0, 1, 2, 3, 4, 5].map((index) => ({
        label: String(formData.get(`market_${index}_label`) ?? ""),
        enabled: booleanValue(formData, `market_${index}_enabled`)
      }))
    };

    await saveSiteSettingDraft("site.markets", defaultMarketSettings, markets);
    revalidateSiteContent();
    return { message: "Primary markets draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save primary markets." };
  }
}

export async function publishMarketAction() {
  await publishSiteSetting("site.markets", defaultMarketSettings);
  revalidateSiteContent();
}
