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

function shouldPublish(formData: FormData) {
  return stringValue(formData, "intent") === "publish";
}

async function finalizeSettingSave<T>({
  formData,
  key,
  fallback,
  value,
  draftMessage,
  publishedMessage
}: {
  formData: FormData;
  key: string;
  fallback: T;
  value: T;
  draftMessage: string;
  publishedMessage: string;
}) {
  await saveSiteSettingDraft(key, fallback, value);

  if (shouldPublish(formData)) {
    await publishSiteSetting(key, fallback);
    revalidateSiteContent();
    return { message: publishedMessage };
  }

  revalidateSiteContent();
  return { message: draftMessage };
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

export async function saveHeroDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
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

    return finalizeSettingSave({
      formData,
      key: "homepage.hero",
      fallback: defaultHeroContent,
      value: hero,
      draftMessage: "Hero draft saved.",
      publishedMessage: "Hero published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save hero draft." };
  }
}

export async function publishHeroAction() {
  await publishSiteSetting("homepage.hero", defaultHeroContent);
  revalidateSiteContent();
}

export async function saveFeaturesDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
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

    return finalizeSettingSave({
      formData,
      key: "homepage.features",
      fallback: defaultHomepageFeatures,
      value: features,
      draftMessage: "Feature card draft saved.",
      publishedMessage: "Features published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save feature draft." };
  }
}

export async function publishFeaturesAction() {
  await publishSiteSetting("homepage.features", defaultHomepageFeatures);
  revalidateSiteContent();
}

export async function saveStatsDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const stats: HomepageStat[] = [0, 1, 2, 3].map((index) => ({
      value: stringValue(formData, `stat_${index}_value`),
      label: stringValue(formData, `stat_${index}_label`)
    }));
    return finalizeSettingSave({
      formData,
      key: "homepage.stats",
      fallback: defaultHomepageStats,
      value: stats,
      draftMessage: "Homepage stats draft saved.",
      publishedMessage: "Homepage stats published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save stats draft." };
  }
}

export async function publishStatsAction() {
  await publishSiteSetting("homepage.stats", defaultHomepageStats);
  revalidateSiteContent();
}

export async function saveCeoDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
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
    return finalizeSettingSave({
      formData,
      key: "homepage.ceo",
      fallback: defaultHomepageCeoContent,
      value: ceo,
      draftMessage: "CEO section draft saved.",
      publishedMessage: "CEO section published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save CEO section." };
  }
}

export async function publishCeoAction() {
  await publishSiteSetting("homepage.ceo", defaultHomepageCeoContent);
  revalidateSiteContent();
}

export async function saveStoryDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
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
    return finalizeSettingSave({
      formData,
      key: "homepage.story",
      fallback: defaultHomepageStoryContent,
      value: story,
      draftMessage: "Story section draft saved.",
      publishedMessage: "Story section published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save story section." };
  }
}

export async function publishStoryAction() {
  await publishSiteSetting("homepage.story", defaultHomepageStoryContent);
  revalidateSiteContent();
}

export async function saveServicesDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const services: HomepageServiceItem[] = [0, 1, 2, 3, 4, 5].map((index) => ({
      title: stringValue(formData, `service_${index}_title`),
      enabled: booleanValue(formData, `service_${index}_enabled`)
    }));
    return finalizeSettingSave({
      formData,
      key: "homepage.services",
      fallback: defaultHomepageServices,
      value: services,
      draftMessage: "Services draft saved.",
      publishedMessage: "Services published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save services." };
  }
}

export async function publishServicesAction() {
  await publishSiteSetting("homepage.services", defaultHomepageServices);
  revalidateSiteContent();
}

export async function saveWhyUsDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const items: HomepageWhyUsItem[] = [0, 1, 2].map((index) => ({
      title: stringValue(formData, `item_${index}_title`),
      description: stringValue(formData, `item_${index}_description`)
    }));
    return finalizeSettingSave({
      formData,
      key: "homepage.whyus",
      fallback: defaultHomepageWhyUs,
      value: items,
      draftMessage: "Why Us draft saved.",
      publishedMessage: "Why Us published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save Why Us." };
  }
}

export async function publishWhyUsAction() {
  await publishSiteSetting("homepage.whyus", defaultHomepageWhyUs);
  revalidateSiteContent();
}

export async function saveGuideDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
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
    return finalizeSettingSave({
      formData,
      key: "homepage.guide",
      fallback: defaultHomepageGuide,
      value: guide,
      draftMessage: "Travel guide draft saved.",
      publishedMessage: "Travel guide published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save travel guide." };
  }
}

export async function publishGuideAction() {
  await publishSiteSetting("homepage.guide", defaultHomepageGuide);
  revalidateSiteContent();
}

export async function saveNewsletterContentDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
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
    return finalizeSettingSave({
      formData,
      key: "homepage.newsletter",
      fallback: defaultHomepageNewsletterContent,
      value: newsletter,
      draftMessage: "Newsletter section draft saved.",
      publishedMessage: "Newsletter section published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save newsletter section." };
  }
}

export async function publishNewsletterContentAction() {
  await publishSiteSetting("homepage.newsletter", defaultHomepageNewsletterContent);
  revalidateSiteContent();
}

export async function saveAwardsDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const awards = await parseHomepageAwards(formData);
    return finalizeSettingSave({
      formData,
      key: "homepage.awards",
      fallback: defaultHomepageAwardsContent,
      value: awards,
      draftMessage: "Awards draft saved.",
      publishedMessage: "Awards published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save awards." };
  }
}

export async function publishAwardsAction() {
  await publishSiteSetting("homepage.awards", defaultHomepageAwardsContent);
  revalidateSiteContent();
}

export async function saveNavbarDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
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

    return finalizeSettingSave({
      formData,
      key: "site.navbar",
      fallback: defaultNavbarContent,
      value: navbar,
      draftMessage: "Navbar draft saved.",
      publishedMessage: "Navbar published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save navbar draft." };
  }
}

export async function publishNavbarAction() {
  await publishSiteSetting("site.navbar", defaultNavbarContent);
  revalidateSiteContent();
}

export async function saveFooterDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
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

    return finalizeSettingSave({
      formData,
      key: "site.footer",
      fallback: defaultFooterContent,
      value: footer,
      draftMessage: "Footer draft saved.",
      publishedMessage: "Footer published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save footer draft." };
  }
}

export async function publishFooterAction() {
  await publishSiteSetting("site.footer", defaultFooterContent);
  revalidateSiteContent();
}

export async function saveWhatsAppDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const whatsApp: WhatsAppSettings = {
      enabled: booleanValue(formData, "enabled"),
      label: stringValue(formData, "label"),
      number: stringValue(formData, "number"),
      link: stringValue(formData, "link"),
      presetMessage: stringValue(formData, "presetMessage")
    };

    return finalizeSettingSave({
      formData,
      key: "site.whatsapp",
      fallback: defaultWhatsAppSettings,
      value: whatsApp,
      draftMessage: "WhatsApp draft saved.",
      publishedMessage: "WhatsApp published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save WhatsApp draft." };
  }
}

export async function publishWhatsAppAction() {
  await publishSiteSetting("site.whatsapp", defaultWhatsAppSettings);
  revalidateSiteContent();
}

export async function saveNotificationDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const notifications: NotificationSettings = {
      partnerRequestEmail: stringValue(formData, "partnerRequestEmail"),
      newsletterEmail: stringValue(formData, "newsletterEmail"),
      businessContactEmail: stringValue(formData, "businessContactEmail")
    };

    return finalizeSettingSave({
      formData,
      key: "site.notifications",
      fallback: defaultNotificationSettings,
      value: notifications,
      draftMessage: "Notification draft saved.",
      publishedMessage: "Notifications published."
    });
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

export async function saveMarketDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const markets: MarketSettings = {
      sectionTitle: stringValue(formData, "sectionTitle"),
      options: [0, 1, 2, 3, 4, 5].map((index) => ({
        label: stringValue(formData, `market_${index}_label`),
        enabled: booleanValue(formData, `market_${index}_enabled`)
      }))
    };

    return finalizeSettingSave({
      formData,
      key: "site.markets",
      fallback: defaultMarketSettings,
      value: markets,
      draftMessage: "Primary markets draft saved.",
      publishedMessage: "Primary markets published."
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save primary markets." };
  }
}

export async function publishMarketAction() {
  await publishSiteSetting("site.markets", defaultMarketSettings);
  revalidateSiteContent();
}
