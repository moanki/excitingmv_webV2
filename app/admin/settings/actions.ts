"use server";

import { revalidatePath } from "next/cache";

import {
  defaultHomepageAwardsContent,
  defaultHomepageCeoContent,
  defaultFooterContent,
  defaultHomepageGuide,
  defaultHeroContent,
  defaultHomepageFeatures,
  defaultHomepageNewsletterContent,
  defaultHomepageServices,
  defaultHomepageStats,
  defaultHomepageStoryContent,
  defaultHomepageWhyUs,
  defaultMarketSettings,
  defaultNavbarContent,
  defaultNotificationSettings,
  defaultWhatsAppSettings,
  publishSiteSetting,
  saveSiteSettingDraft,
  type FooterBadge,
  type FooterContent,
  type FooterLinkGroup,
  type HomepageAwardsContent,
  type HomepageCeoContent,
  type HomepageFeatureCard,
  type HomepageGuideItem,
  type HomepageHeroContent,
  type HomepageNewsletterContent,
  type HomepageServiceItem,
  type HomepageStat,
  type HomepageStoryContent,
  type HomepageWhyUsItem,
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
  return [0, 1, 2, 3].map((index) => ({
    name: String(formData.get(`${prefix}_${index}_name`) ?? ""),
    imageUrl: String(formData.get(`${prefix}_${index}_imageUrl`) ?? ""),
    href: String(formData.get(`${prefix}_${index}_href`) ?? ""),
    enabled: booleanValue(formData, `${prefix}_${index}_enabled`)
  }));
}

function parseFooterGroups(formData: FormData): FooterLinkGroup[] {
  return [0, 1, 2, 3].map((groupIndex) => ({
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

function parseHomepageAwards(formData: FormData): HomepageAwardsContent {
  return {
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    items: [0, 1, 2, 3].map((index) => ({
      name: String(formData.get(`award_${index}_name`) ?? ""),
      imageUrl: String(formData.get(`award_${index}_imageUrl`) ?? ""),
      href: String(formData.get(`award_${index}_href`) ?? ""),
      enabled: booleanValue(formData, `award_${index}_enabled`)
    }))
  };
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

export async function saveStatsDraftAction(_: ActionState, formData: FormData) {
  try {
    const stats: HomepageStat[] = [0, 1, 2, 3].map((index) => ({
      value: String(formData.get(`stat_${index}_value`) ?? ""),
      label: String(formData.get(`stat_${index}_label`) ?? "")
    }));
    await saveSiteSettingDraft("homepage.stats", defaultHomepageStats, stats);
    revalidateSiteContent();
    return { message: "Homepage stats draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save stats draft." };
  }
}

export async function publishStatsAction() {
  await publishSiteSetting("homepage.stats", defaultHomepageStats);
  revalidateSiteContent();
}

export async function saveCeoDraftAction(_: ActionState, formData: FormData) {
  try {
    const ceo: HomepageCeoContent = {
      sectionLabel: String(formData.get("sectionLabel") ?? ""),
      quote: String(formData.get("quote") ?? ""),
      message: String(formData.get("message") ?? ""),
      name: String(formData.get("name") ?? ""),
      title: String(formData.get("title") ?? ""),
      photoUrl: String(formData.get("photoUrl") ?? "")
    };
    await saveSiteSettingDraft("homepage.ceo", defaultHomepageCeoContent, ceo);
    revalidateSiteContent();
    return { message: "CEO section draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save CEO section." };
  }
}

export async function publishCeoAction() {
  await publishSiteSetting("homepage.ceo", defaultHomepageCeoContent);
  revalidateSiteContent();
}

export async function saveStoryDraftAction(_: ActionState, formData: FormData) {
  try {
    const story: HomepageStoryContent = {
      sectionLabel: String(formData.get("sectionLabel") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? "")
    };
    await saveSiteSettingDraft("homepage.story", defaultHomepageStoryContent, story);
    revalidateSiteContent();
    return { message: "Story section draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save story section." };
  }
}

export async function publishStoryAction() {
  await publishSiteSetting("homepage.story", defaultHomepageStoryContent);
  revalidateSiteContent();
}

export async function saveServicesDraftAction(_: ActionState, formData: FormData) {
  try {
    const services: HomepageServiceItem[] = [0, 1, 2, 3, 4, 5].map((index) => ({
      title: String(formData.get(`service_${index}_title`) ?? ""),
      enabled: booleanValue(formData, `service_${index}_enabled`)
    }));
    await saveSiteSettingDraft("homepage.services", defaultHomepageServices, services);
    revalidateSiteContent();
    return { message: "Services draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save services." };
  }
}

export async function publishServicesAction() {
  await publishSiteSetting("homepage.services", defaultHomepageServices);
  revalidateSiteContent();
}

export async function saveWhyUsDraftAction(_: ActionState, formData: FormData) {
  try {
    const items: HomepageWhyUsItem[] = [0, 1, 2].map((index) => ({
      title: String(formData.get(`item_${index}_title`) ?? ""),
      description: String(formData.get(`item_${index}_description`) ?? "")
    }));
    await saveSiteSettingDraft("homepage.whyus", defaultHomepageWhyUs, items);
    revalidateSiteContent();
    return { message: "Why Us draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save Why Us." };
  }
}

export async function publishWhyUsAction() {
  await publishSiteSetting("homepage.whyus", defaultHomepageWhyUs);
  revalidateSiteContent();
}

export async function saveGuideDraftAction(_: ActionState, formData: FormData) {
  try {
    const guide: HomepageGuideItem[] = [0, 1, 2, 3].map((index) => ({
      category: String(formData.get(`guide_${index}_category`) ?? ""),
      title: String(formData.get(`guide_${index}_title`) ?? ""),
      description: String(formData.get(`guide_${index}_description`) ?? ""),
      imageUrl: String(formData.get(`guide_${index}_imageUrl`) ?? "")
    }));
    await saveSiteSettingDraft("homepage.guide", defaultHomepageGuide, guide);
    revalidateSiteContent();
    return { message: "Travel guide draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save travel guide." };
  }
}

export async function publishGuideAction() {
  await publishSiteSetting("homepage.guide", defaultHomepageGuide);
  revalidateSiteContent();
}

export async function saveNewsletterContentDraftAction(_: ActionState, formData: FormData) {
  try {
    const newsletter: HomepageNewsletterContent = {
      sectionLabel: String(formData.get("sectionLabel") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? "")
    };
    await saveSiteSettingDraft("homepage.newsletter", defaultHomepageNewsletterContent, newsletter);
    revalidateSiteContent();
    return { message: "Newsletter section draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save newsletter section." };
  }
}

export async function publishNewsletterContentAction() {
  await publishSiteSetting("homepage.newsletter", defaultHomepageNewsletterContent);
  revalidateSiteContent();
}

export async function saveAwardsDraftAction(_: ActionState, formData: FormData) {
  try {
    const awards = parseHomepageAwards(formData);
    await saveSiteSettingDraft("homepage.awards", defaultHomepageAwardsContent, awards);
    revalidateSiteContent();
    return { message: "Awards draft saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save awards." };
  }
}

export async function publishAwardsAction() {
  await publishSiteSetting("homepage.awards", defaultHomepageAwardsContent);
  revalidateSiteContent();
}

export async function saveNavbarDraftAction(_: ActionState, formData: FormData) {
  try {
    const navbar: NavbarContent = {
      brandKicker: String(formData.get("brandKicker") ?? ""),
      brandLabel: String(formData.get("brandLabel") ?? ""),
      primaryLogoUrl: String(formData.get("primaryLogoUrl") ?? ""),
      whiteLogoUrl: String(formData.get("whiteLogoUrl") ?? ""),
      blackLogoUrl: String(formData.get("blackLogoUrl") ?? ""),
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
