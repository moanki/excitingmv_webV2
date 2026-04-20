import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type HomepageHeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export type HomepageFeatureCard = {
  eyebrow: string;
  title: string;
  description: string;
};

export type NavigationItem = {
  label: string;
  href: string;
  enabled: boolean;
  external: boolean;
};

export type NavbarContent = {
  brandKicker: string;
  brandLabel: string;
  primaryLogoText: string;
  whiteLogoText: string;
  blackLogoText: string;
  navItems: NavigationItem[];
  ctaLabel: string;
  ctaHref: string;
  ctaEnabled: boolean;
};

export type FooterLinkItem = {
  label: string;
  href: string;
  enabled: boolean;
  external: boolean;
};

export type FooterLinkGroup = {
  title: string;
  enabled: boolean;
  items: FooterLinkItem[];
};

export type FooterBadge = {
  name: string;
  href: string;
  enabled: boolean;
};

export type FooterContent = {
  companyLabel: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  samoaUrl: string;
  linkGroups: FooterLinkGroup[];
  memberships: FooterBadge[];
  awards: FooterBadge[];
};

export type WhatsAppSettings = {
  enabled: boolean;
  label: string;
  number: string;
  link: string;
  presetMessage: string;
};

export type NotificationSettings = {
  partnerRequestEmail: string;
  newsletterEmail: string;
  businessContactEmail: string;
};

export type MarketOption = {
  label: string;
  enabled: boolean;
};

export type MarketSettings = {
  sectionTitle: string;
  options: MarketOption[];
};

type SiteSettingEnvelope<T> = {
  draft: T;
  published: T;
  updatedAt: string;
};

export const defaultHeroContent: HomepageHeroContent = {
  eyebrow: "Corporate B2B Maldives Platform",
  title: "The luxury-facing partner portal for curated Maldives sales.",
  description:
    "Built for destination partners, contracting teams, and internal operators who need premium resort presentation, protected trade resources, live support, and clean admin workflows from one polished platform.",
  primaryCtaLabel: "Partner With Us",
  primaryCtaHref: "/partner/register",
  secondaryCtaLabel: "Admin Center",
  secondaryCtaHref: "/admin/login"
};

export const defaultHomepageFeatures: HomepageFeatureCard[] = [
  {
    eyebrow: "Protected Access",
    title: "Partner approvals backed by roles and RLS.",
    description:
      "Approved partners access protected resort files, rates, and trade resources from one secure portal."
  },
  {
    eyebrow: "Live Support",
    title: "Realtime chat for sales and contracting questions.",
    description:
      "Supabase Realtime powers direct communication between partners and the internal sales team."
  },
  {
    eyebrow: "Admin AI",
    title: "OpenAI restricted to import review and SEO drafting.",
    description:
      "AI helps the admin team accelerate data extraction and summary generation without auto-publishing."
  }
];

export const defaultNavbarContent: NavbarContent = {
  brandKicker: "Luxury Travel Network",
  brandLabel: "Exciting Maldives",
  primaryLogoText: "Exciting Maldives",
  whiteLogoText: "Exciting Maldives",
  blackLogoText: "Exciting Maldives",
  navItems: [
    { label: "About", href: "/about", enabled: true, external: false },
    { label: "Contact", href: "/contact", enabled: true, external: false },
    { label: "Resorts", href: "/resorts", enabled: true, external: false },
    { label: "Partner Login", href: "/partner/login", enabled: true, external: false },
    { label: "Admin Center", href: "/admin/login", enabled: true, external: false }
  ],
  ctaLabel: "Become a Partner",
  ctaHref: "/partner/register",
  ctaEnabled: true
};

export const defaultFooterContent: FooterContent = {
  companyLabel: "Exciting Maldives",
  description:
    "Luxury resort partnerships, protected trade resources, and curated Maldives expertise.",
  contactEmail: "partners@excitingmv.com",
  contactPhone: "+960 000 0000",
  address: "Male, Maldives",
  samoaUrl: "https://samoa.example.com",
  linkGroups: [
    {
      title: "Destinations",
      enabled: true,
      items: [
        { label: "Resorts", href: "/resorts", enabled: true, external: false },
        { label: "City Hotels", href: "/city-hotels", enabled: true, external: false },
        { label: "Liveaboards", href: "/liveaboards", enabled: true, external: false }
      ]
    },
    {
      title: "Company",
      enabled: true,
      items: [
        { label: "About Us", href: "/about", enabled: true, external: false },
        { label: "Contact", href: "/contact", enabled: true, external: false },
        { label: "Admin Center", href: "/admin/login", enabled: true, external: false }
      ]
    },
    {
      title: "Resources",
      enabled: true,
      items: [
        { label: "Travel Guide", href: "/travel-guide", enabled: true, external: false },
        { label: "Partner Login", href: "/partner/login", enabled: true, external: false },
        { label: "Samoa", href: "https://samoa.example.com", enabled: true, external: true }
      ]
    }
  ],
  memberships: [
    { name: "Preferred DMC Network", href: "", enabled: true },
    { name: "Luxury Trade Collective", href: "", enabled: true }
  ],
  awards: [
    { name: "Indian Ocean Partner Excellence", href: "", enabled: true },
    { name: "Premier Maldives Sales Partner", href: "", enabled: true }
  ]
};

export const defaultWhatsAppSettings: WhatsAppSettings = {
  enabled: true,
  label: "Chat on WhatsApp",
  number: "+9600000000",
  link: "https://wa.me/9600000000",
  presetMessage: "Hello Exciting Maldives, we would like partner support."
};

export const defaultNotificationSettings: NotificationSettings = {
  partnerRequestEmail: "hello@excitingmv.com",
  newsletterEmail: "hello@excitingmv.com",
  businessContactEmail: "partners@excitingmv.com"
};

export const defaultMarketSettings: MarketSettings = {
  sectionTitle: "Primary Markets",
  options: [
    { label: "Russia & CIS", enabled: true },
    { label: "Europe", enabled: true },
    { label: "Middle East (UAE & GCC)", enabled: true },
    { label: "South Asia", enabled: true }
  ]
};

async function getSiteSetting<T>(key: string, fallback: T): Promise<SiteSettingEnvelope<T>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();

    if (error || !data?.value) {
      return {
        draft: fallback,
        published: fallback,
        updatedAt: new Date(0).toISOString()
      };
    }

    const value = data.value as Partial<SiteSettingEnvelope<T>>;

    return {
      draft: (value.draft ?? fallback) as T,
      published: (value.published ?? fallback) as T,
      updatedAt: value.updatedAt ?? new Date(0).toISOString()
    };
  } catch {
    return {
      draft: fallback,
      published: fallback,
      updatedAt: new Date(0).toISOString()
    };
  }
}

async function getSiteSettingMode<T>(key: string, fallback: T, mode: "draft" | "published") {
  const entry = await getSiteSetting(key, fallback);
  return {
    content: entry[mode],
    updatedAt: entry.updatedAt
  };
}

export async function getHomepageHeroContent(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.hero", defaultHeroContent, mode);
}

export async function getHomepageFeatures(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.features", defaultHomepageFeatures, mode);
}

export async function getNavbarContent(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("site.navbar", defaultNavbarContent, mode);
}

export async function getFooterContent(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("site.footer", defaultFooterContent, mode);
}

export async function getWhatsAppSettings(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("site.whatsapp", defaultWhatsAppSettings, mode);
}

export async function getNotificationSettings(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("site.notifications", defaultNotificationSettings, mode);
}

export async function getMarketSettings(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("site.markets", defaultMarketSettings, mode);
}

export async function saveSiteSettingDraft<T>(key: string, fallback: T, draftValue: T) {
  const supabase = createSupabaseAdminClient();
  const existing = await getSiteSetting<T>(key, fallback);
  const value: SiteSettingEnvelope<T> = {
    draft: draftValue,
    published: existing.published,
    updatedAt: new Date().toISOString()
  };

  const { error } = await supabase.from("site_settings").upsert({
    key,
    value
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function publishSiteSetting<T>(key: string, fallback: T) {
  const supabase = createSupabaseAdminClient();
  const existing = await getSiteSetting<T>(key, fallback);
  const value: SiteSettingEnvelope<T> = {
    draft: existing.draft,
    published: existing.draft,
    updatedAt: new Date().toISOString()
  };

  const { error } = await supabase.from("site_settings").upsert({
    key,
    value
  });

  if (error) {
    throw new Error(error.message);
  }
}
