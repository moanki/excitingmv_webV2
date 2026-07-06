import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminRole } from "@/lib/auth/require-admin";

function supabaseStorageUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}${path}` : "";
}

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
  featuredResortLogos?: FooterBadge[];
};

export type HomepageFeatureCard = {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type HomepageFeaturedResortItem = {
  resortId: string;
  sortOrder: number;
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
  navItems: NavigationItem[];
  partnerLoginHref: string;
  ctaLabel: string;
  ctaHref: string;
  ctaEnabled: boolean;
};

export type CatalogueKind = "resorts" | "hotels" | "liveaboards" | "contact" | "travel-guide";

export type CatalogueContent = {
  heroImageUrl: string;
  title?: string;
  body?: string;
  eyebrow?: string;
};

export type AdminLoginContent = {
  backgroundImageUrl: string;
  logoImageUrl: string;
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
  contactWhatsApp: string;
  address: string;
  samoaUrl: string;
  companyLogoUrl: string;
  linkGroups: FooterLinkGroup[];
  memberships: FooterBadge[];
  awards: FooterBadge[];
};

export type ContactRegion = {
  regionTitle: string;
  location: string;
  contactName: string;
  role: string;
  photoUrl: string;
  email: string;
  whatsapp: string;
  displayOrder: number;
  enabled: boolean;
};

export type ContactPageContent = {
  title: string;
  subtitle: string;
  regions: ContactRegion[];
  ctaText: string;
  ctaLabel: string;
  ctaHref: string;
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

export type AboutStatCard = {
  label: string;
  value: string;
  enabled: boolean;
};

export type AboutBentoCard = {
  icon: string;
  title: string;
  description: string;
  displayOrder: number;
  enabled: boolean;
};

export type AboutMarketCard = {
  icon: string;
  region: string;
  description: string;
  displayOrder: number;
  enabled: boolean;
};

export type AboutWhyPoint = {
  icon: string;
  title: string;
  description: string;
  displayOrder: number;
  enabled: boolean;
};

export type AboutLogoItem = FooterBadge & {
  displayOrder: number;
};

export type AboutPageContent = {
  hero: {
    kicker: string;
    headline: string;
    body: string;
    imageUrl: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    stats: AboutStatCard[];
  };
  story: {
    title: string;
    body: string;
    secondaryBody: string;
    imageUrl: string;
    imageAlt: string;
  };
  whatWeDo: {
    title: string;
    subtitle: string;
    cards: AboutBentoCard[];
  };
  markets: {
    title: string;
    subtitle: string;
    cards: AboutMarketCard[];
  };
  whyUs: {
    title: string;
    subtitle: string;
    points: AboutWhyPoint[];
  };
  awards: {
    title: string;
    subtitle: string;
    logos: AboutLogoItem[];
  };
  cta: {
    headline: string;
    body: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    tertiaryCtaLabel: string;
    tertiaryCtaHref: string;
    backgroundImageUrl: string;
    backgroundColor: string;
  };
  seo: {
    title: string;
    description: string;
    ogImageUrl: string;
    canonicalUrl: string;
  };
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
  mediaPosterUrl: "",
  featuredResortLogos: [
    { name: "Resort 1", imageUrl: "", href: "", enabled: true },
    { name: "Resort 2", imageUrl: "", href: "", enabled: true },
    { name: "Resort 3", imageUrl: "", href: "", enabled: true },
    { name: "Resort 4", imageUrl: "", href: "", enabled: true },
    { name: "Resort 5", imageUrl: "", href: "", enabled: true }
  ]
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

export const defaultHomepageFeaturedResorts: HomepageFeaturedResortItem[] = [];

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
  primaryLogoUrl:
    supabaseStorageUrl("/storage/v1/render/image/public/site-assets/site/logos/1776842917743-8bc93591-d284-42e9-a65c-c40c96b1306e.png?width=360&height=160&resize=contain&quality=92"),
  whiteLogoUrl:
    supabaseStorageUrl("/storage/v1/object/public/site-assets/site/logos/1776846432195-7f847ccd-81da-424c-bbf2-0e0fd733850f.png"),
  blackLogoUrl:
    supabaseStorageUrl("/storage/v1/render/image/public/site-assets/site/logos/1776842917743-8bc93591-d284-42e9-a65c-c40c96b1306e.png?width=360&height=160&resize=contain&quality=92"),
  navItems: [
    { label: "Resort", href: "/resorts", enabled: true, external: false },
    { label: "Hotels", href: "/hotels", enabled: true, external: false },
    { label: "Liveaboard", href: "/liveaboards", enabled: true, external: false },
    { label: "Contact", href: "/contact", enabled: true, external: false },
    { label: "Travel Guide", href: "/travel-guide", enabled: true, external: false }
  ],
  partnerLoginHref: "/partner/login",
  ctaLabel: "Login to Partner Portal",
  ctaHref: "/partner/login",
  ctaEnabled: true
};

export const defaultCatalogueContent: Record<CatalogueKind, CatalogueContent> = {
  resorts: {
    heroImageUrl: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=2200&q=92",
    title: "Discover More Than Paradise",
    body: "From private island sanctuaries to trade-ready luxury escapes, explore curated Maldives resorts shaped for confident partner conversations.",
    eyebrow: "Our Resort Portfolio"
  },
  hotels: {
    heroImageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2200&q=92",
    title: "Maldives Hotels With Island Ease",
    body: "Browse hotels and hospitality stays selected for practical access, partner clarity, and polished Maldives itineraries.",
    eyebrow: "Maldives Hotels"
  },
  liveaboards: {
    heroImageUrl: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=2200&q=92",
    title: "Luxury Voyages Across The Maldives",
    body: "A focused collection of liveaboards for diving, private charters, and ocean-led itineraries across the Maldives.",
    eyebrow: "Maldives Liveaboards"
  },
  contact: {
    heroImageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2200&q=92",
    title: "Contact",
    body: "Connect with our destination experts and regional teams for tailored Maldives support.",
    eyebrow: "Partner Support"
  },
  "travel-guide": {
    heroImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=92",
    title: "Travel Guide",
    body: "Partner-focused destination insights, selling tips, and practical Maldives travel knowledge.",
    eyebrow: "Destination Insights"
  }
};

export const defaultAdminLoginContent: AdminLoginContent = {
  backgroundImageUrl: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=2200&q=85",
  logoImageUrl: ""
};

export const defaultFooterContent: FooterContent = {
  companyLabel: "Exciting Maldives",
  description:
    "Luxury resort partnerships, protected trade resources, and curated Maldives expertise.",
  contactEmail: "partners@excitingmv.com",
  contactPhone: "+960 000 0000",
  contactWhatsApp: "+960 778 5596",
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
        { label: "Awards", href: "/#prestigious-awards", enabled: true, external: false }
      ]
    },
    {
      title: "Services",
      enabled: true,
      items: [
        { label: "DMC Services", href: "/#destination-management", enabled: true, external: false },
        { label: "Travel Partnerships", href: "/partner/register", enabled: true, external: false },
        { label: "", href: "", enabled: false, external: false }
      ]
    },
    {
      title: "Company",
      enabled: true,
      items: [
        { label: "About Us", href: "/about", enabled: true, external: false },
        { label: "Awards", href: "/#prestigious-awards", enabled: true, external: false },
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

export const defaultContactPageContent: ContactPageContent = {
  title: "Contact Us",
  subtitle:
    "Connect with the right Exciting Maldives representative for your region, partnership enquiries, and destination support.",
  regions: [
    {
      regionTitle: "HEAD OFFICE",
      location: "Male, Maldives",
      contactName: "Aishath Ibrahim",
      role: "Managing Director",
      photoUrl: "",
      email: "hello@excitingmaldives.com",
      whatsapp: "+960 778 5596",
      displayOrder: 1,
      enabled: true
    },
    {
      regionTitle: "EUROPE",
      location: "London, UK",
      contactName: "Sophie Laurent",
      role: "Regional Director",
      photoUrl: "",
      email: "europe@excitingmaldives.com",
      whatsapp: "+44 7700 518201",
      displayOrder: 2,
      enabled: true
    },
    {
      regionTitle: "MIDDLE EAST",
      location: "Dubai, UAE",
      contactName: "Partner Relations",
      role: "Regional Support",
      photoUrl: "",
      email: "gcc@excitingmaldives.com",
      whatsapp: "+971 50 000 0000",
      displayOrder: 3,
      enabled: true
    }
  ],
  ctaText: "For general partnership enquiries, contact our Maldives head office.",
  ctaLabel: "Become a Partner",
  ctaHref: "/partner/register"
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

export const defaultAboutPageContent: AboutPageContent = {
  hero: {
    kicker: "ABOUT EXCITING MALDIVES",
    headline: "The Maldives DMC Behind Confident Travel Partnerships",
    body:
      "We connect travel professionals with trusted resort access, curated destination knowledge, and seamless on-ground support across the Maldives.",
    imageUrl: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1800&q=86",
    primaryCtaLabel: "Become a Partner",
    primaryCtaHref: "#partner",
    secondaryCtaLabel: "Contact Us",
    secondaryCtaHref: "/contact",
    stats: [
      { value: "4x", label: "TTM Top Producer", enabled: true },
      { value: "Strong", label: "Resort Partnerships", enabled: true },
      { value: "Global", label: "Russia & CIS / Europe / Middle East / Asia Markets", enabled: true },
      { value: "Local", label: "Maldives-Based Destination Expertise", enabled: true }
    ]
  },
  story: {
    title: "Introduction",
    body:
      "Exciting Maldives is a Maldives-based B2B Destination Management Company built to support travel professionals with trusted resort partnerships, local destination expertise, and seamless inbound travel coordination.",
    secondaryBody:
      "We believe in destination growth that respects the Maldives, supports local partnerships, and protects the character of the islands.",
    imageUrl: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=84",
    imageAlt: "Maldives resort partnership and destination expertise"
  },
  whatWeDo: {
    title: "End-to-End Destination Support",
    subtitle:
      "From resort coordination to guest handling, Exciting Maldives supports travel professionals with reliable, locally managed inbound services across the Maldives.",
    cards: [
      {
        icon: "bed-double",
        title: "Resort & Accommodation Coordination",
        description: "Trusted support for resort selection, product matching, and booking coordination across the Maldives.",
        displayOrder: 1,
        enabled: true
      },
      {
        icon: "plane",
        title: "Transportation & Transfers",
        description: "Seamless coordination for speedboat, domestic flight, seaplane, and arrival-to-resort movement.",
        displayOrder: 2,
        enabled: true
      },
      {
        icon: "concierge-bell",
        title: "Concierge & Personalization",
        description: "Tailored support for guest preferences, special requests, and high-value travel experiences.",
        displayOrder: 3,
        enabled: true
      },
      {
        icon: "badge-check",
        title: "Events, Groups & Meet & Greet",
        description: "Coordinated support for arrivals, groups, events, and on-ground guest handling.",
        displayOrder: 4,
        enabled: true
      }
    ]
  },
  markets: {
    title: "Brand Portfolio & Ecosystem",
    subtitle:
      "Together with its connected hospitality and travel brands, Exciting Maldives supports a wider ecosystem of destination expertise, distribution, and curated travel development.",
    cards: [
      { icon: "building-2", region: "ETH Hospitality Services", description: "Regional hospitality operations hub, Dubai.", displayOrder: 1, enabled: true },
      { icon: "globe-2", region: "Exciting Travel Holidays", description: "Global travel distribution and partner network.", displayOrder: 2, enabled: true },
      { icon: "palmtree", region: "Exciting Islands", description: "Destination branding and curated experience development.", displayOrder: 3, enabled: true }
    ]
  },
  whyUs: {
    title: "Our Philosophy & Promise",
    subtitle: "We believe the Maldives should be experienced with care, clarity, and respect for the islands. Our team supports partners with personalized service, responsible destination knowledge, and reliable on-ground coordination from planning to departure.",
    points: [
      { icon: "handshake", title: "Luxury Resorts", description: "Premium digital exposure, high-value partner visibility, and stronger storytelling.", displayOrder: 1, enabled: true },
      { icon: "handshake", title: "Boutique Hotels & Guesthouses", description: "Access to premium markets and scalable growth opportunities.", displayOrder: 2, enabled: true },
      { icon: "handshake", title: "Experience Providers", description: "Curated exposure, cross-selling opportunities, and global distribution.", displayOrder: 3, enabled: true }
    ]
  },
  awards: {
    title: "Trusted Hospitality Network",
    subtitle:
      "We collaborate with a curated portfolio of luxury resorts, boutique properties, and local providers to give partners trusted access, clearer product positioning, and stronger Maldives recommendations.",
    logos: [
      { name: "TTM Top Producer", imageUrl: "https://dummyimage.com/280x140/ffffff/0f172a&text=TTM+Award", href: "", enabled: true, displayOrder: 1 },
      { name: "Preferred DMC Network", imageUrl: "https://dummyimage.com/280x140/ffffff/0f172a&text=DMC+Network", href: "", enabled: true, displayOrder: 2 },
      { name: "Luxury Trade Collective", imageUrl: "https://dummyimage.com/280x140/ffffff/0f172a&text=Luxury+Trade", href: "", enabled: true, displayOrder: 3 }
    ]
  },
  cta: {
    headline: "Build Stronger Maldives Partnerships With Us",
    body:
      "Whether you are a travel professional, resort, hotel, or experience provider, Exciting Maldives helps connect the right partners with the right destination opportunities.",
    primaryCtaLabel: "Become a Partner",
    primaryCtaHref: "#partner",
    secondaryCtaLabel: "Contact Us",
    secondaryCtaHref: "/contact",
    tertiaryCtaLabel: "Explore Destinations",
    tertiaryCtaHref: "/resorts",
    backgroundImageUrl: "",
    backgroundColor: "#07131f"
  },
  seo: {
    title: "About Exciting Maldives",
    description: "Meet Exciting Maldives, a premium B2B Maldives DMC for global travel professionals, resort partners, and curated destination services.",
    ogImageUrl: "",
    canonicalUrl: "/about"
  }
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

function normalizeNavbarContent(settings: unknown): NavbarContent {
  const source = (settings ?? defaultNavbarContent) as Partial<NavbarContent>;
  const sourceItems = Array.isArray(source.navItems) ? source.navItems : [];
  const navItems = sourceItems.length ? sourceItems : defaultNavbarContent.navItems;
  const normalizeNavItem = (item: Partial<FooterLinkItem>, fallback: FooterLinkItem): FooterLinkItem => {
    const label = item.label ?? fallback.label;
    const normalizedLabel = label.trim().toLowerCase();

    if (normalizedLabel === "map" || normalizedLabel === "maps") {
      return {
        label: "Contact",
        href: "/contact",
        enabled: item.enabled ?? fallback.enabled,
        external: false
      };
    }

    if (normalizedLabel === "info") {
      return {
        label: "Travel Guide",
        href: "/travel-guide",
        enabled: item.enabled ?? fallback.enabled,
        external: false
      };
    }

    return {
      label,
      href: item.href ?? fallback.href,
      enabled: item.enabled ?? fallback.enabled,
      external: item.external ?? fallback.external
    };
  };

  return {
    brandKicker: source.brandKicker ?? defaultNavbarContent.brandKicker,
    brandLabel: source.brandLabel ?? defaultNavbarContent.brandLabel,
    primaryLogoUrl: source.primaryLogoUrl ?? defaultNavbarContent.primaryLogoUrl,
    whiteLogoUrl: source.whiteLogoUrl ?? defaultNavbarContent.whiteLogoUrl,
    blackLogoUrl: source.blackLogoUrl ?? defaultNavbarContent.blackLogoUrl,
    navItems: navItems.map((item, index) => {
      const fallback = defaultNavbarContent.navItems[index] ?? defaultNavbarContent.navItems[0];
      return normalizeNavItem(item, fallback);
    }),
    partnerLoginHref: source.partnerLoginHref ?? source.ctaHref ?? defaultNavbarContent.partnerLoginHref,
    ctaLabel: source.ctaLabel ?? defaultNavbarContent.ctaLabel,
    ctaHref: source.ctaHref ?? defaultNavbarContent.ctaHref,
    ctaEnabled: source.ctaEnabled ?? defaultNavbarContent.ctaEnabled
  };
}

function normalizeHomepageFeaturedResorts(settings: unknown): HomepageFeaturedResortItem[] {
  const source = Array.isArray(settings) ? settings : defaultHomepageFeaturedResorts;
  const seen = new Set<string>();

  return source
    .map((item, index) => {
      const value = item as Partial<HomepageFeaturedResortItem>;
      return {
        resortId: String(value.resortId ?? "").trim(),
        sortOrder: numericValue(value.sortOrder, index + 1)
      };
    })
    .filter((item) => {
      if (!item.resortId || seen.has(item.resortId)) {
        return false;
      }
      seen.add(item.resortId);
      return true;
    })
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .slice(0, 5)
    .map((item, index) => ({
      resortId: item.resortId,
      sortOrder: index + 1
    }));
}

function normalizeFooterContent(settings: unknown): FooterContent {
  const source = (settings ?? defaultFooterContent) as Partial<FooterContent>;

  return {
    companyLabel: source.companyLabel ?? defaultFooterContent.companyLabel,
    description: source.description ?? defaultFooterContent.description,
    contactEmail: source.contactEmail ?? defaultFooterContent.contactEmail,
    contactPhone: source.contactPhone ?? defaultFooterContent.contactPhone,
    contactWhatsApp: source.contactWhatsApp ?? defaultFooterContent.contactWhatsApp,
    address: source.address ?? defaultFooterContent.address,
    samoaUrl: source.samoaUrl ?? defaultFooterContent.samoaUrl,
    companyLogoUrl: source.companyLogoUrl ?? defaultFooterContent.companyLogoUrl,
    linkGroups: Array.isArray(source.linkGroups) ? source.linkGroups : defaultFooterContent.linkGroups,
    memberships: Array.isArray(source.memberships) ? source.memberships : defaultFooterContent.memberships,
    awards: Array.isArray(source.awards) ? source.awards : defaultFooterContent.awards
  };
}

function normalizeAdminLoginContent(settings: unknown): AdminLoginContent {
  const source = (settings ?? defaultAdminLoginContent) as Partial<AdminLoginContent>;

  return {
    backgroundImageUrl: source.backgroundImageUrl ?? defaultAdminLoginContent.backgroundImageUrl,
    logoImageUrl: source.logoImageUrl ?? defaultAdminLoginContent.logoImageUrl
  };
}

function normalizeContactPageContent(settings: unknown): ContactPageContent {
  const source = (settings ?? defaultContactPageContent) as Partial<ContactPageContent>;
  const sourceRegions = Array.isArray(source.regions) ? source.regions : defaultContactPageContent.regions;

  return {
    title: source.title || defaultContactPageContent.title,
    subtitle: source.subtitle || defaultContactPageContent.subtitle,
    regions: sourceRegions
      .map((item, index) => {
        const value = item as Partial<ContactRegion>;
        const fallback = defaultContactPageContent.regions[index] ?? defaultContactPageContent.regions[0];

        return {
          regionTitle: value.regionTitle || fallback.regionTitle,
          location: value.location || fallback.location,
          contactName: value.contactName || fallback.contactName,
          role: value.role || fallback.role,
          photoUrl: value.photoUrl || fallback.photoUrl || "",
          email: value.email || fallback.email,
          whatsapp: value.whatsapp || fallback.whatsapp,
          displayOrder: numericValue(value.displayOrder, index + 1),
          enabled: value.enabled ?? true
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder),
    ctaText: source.ctaText || defaultContactPageContent.ctaText,
    ctaLabel: source.ctaLabel || defaultContactPageContent.ctaLabel,
    ctaHref: source.ctaHref || defaultContactPageContent.ctaHref
  };
}

function normalizeAboutCards<T extends { displayOrder: number; enabled: boolean }>(
  items: unknown,
  fallback: T[],
  mapper: (item: Partial<T>, fallback: T, index: number) => T
) {
  const source = Array.isArray(items) ? items : fallback;
  return source
    .map((item, index) => mapper(item as Partial<T>, fallback[index] ?? fallback[0], index))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function normalizeAboutPageContent(settings: unknown): AboutPageContent {
  const source = (settings ?? defaultAboutPageContent) as Partial<AboutPageContent>;
  const hero = source.hero ?? defaultAboutPageContent.hero;
  const story = source.story ?? defaultAboutPageContent.story;
  const whatWeDo = source.whatWeDo ?? defaultAboutPageContent.whatWeDo;
  const markets = source.markets ?? defaultAboutPageContent.markets;
  const whyUs = source.whyUs ?? defaultAboutPageContent.whyUs;
  const awards = source.awards ?? defaultAboutPageContent.awards;
  const cta = source.cta ?? defaultAboutPageContent.cta;
  const seo = source.seo ?? defaultAboutPageContent.seo;

  return {
    hero: {
      kicker: hero.kicker || defaultAboutPageContent.hero.kicker,
      headline: hero.headline || defaultAboutPageContent.hero.headline,
      body: hero.body || defaultAboutPageContent.hero.body,
      imageUrl: hero.imageUrl || defaultAboutPageContent.hero.imageUrl,
      primaryCtaLabel: hero.primaryCtaLabel || defaultAboutPageContent.hero.primaryCtaLabel,
      primaryCtaHref: hero.primaryCtaHref || defaultAboutPageContent.hero.primaryCtaHref,
      secondaryCtaLabel: hero.secondaryCtaLabel || defaultAboutPageContent.hero.secondaryCtaLabel,
      secondaryCtaHref: hero.secondaryCtaHref || defaultAboutPageContent.hero.secondaryCtaHref,
      stats: (Array.isArray(hero.stats) ? hero.stats : defaultAboutPageContent.hero.stats).map((item, index) => {
        const fallback = defaultAboutPageContent.hero.stats[index] ?? defaultAboutPageContent.hero.stats[0];
        const value = item as Partial<AboutStatCard>;
        return {
          value: value.value || fallback.value,
          label: value.label || fallback.label,
          enabled: value.enabled ?? true
        };
      })
    },
    story: {
      title: story.title || defaultAboutPageContent.story.title,
      body: story.body || defaultAboutPageContent.story.body,
      secondaryBody: story.secondaryBody || defaultAboutPageContent.story.secondaryBody,
      imageUrl: story.imageUrl || defaultAboutPageContent.story.imageUrl,
      imageAlt: story.imageAlt || story.title || defaultAboutPageContent.story.imageAlt
    },
    whatWeDo: {
      title: whatWeDo.title || defaultAboutPageContent.whatWeDo.title,
      subtitle: whatWeDo.subtitle || defaultAboutPageContent.whatWeDo.subtitle,
      cards: normalizeAboutCards<AboutBentoCard>(whatWeDo.cards, defaultAboutPageContent.whatWeDo.cards, (value, fallback, index) => ({
        icon: value.icon || fallback.icon,
        title: value.title || fallback.title,
        description: value.description || fallback.description,
        displayOrder: numericValue(value.displayOrder, index + 1),
        enabled: value.enabled ?? true
      }))
    },
    markets: {
      title: markets.title || defaultAboutPageContent.markets.title,
      subtitle: markets.subtitle || defaultAboutPageContent.markets.subtitle,
      cards: normalizeAboutCards<AboutMarketCard>(markets.cards, defaultAboutPageContent.markets.cards, (value, fallback, index) => ({
        icon: value.icon || fallback.icon,
        region: value.region || fallback.region,
        description: value.description || fallback.description,
        displayOrder: numericValue(value.displayOrder, index + 1),
        enabled: value.enabled ?? true
      }))
    },
    whyUs: {
      title: whyUs.title || defaultAboutPageContent.whyUs.title,
      subtitle: whyUs.subtitle || defaultAboutPageContent.whyUs.subtitle,
      points: normalizeAboutCards<AboutWhyPoint>(whyUs.points, defaultAboutPageContent.whyUs.points, (value, fallback, index) => ({
        icon: value.icon || fallback.icon,
        title: value.title || fallback.title,
        description: value.description || fallback.description,
        displayOrder: numericValue(value.displayOrder, index + 1),
        enabled: value.enabled ?? true
      }))
    },
    awards: {
      title: awards.title || defaultAboutPageContent.awards.title,
      subtitle: awards.subtitle || defaultAboutPageContent.awards.subtitle,
      logos: normalizeAboutCards<AboutLogoItem>(awards.logos, defaultAboutPageContent.awards.logos, (value, fallback, index) => ({
        name: value.name || fallback.name,
        imageUrl: value.imageUrl || fallback.imageUrl,
        href: value.href ?? fallback.href,
        enabled: value.enabled ?? true,
        displayOrder: numericValue(value.displayOrder, index + 1)
      }))
    },
    cta: {
      headline: cta.headline || defaultAboutPageContent.cta.headline,
      body: cta.body || defaultAboutPageContent.cta.body,
      primaryCtaLabel: cta.primaryCtaLabel || defaultAboutPageContent.cta.primaryCtaLabel,
      primaryCtaHref: cta.primaryCtaHref || defaultAboutPageContent.cta.primaryCtaHref,
      secondaryCtaLabel: cta.secondaryCtaLabel || defaultAboutPageContent.cta.secondaryCtaLabel,
      secondaryCtaHref: cta.secondaryCtaHref || defaultAboutPageContent.cta.secondaryCtaHref,
      tertiaryCtaLabel: cta.tertiaryCtaLabel || defaultAboutPageContent.cta.tertiaryCtaLabel,
      tertiaryCtaHref: cta.tertiaryCtaHref || defaultAboutPageContent.cta.tertiaryCtaHref,
      backgroundImageUrl: cta.backgroundImageUrl ?? defaultAboutPageContent.cta.backgroundImageUrl,
      backgroundColor: cta.backgroundColor || defaultAboutPageContent.cta.backgroundColor
    },
    seo: {
      title: seo.title || defaultAboutPageContent.seo.title,
      description: seo.description || defaultAboutPageContent.seo.description,
      ogImageUrl: seo.ogImageUrl || defaultAboutPageContent.seo.ogImageUrl,
      canonicalUrl: seo.canonicalUrl || defaultAboutPageContent.seo.canonicalUrl
    }
  };
}

export async function getHomepageHeroContent(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.hero", defaultHeroContent, mode);
}

export async function getHomepageFeatures(mode: "draft" | "published" = "published") {
  return getSiteSettingMode("homepage.features", defaultHomepageFeatures, mode);
}

export async function getHomepageFeaturedResortsSetting(mode: "draft" | "published" = "published") {
  const entry = await getSiteSettingMode("homepage.featuredResorts", defaultHomepageFeaturedResorts, mode);
  return {
    ...entry,
    content: normalizeHomepageFeaturedResorts(entry.content)
  };
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
  const entry = await getSiteSettingMode("site.navbar", defaultNavbarContent, mode);
  return {
    ...entry,
    content: normalizeNavbarContent(entry.content)
  };
}

export async function getAdminLoginContent(mode: "draft" | "published" = "published") {
  const entry = await getSiteSettingMode("admin.login", defaultAdminLoginContent, mode);
  return {
    ...entry,
    content: normalizeAdminLoginContent(entry.content)
  };
}

export async function getAboutPageContent(mode: "draft" | "published" = "published") {
  const entry = await getSiteSettingMode("site.about", defaultAboutPageContent, mode);
  return {
    ...entry,
    content: normalizeAboutPageContent(entry.content)
  };
}

export async function getFooterContent(mode: "draft" | "published" = "published") {
  const entry = await getSiteSettingMode("site.footer", defaultFooterContent, mode);
  return {
    ...entry,
    content: normalizeFooterContent(entry.content)
  };
}

export async function getCatalogueContent(kind: CatalogueKind, mode: "draft" | "published" = "published") {
  const fallback = defaultCatalogueContent[kind];
  const entry = await getSiteSettingMode(`catalogue.${kind}`, fallback, mode);
  const saved = entry.content as CatalogueContent & {
    bannerImageUrl?: string;
    bannerTitle?: string;
    bannerSubtitle?: string;
    subtitle?: string;
  };
  return {
    ...entry,
    content: {
      heroImageUrl: saved.heroImageUrl?.trim() || saved.bannerImageUrl?.trim() || fallback.heroImageUrl,
      title: saved.title?.trim() || saved.bannerTitle?.trim() || fallback.title,
      body: saved.body?.trim() || saved.bannerSubtitle?.trim() || saved.subtitle?.trim() || fallback.body,
      eyebrow: saved.eyebrow?.trim() || fallback.eyebrow
    }
  };
}

export async function getContactPageContent(mode: "draft" | "published" = "published") {
  const entry = await getSiteSettingMode("site.contact", defaultContactPageContent, mode);
  return {
    ...entry,
    content: normalizeContactPageContent(entry.content)
  };
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
  await requireAdminRole(["super_admin", "admin", "content_manager"]);
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
  await requireAdminRole(["super_admin", "admin", "content_manager"]);
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
