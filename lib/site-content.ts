import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type HomepageHeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  mediaPosterUrl: string;
};

export type HomepageFeatureCard = {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type HomepageStat = {
  value: string;
  label: string;
};

export type HomepageCeoContent = {
  sectionLabel: string;
  quote: string;
  message: string;
  name: string;
  title: string;
  photoUrl: string;
};

export type HomepageStoryContent = {
  sectionLabel: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type HomepageServiceItem = {
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  imageAlt: string;
  displayOrder: number;
  enabled: boolean;
};

export type HomepageWhyUsItem = {
  title: string;
  description: string;
};

export type HomepageGuideItem = {
  slug: string;
  category: string;
  title: string;
  featuredImageAlt: string;
  summary: string;
  description: string;
  imageUrl: string;
  mainContent: string;
  tips: string[];
  sections: Array<{ heading: string; body: string }>;
  faq: Array<{ question: string; answer: string }>;
  seoTitle: string;
  seoDescription: string;
  relatedSlugs: string[];
  published: boolean;
  lastUpdated: string;
};

export type HomepageNewsletterContent = {
  sectionLabel: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type HomepageAwardsContent = {
  title: string;
  summary: string;
  items: FooterBadge[];
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
  primaryLogoUrl: string;
  whiteLogoUrl: string;
  blackLogoUrl: string;
  featuredResortLogos?: FooterBadge[];
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
  imageUrl: string;
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
  companyLogoUrl: string;
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
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  region: string;
  displayOrder: number;
  enabled: boolean;
};

export type MarketSettings = {
  sectionTitle: string;
  heading: string;
  description: string;
  options: MarketOption[];
};

type SiteSettingEnvelope<T> = {
  draft: T;
  published: T;
  updatedAt: string;
};

export const defaultHeroContent: HomepageHeroContent = {
  eyebrow: "",
  title: "Curated Maldives partnerships for the world's leading travel professionals.",
  description:
    "Built for destination partners, contracting teams, and internal operators who need premium resort presentation, protected trade resources, live support, and clean admin workflows from one polished platform.",
  primaryCtaLabel: "Partner With Us",
  primaryCtaHref: "/partner/register",
  secondaryCtaLabel: "",
  secondaryCtaHref: "",
  mediaUrl: "",
  mediaType: "image",
  mediaPosterUrl: ""
};

export const defaultHomepageFeatures: HomepageFeatureCard[] = [
  {
    eyebrow: "Protected Access",
    title: "Partner approvals backed by roles and RLS.",
    description:
      "Approved partners access protected resort files, rates, and trade resources from one secure portal.",
    imageUrl: ""
  },
  {
    eyebrow: "Live Support",
    title: "Realtime chat for sales and contracting questions.",
    description:
      "Supabase Realtime powers direct communication between partners and the internal sales team.",
    imageUrl: ""
  },
    {
      eyebrow: "Admin AI",
      title: "AI Gateway powers import review and SEO drafting.",
      description:
        "AI helps the admin team accelerate data extraction and summary generation without auto-publishing.",
    imageUrl: ""
  }
];

export const defaultHomepageStats: HomepageStat[] = [
  { value: "198+", label: "Resorts" },
  { value: "20+", label: "Years Experience" },
  { value: "24/7", label: "Local Support" },
  { value: "Global", label: "Travel Partners" }
];

export const defaultHomepageCeoContent: HomepageCeoContent = {
  sectionLabel: "CEO's Message",
  quote:
    "Our mission is to connect the world's leading travel designers with the extraordinary experiences of the Maldives.",
  message:
    "Founded on the principles of discretion and excellence, we have spent two decades building intimate relationships with the Maldives' most secluded resorts and most trusted hospitality partners.",
  name: "Elias Jancel",
  title: "Founder & CEO",
  photoUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80"
};

export const defaultHomepageStoryContent: HomepageStoryContent = {
  sectionLabel: "Our Story",
  title: "A Legacy of Luxury in the Maldives",
  description:
    "Our role as a specialized B2B DMC is to act as an extension of your team on the ground, ensuring every client detail is executed with precision, warmth, and deep destination knowledge.",
  imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80"
};

export const defaultHomepageServices: HomepageServiceItem[] = [
  {
    title: "Luxury Resort Contracting",
    description: "Commercially fluent resort partnerships, preferred rates, and product positioning for premium agencies.",
    icon: "briefcase-business",
    imageUrl: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1600&q=90",
    imageAlt: "Luxury Maldives overwater resort arrival",
    displayOrder: 1,
    enabled: true
  },
  {
    title: "Bespoke Itinerary Planning",
    description: "Tailored island combinations, transfer logic, and guest flow planned with destination-level precision.",
    icon: "route",
    imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1600&q=90",
    imageAlt: "Maldives island itinerary planning scenery",
    displayOrder: 2,
    enabled: true
  },
  {
    title: "VIP Arrival & Transfer Coordination",
    description: "Seamless airport handling, lounge support, seaplane and speedboat coordination for high-value guests.",
    icon: "plane",
    imageUrl: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=90",
    imageAlt: "Premium Maldives transfer and arrival experience",
    displayOrder: 3,
    enabled: true
  },
  {
    title: "Dedicated On-Island Partner Support",
    description: "Responsive in-destination support for sales teams, operations teams, and live guest requirements.",
    icon: "headphones",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=90",
    imageAlt: "On-island Maldives partner support",
    displayOrder: 4,
    enabled: true
  },
  {
    title: "Group & Incentive Handling",
    description: "Premium group logistics, buyouts, incentives, and event support shaped around the right island product.",
    icon: "users-round",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=90",
    imageAlt: "Curated Maldives group and incentive travel",
    displayOrder: 5,
    enabled: true
  },
  {
    title: "Trade Rate & Offer Management",
    description: "Clean access to market-ready offers, tactical campaigns, and partner-facing commercial updates.",
    icon: "badge-percent",
    imageUrl: "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=90",
    imageAlt: "Maldives trade offers and resort product updates",
    displayOrder: 6,
    enabled: true
  }
];

export const defaultHomepageWhyUs: HomepageWhyUsItem[] = [
  {
    title: "Deep Resort Relationships",
    description:
      "We work closely with the Maldives' leading luxury resorts, helping travel designers place the right product with confidence."
  },
  {
    title: "Commercially Fluent Support",
    description:
      "From contracting questions to live sales support, the platform is built around partner workflow instead of generic destination content."
  },
  {
    title: "On-Ground Precision",
    description:
      "Our local operations team handles the detail that protects the experience your clients expect."
  }
];

export const defaultHomepageGuide: HomepageGuideItem[] = [
  {
    category: "Destination Insight",
    slug: "choosing-the-right-atoll",
    title: "Choosing the Right Atoll for the Right Client",
    featuredImageAlt: "Aerial Maldives atoll and turquoise lagoon",
    summary: "A partner-facing guide to matching geography, transfer logic, and experience style.",
    description: "A partner-facing guide to matching geography, transfer logic, and experience style.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    mainContent: "Choosing the right atoll is less about distance on a map and more about arrival style, resort density, marine life, privacy, and the client profile. Use the atoll as a selling frame when explaining why one island fits better than another.",
    tips: ["Match seaplane access to clients who value the arrival moment.", "Use speedboat islands for shorter stays and late arrivals."],
    sections: [{ heading: "How to Position Atolls", body: "North and South Male work well for convenient access, while outer atolls often suit clients seeking a more remote island narrative." }],
    faq: [{ question: "Does the atoll matter for first-time visitors?", answer: "Yes. It shapes transfers, marine life, resort style, and the feeling of remoteness." }],
    seoTitle: "Choosing the Right Maldives Atoll",
    seoDescription: "A practical Maldives atoll guide for tourists and travel partners.",
    relatedSlugs: ["seaplane-versus-speedboat-access"],
    published: true,
    lastUpdated: "2026-05-01"
  },
  {
    category: "Sales Narrative",
    slug: "seaplane-versus-speedboat-access",
    title: "How to Position Seaplane Resorts Versus Speedboat Access",
    featuredImageAlt: "Maldives seaplane arrival over lagoon",
    summary: "Help clients understand convenience versus iconic Maldives arrival moments.",
    description: "Help clients understand convenience versus iconic Maldives arrival moments.",
    imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=80",
    mainContent: "Seaplanes create one of the Maldives' most memorable arrival rituals, while speedboat resorts are easier for late arrivals, short stays, and guests who prioritize fast logistics.",
    tips: ["Explain seaplane daylight operating windows early.", "Recommend speedboat access for one-night stopovers or late international arrivals."],
    sections: [{ heading: "Selling the Transfer", body: "The transfer should be positioned as part of the experience, not only as transport." }],
    faq: [{ question: "Are seaplanes always better?", answer: "No. They are iconic, but speedboats can be more practical depending on timing and guest priorities." }],
    seoTitle: "Maldives Seaplane vs Speedboat Resorts",
    seoDescription: "How to choose between seaplane and speedboat transfers in the Maldives.",
    relatedSlugs: ["choosing-the-right-atoll"],
    published: true,
    lastUpdated: "2026-05-01"
  },
  {
    category: "Planning",
    slug: "seasonality-demand-and-booking-patterns",
    title: "Seasonality, Demand Windows, and Luxury Booking Patterns",
    featuredImageAlt: "Sunny Maldives beach and lagoon",
    summary: "A practical guide for premium agencies planning around travel windows and lead time.",
    description: "A practical guide for premium agencies planning around travel windows and lead time.",
    imageUrl: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=80",
    mainContent: "Luxury demand in the Maldives moves around festive travel, school holidays, honeymoon periods, and tactical offer windows. Partners should plan lead times around room category scarcity and transfer availability.",
    tips: ["Treat festive inventory as early-booking territory.", "Use shoulder months for value-led luxury conversations."],
    sections: [{ heading: "Planning Rhythm", body: "The best booking strategy balances weather expectations, offer windows, and the client tolerance for flexible travel dates." }],
    faq: [{ question: "When should luxury clients book?", answer: "For peak dates, months ahead. For flexible travel, tactical offer windows can be strong." }],
    seoTitle: "Maldives Seasonality and Luxury Booking Guide",
    seoDescription: "Understand Maldives seasonality, demand windows, and luxury booking patterns.",
    relatedSlugs: ["choosing-the-right-atoll"],
    published: true,
    lastUpdated: "2026-05-01"
  },
  {
    category: "Product",
    slug: "room-types-that-matter",
    title: "Room Types That Actually Matter in the Decision Process",
    featuredImageAlt: "Maldives overwater villas and lagoon",
    summary: "A quick read on how to frame villas, family units, and signature inventory.",
    description: "A quick read on how to frame villas, family units, and signature inventory.",
    imageUrl: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1400&q=80",
    mainContent: "Room selection should consider sunrise or sunset orientation, reef access, family layout, privacy, pool size, and distance from resort facilities. The right villa type often determines guest satisfaction more than the resort name alone.",
    tips: ["Clarify villa orientation before confirming honeymoon stays.", "For families, prioritize layout and proximity over only view category."],
    sections: [{ heading: "Villa Fit", body: "A villa should match guest habits: swimming, dining, privacy, children, mobility, and preferred resort rhythm." }],
    faq: [{ question: "Are overwater villas always best?", answer: "Not always. Beach villas may suit families, privacy seekers, and guests who prefer direct sand access." }],
    seoTitle: "Maldives Room Types Guide",
    seoDescription: "How to select Maldives villas and room types for different guest profiles.",
    relatedSlugs: ["seaplane-versus-speedboat-access"],
    published: true,
    lastUpdated: "2026-05-01"
  }
];

export const defaultHomepageNewsletterContent: HomepageNewsletterContent = {
  sectionLabel: "Stay Connected",
  title: "Be in Touch",
  description: "We would be delighted to stay connected and learn more about your business.",
  imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80"
};

export const defaultHomepageAwardsContent: HomepageAwardsContent = {
  title: "Prestigious Awards",
  summary: "Recognition from global luxury travel partners and trade networks.",
  items: [
    {
      name: "World Luxury Travel Awards",
      imageUrl: "https://dummyimage.com/240x120/ffffff/0f172a&text=Award+1",
      href: "",
      enabled: true
    },
    {
      name: "Indian Ocean Travel Awards",
      imageUrl: "https://dummyimage.com/240x120/ffffff/0f172a&text=Award+2",
      href: "",
      enabled: true
    },
    {
      name: "Preferred DMC Recognition",
      imageUrl: "https://dummyimage.com/240x120/ffffff/0f172a&text=Award+3",
      href: "",
      enabled: true
    }
  ]
};

export const defaultNavbarContent: NavbarContent = {
  brandKicker: "",
  brandLabel: "Exciting Maldives",
  primaryLogoUrl: "https://dummyimage.com/420x120/0f172a/ffffff&text=Exciting+Maldives",
  whiteLogoUrl: "https://dummyimage.com/420x120/ffffff/0f172a&text=Exciting+Maldives",
  blackLogoUrl: "https://dummyimage.com/420x120/111111/ffffff&text=Exciting+Maldives",
  featuredResortLogos: [
    { name: "Soneva", imageUrl: "", href: "", enabled: true },
    { name: "JOALI", imageUrl: "", href: "", enabled: true },
    { name: "Patina", imageUrl: "", href: "", enabled: true },
    { name: "Milaidhoo", imageUrl: "", href: "", enabled: true },
    { name: "Baros", imageUrl: "", href: "", enabled: true }
  ],
  navItems: [
    { label: "Resorts", href: "/resorts", enabled: true, external: false },
    { label: "About Us", href: "/about", enabled: true, external: false },
    { label: "Map", href: "/#global-markets", enabled: true, external: false },
    { label: "Display All", href: "/travel-guide", enabled: true, external: false }
  ],
  ctaLabel: "Login to Partner Portal",
  ctaHref: "/partner/login",
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
  companyLogoUrl: "",
  linkGroups: [
    {
      title: "Destinations",
      enabled: true,
      items: [
        { label: "Resorts", href: "/resorts", enabled: true, external: false },
        { label: "Experiences", href: "/experiences", enabled: true, external: false },
        { label: "", href: "", enabled: false, external: false }
      ]
    },
    {
      title: "Services",
      enabled: true,
      items: [
        { label: "DMC Services", href: "/services", enabled: true, external: false },
        { label: "Travel Partnerships", href: "/partner/register", enabled: true, external: false },
        { label: "", href: "", enabled: false, external: false }
      ]
    },
    {
      title: "Company",
      enabled: true,
      items: [
        { label: "About Us", href: "/about", enabled: true, external: false },
        { label: "Awards", href: "/awards", enabled: true, external: false },
        { label: "Contact", href: "/contact", enabled: true, external: false },
        { label: "", href: "", enabled: false, external: false }
      ]
    },
    {
      title: "Resources",
      enabled: true,
      items: [
        { label: "Travel Guide", href: "/travel-guide", enabled: true, external: false },
        { label: "Newsletter", href: "/#newsletter", enabled: true, external: false },
        { label: "", href: "", enabled: false, external: false }
      ]
    }
  ],
  memberships: [
    {
      name: "Preferred DMC Network",
      imageUrl: "https://dummyimage.com/240x120/ffffff/0f172a&text=Membership+1",
      href: "",
      enabled: true
    },
    {
      name: "Luxury Trade Collective",
      imageUrl: "https://dummyimage.com/240x120/ffffff/0f172a&text=Membership+2",
      href: "",
      enabled: true
    },
    {
      name: "",
      imageUrl: "",
      href: "",
      enabled: false
    }
  ],
  awards: [
    {
      name: "Indian Ocean Partner Excellence",
      imageUrl: "https://dummyimage.com/240x120/ffffff/0f172a&text=Award+1",
      href: "",
      enabled: true
    },
    {
      name: "Premier Maldives Sales Partner",
      imageUrl: "https://dummyimage.com/240x120/ffffff/0f172a&text=Award+2",
      href: "",
      enabled: true
    },
    {
      name: "",
      imageUrl: "",
      href: "",
      enabled: false
    }
  ]
};

export const defaultWhatsAppSettings: WhatsAppSettings = {
  enabled: true,
  label: "Chat Now",
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
  sectionTitle: "Global Markets",
  heading: "Connected to the markets shaping premium Maldives demand",
  description:
    "A focused DMC presence for travel designers and agencies across the regions driving premium Maldives bookings, trade offers, and repeat luxury demand.",
  options: [
    {
      id: "europe",
      label: "Europe",
      latitude: 48.8566,
      longitude: 2.3522,
      region: "Europe",
      displayOrder: 1,
      enabled: true
    },
    {
      id: "russia-cis",
      label: "Russia & CIS",
      latitude: 55.7558,
      longitude: 37.6173,
      region: "CIS",
      displayOrder: 2,
      enabled: true
    },
    {
      id: "middle-east",
      label: "Middle East",
      latitude: 25.2048,
      longitude: 55.2708,
      region: "GCC",
      displayOrder: 3,
      enabled: true
    },
    {
      id: "south-asia",
      label: "South Asia",
      latitude: 6.9271,
      longitude: 79.8612,
      region: "South Asia",
      displayOrder: 4,
      enabled: true
    }
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

function numericValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeHomepageServices(items: unknown): HomepageServiceItem[] {
  const source = Array.isArray(items) ? items : defaultHomepageServices;
  return source
    .map((item, index) => {
      const value = item as Partial<HomepageServiceItem>;
      const fallback = defaultHomepageServices[index] ?? defaultHomepageServices[0];

      return {
        title: value.title ?? fallback.title,
        description: value.description ?? fallback.description,
        icon: value.icon ?? fallback.icon,
        imageUrl: value.imageUrl ?? fallback.imageUrl,
        imageAlt: value.imageAlt ?? fallback.imageAlt,
        displayOrder: numericValue(value.displayOrder, index + 1),
        enabled: value.enabled ?? true
      };
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function slugify(value: string, fallback: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || fallback;
}

function stringArray(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "")).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split("\n").map((item) => item.trim()).filter(Boolean);
  }

  return fallback;
}

function normalizeHomepageGuide(items: unknown): HomepageGuideItem[] {
  const source = Array.isArray(items) ? items : defaultHomepageGuide;
  return source.map((item, index) => {
    const value = item as Partial<HomepageGuideItem>;
    const fallback = defaultHomepageGuide[index] ?? defaultHomepageGuide[0];
    const title = value.title || fallback.title;
    const summary = value.summary || value.description || fallback.summary;

    return {
      slug: value.slug || slugify(title, `guide-${index + 1}`),
      category: value.category || fallback.category,
      title,
      featuredImageAlt: value.featuredImageAlt || value.title || fallback.featuredImageAlt,
      summary,
      description: value.description || summary,
      imageUrl: value.imageUrl || fallback.imageUrl,
      mainContent: value.mainContent || fallback.mainContent,
      tips: stringArray(value.tips, fallback.tips),
      sections: Array.isArray(value.sections) ? value.sections : fallback.sections,
      faq: Array.isArray(value.faq) ? value.faq : fallback.faq,
      seoTitle: value.seoTitle || value.title || fallback.seoTitle,
      seoDescription: value.seoDescription || summary || fallback.seoDescription,
      relatedSlugs: stringArray(value.relatedSlugs, fallback.relatedSlugs),
      published: value.published ?? true,
      lastUpdated: value.lastUpdated || fallback.lastUpdated
    };
  });
}

function normalizeMarketSettings(settings: unknown): MarketSettings {
  const source = (settings ?? defaultMarketSettings) as Partial<MarketSettings>;
  const options = Array.isArray(source.options) ? source.options : defaultMarketSettings.options;

  return {
    sectionTitle: source.sectionTitle || defaultMarketSettings.sectionTitle,
    heading: source.heading || defaultMarketSettings.heading,
    description: source.description || defaultMarketSettings.description,
    options: options
      .map((item, index) => {
        const value = item as Partial<MarketOption>;
        const fallback = defaultMarketSettings.options[index] ?? defaultMarketSettings.options[0];
        const label = value.label || fallback.label;

        return {
          id: value.id || label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `market-${index + 1}`,
          label,
          latitude: numericValue(value.latitude, fallback.latitude),
          longitude: numericValue(value.longitude, fallback.longitude),
          region: value.region ?? fallback.region,
          displayOrder: numericValue(value.displayOrder, index + 1),
          enabled: value.enabled ?? true
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder)
  };
}

export async function getHomepageHeroContent(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.hero", defaultHeroContent, mode);
}

export async function getHomepageFeatures(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.features", defaultHomepageFeatures, mode);
}

export async function getHomepageStats(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.stats", defaultHomepageStats, mode);
}

export async function getHomepageCeoContent(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.ceo", defaultHomepageCeoContent, mode);
}

export async function getHomepageStoryContent(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.story", defaultHomepageStoryContent, mode);
}

export async function getHomepageServices(mode: "draft" | "published" = "published") {
  const entry = await getSiteSettingMode("homepage.services", defaultHomepageServices, mode);
  return {
    ...entry,
    content: normalizeHomepageServices(entry.content)
  };
}

export async function getHomepageWhyUs(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.whyus", defaultHomepageWhyUs, mode);
}

export async function getHomepageGuide(mode: "draft" | "published" = "published") {
  const entry = await getSiteSettingMode("homepage.guide", defaultHomepageGuide, mode);
  return {
    ...entry,
    content: normalizeHomepageGuide(entry.content)
  };
}

export async function getHomepageNewsletterContent(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.newsletter", defaultHomepageNewsletterContent, mode);
}

export async function getHomepageAwardsContent(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.awards", defaultHomepageAwardsContent, mode);
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
  const entry = await getSiteSettingMode("site.markets", defaultMarketSettings, mode);
  return {
    ...entry,
    content: normalizeMarketSettings(entry.content)
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
