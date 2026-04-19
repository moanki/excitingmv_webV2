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

export type FooterContent = {
  companyLabel: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  samoaUrl: string;
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

export const defaultFooterContent: FooterContent = {
  companyLabel: "Exciting Maldives",
  description:
    "Luxury resort partnerships, protected trade resources, and curated Maldives expertise.",
  contactEmail: "partners@excitingmv.com",
  contactPhone: "+960 000 0000",
  samoaUrl: "https://samoa.example.com"
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

export async function getHomepageHeroContent(mode: "draft" | "published" = "published") {
  const entry = await getSiteSetting("homepage.hero", defaultHeroContent);
  return {
    content: entry[mode],
    updatedAt: entry.updatedAt
  };
}

export async function getHomepageFeatures(mode: "draft" | "published" = "published") {
  const entry = await getSiteSetting("homepage.features", defaultHomepageFeatures);
  return {
    content: entry[mode],
    updatedAt: entry.updatedAt
  };
}

export async function getFooterContent(mode: "draft" | "published" = "published") {
  const entry = await getSiteSetting("site.footer", defaultFooterContent);
  return {
    content: entry[mode],
    updatedAt: entry.updatedAt
  };
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
