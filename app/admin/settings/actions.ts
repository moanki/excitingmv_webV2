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
import { uploadSiteAsset } from "@/lib/storage/site-assets";

type ActionState = { message?: string; error?: string } | undefined;

function revalidateSiteContent() {
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}

function booleanValue(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function stringValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function uploadedFile(formData: FormData, name: string) {
  const file = formData.get(name);
  if (file instanceof File && file.size > 0) {
    return file;
  }

  return null;
}

async function parseFooterBadges(formData: FormData, prefix: "membership" | "award"): Promise<FooterBadge[]> {
  return Promise.all(
    [0, 1, 2, 3].map(async (index) => {
      const imageFile = uploadedFile(formData, `${prefix}_${index}_imageFile`);

      return {
        name: stringValue(formData, `${prefix}_${index}_name`),
        imageUrl: imageFile
          ? await uploadSiteAsset(imageFile, `site/${prefix}`)
          : stringValue(formData, `${prefix}_${index}_imageUrl`),
        href: stringValue(formData, `${prefix}_${index}_href`),
        enabled: booleanValue(formData, `${prefix}_${index}_enabled`)
      };
    })
  );
}

function parseFooterGroups(formData: FormData): FooterLinkGroup[] {
  return [0, 1, 2, 3].map((groupIndex) => ({
    title: stringValue(formData, `group_${groupIndex}_title`),
    enabled: booleanValue(formData, `group_${groupIndex}_enabled`),
    items: [0, 1, 2].map((itemIndex) => ({
      label: stringValue(formData, `group_${groupIndex}_item_${itemIndex}_label`),
      href: stringValue(formData, `group_${groupIndex}_item_${itemIndex}_href`),
      enabled: booleanValue(formData, `group_${groupIndex}_item_${itemIndex}_enabled`),
      external: booleanValue(formData, `group_${groupIndex}_item_${itemIndex}_external`)
    }))
  }));
}

async function parseHomepageAwards(formData: FormData): Promise<HomepageAwardsContent> {
  return {
    title: stringValue(formData, "title"),
    summary: stringValue(formData, "summary"),
    items: await Promise.all(
      [0, 1, 2, 3].map(async (index) => {
        const imageFile = uploadedFile(formData, `award_${index}_imageFile`);

        return {
          name: stringValue(formData, `award_${index}_name`),
          imageUrl: imageFile
            ? await uploadSiteAsset(imageFile, "homepage/awards")
            : stringValue(formData, `award_${index}_imageUrl`),
          href: stringValue(formData, `award_${index}_href`),
          enabled: booleanValue(formData, `award_${index}_enabled`)
        };
      })
    )
  };
}

export async function saveHeroDraftAction(_: ActionState, formData: FormData) {
  try {
    const heroMediaFile = uploadedFile(formData, "heroMediaFile");
    const heroPosterFile = uploadedFile(formData, "heroPosterFile");
    const hero: HomepageHeroContent = {
      eyebrow: stringValue(formData, "eyebrow"),
      title: stringValue(formData, "title"),
      description: stringValue(formData, "description"),
      primaryCtaLabel: stringValue(formData, "primaryCtaLabel"),
      primaryCtaHref: stringValue(formData, "primaryCtaHref"),
      secondaryCtaLabel: stringValue(formData, "secondaryCtaLabel"),
      secondaryCtaHref: stringValue(formData, "secondaryCtaHref"),
      mediaUrl: heroMediaFile
        ? await uploadSiteAsset(heroMediaFile, "homepage/hero")
        : stringValue(formData, "mediaUrl"),
      mediaType: stringValue(formData, "mediaType") === "video" ? "video" : "image",
      mediaPosterUrl: heroPosterFile
        ? await uploadSiteAsset(heroPosterFile, "homepage/hero")
        : stringValue(formData, "mediaPosterUrl")
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
    const features: HomepageFeatureCard[] = await Promise.all(
      [0, 1, 2].map(async (index) => {
        const imageFile = uploadedFile(formData, `feature_${index}_imageFile`);

        return {
          eyebrow: stringValue(formData, `feature_${index}_eyebrow`),
          title: stringValue(formData, `feature_${index}_title`),
          description: stringValue(formData, `feature_${index}_description`),
          imageUrl: imageFile
            ? await uploadSiteAsset(imageFile, "homepage/features")
            : stringValue(formData, `feature_${index}_imageUrl`)
        };
      })
    );

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
      value: stringValue(formData, `stat_${index}_value`),
      label: stringValue(formData, `stat_${index}_label`)
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
    const photoFile = uploadedFile(formData, "photoFile");
    const ceo: HomepageCeoContent = {
      sectionLabel: stringValue(formData, "sectionLabel"),
      quote: stringValue(formData, "quote"),
      message: stringValue(formData, "message"),
      name: stringValue(formData, "name"),
      title: stringValue(formData, "title"),
      photoUrl: photoFile
        ? await uploadSiteAsset(photoFile, "homepage/ceo")
        : stringValue(formData, "photoUrl")
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
    const imageFile = uploadedFile(formData, "storyImageFile");
    const story: HomepageStoryContent = {
      sectionLabel: stringValue(formData, "sectionLabel"),
      title: stringValue(formData, "title"),
      description: stringValue(formData, "description"),
      imageUrl: imageFile
        ? await uploadSiteAsset(imageFile, "homepage/story")
        : stringValue(formData, "imageUrl")
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
      title: stringValue(formData, `service_${index}_title`),
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
      title: stringValue(formData, `item_${index}_title`),
      description: stringValue(formData, `item_${index}_description`)
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
    const guide: HomepageGuideItem[] = await Promise.all(
      [0, 1, 2, 3].map(async (index) => {
        const imageFile = uploadedFile(formData, `guide_${index}_imageFile`);

        return {
          category: stringValue(formData, `guide_${index}_category`),
          title: stringValue(formData, `guide_${index}_title`),
          description: stringValue(formData, `guide_${index}_description`),
          imageUrl: imageFile
            ? await uploadSiteAsset(imageFile, "homepage/guide")
            : stringValue(formData, `guide_${index}_imageUrl`)
        };
      })
    );
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
    const imageFile = uploadedFile(formData, "newsletterImageFile");
    const newsletter: HomepageNewsletterContent = {
      sectionLabel: stringValue(formData, "sectionLabel"),
      title: stringValue(formData, "title"),
      description: stringValue(formData, "description"),
      imageUrl: imageFile
        ? await uploadSiteAsset(imageFile, "homepage/newsletter")
        : stringValue(formData, "imageUrl")
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
    const awards = await parseHomepageAwards(formData);
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
    const primaryLogoFile = uploadedFile(formData, "primaryLogoFile");
    const whiteLogoFile = uploadedFile(formData, "whiteLogoFile");
    const blackLogoFile = uploadedFile(formData, "blackLogoFile");

    const navbar: NavbarContent = {
      brandKicker: stringValue(formData, "brandKicker"),
      brandLabel: stringValue(formData, "brandLabel"),
      primaryLogoUrl: primaryLogoFile
        ? await uploadSiteAsset(primaryLogoFile, "site/logos")
        : stringValue(formData, "primaryLogoUrl"),
      whiteLogoUrl: whiteLogoFile
        ? await uploadSiteAsset(whiteLogoFile, "site/logos")
        : stringValue(formData, "whiteLogoUrl"),
      blackLogoUrl: blackLogoFile
        ? await uploadSiteAsset(blackLogoFile, "site/logos")
        : stringValue(formData, "blackLogoUrl"),
      navItems: [0, 1, 2, 3, 4, 5].map((index) => ({
        label: stringValue(formData, `nav_${index}_label`),
        href: stringValue(formData, `nav_${index}_href`),
        enabled: booleanValue(formData, `nav_${index}_enabled`),
        external: booleanValue(formData, `nav_${index}_external`)
      })),
      ctaLabel: stringValue(formData, "ctaLabel"),
      ctaHref: stringValue(formData, "ctaHref"),
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
    const companyLogoFile = uploadedFile(formData, "companyLogoFile");
    const footer: FooterContent = {
      companyLabel: stringValue(formData, "companyLabel"),
      description: stringValue(formData, "description"),
      contactEmail: stringValue(formData, "contactEmail"),
      contactPhone: stringValue(formData, "contactPhone"),
      address: stringValue(formData, "address"),
      samoaUrl: stringValue(formData, "samoaUrl"),
      companyLogoUrl: companyLogoFile
        ? await uploadSiteAsset(companyLogoFile, "site/footer")
        : stringValue(formData, "companyLogoUrl"),
      linkGroups: parseFooterGroups(formData),
      memberships: await parseFooterBadges(formData, "membership"),
      awards: await parseFooterBadges(formData, "award")
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
      label: stringValue(formData, "label"),
      number: stringValue(formData, "number"),
      link: stringValue(formData, "link"),
      presetMessage: stringValue(formData, "presetMessage")
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
      partnerRequestEmail: stringValue(formData, "partnerRequestEmail"),
      newsletterEmail: stringValue(formData, "newsletterEmail"),
      businessContactEmail: stringValue(formData, "businessContactEmail")
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
      sectionTitle: stringValue(formData, "sectionTitle"),
      options: [0, 1, 2, 3, 4, 5].map((index) => ({
        label: stringValue(formData, `market_${index}_label`),
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
