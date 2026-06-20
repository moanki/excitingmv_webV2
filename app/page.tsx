import Link from "next/link";
import { ArrowRight, Building2, Clock3, Globe2, Headphones, MapPin, Search, Star } from "lucide-react";

import { GlobalMarketMap } from "@/components/global-market-map";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { PartnerModalButton } from "@/components/partner-modal-button";
import { ServicesParallax } from "@/components/services-parallax";
import { WhyUsParallax } from "@/components/why-us-parallax";
import { optimizedImageUrl } from "@/lib/image-urls";
import { listHomepageFeaturedResorts } from "@/lib/services/resort-service";
import type { ResortSummary } from "@/lib/types";
import {
  getHomepageAwardsContent,
  getHomepageCeoContent,
  getHomepageFeatures,
  getHomepageGuide,
  getHomepageHeroContent,
  getHomepageNewsletterContent,
  getHomepageServices,
  getHomepageStats,
  getHomepageStoryContent,
  getHomepageWhyUs,
  getMarketSettings,
  getNavbarContent,
  type HomepageGuideItem,
  type HomepageStat,
  type MarketSettings,
  type NavbarContent,
} from "@/lib/site-content";

const featuredImages = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=80"
];

const heroFallback =
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=2200&q=85";

const serviceImages = [
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=90"
];

const whyImages = [
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1800&q=90"
];

const marketDescriptions = [
  "Established partner demand for premium island stays.",
  "Long-haul luxury advisors and specialist tour operators.",
  "High-value family, wellness, and celebration travel.",
  "Fast-growing regional access and destination familiarity.",
  "Strategic luxury demand across emerging partner networks."
];

const marketStatuses = ["Core", "Core", "Strategic", "Growth", "Strategic"];

const partnerBenefits = ["Priority Support", "Exclusive Rates", "Access to Offers"];

const defaultPartnerLogos = ["Soneva", "JOALI", "Patina", "Milaidhoo", "Baros", "Anantara"];

function logoScaleClass(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("vakkaru")) return "logo-vakkaru";
  if (normalized.includes("waldorf")) return "logo-waldorf";
  if (normalized.includes("finolhu")) return "logo-finolhu";
  if (normalized.includes("joali")) return "logo-joali";
  if (normalized.includes("halcyon")) return "logo-halcyon";

  return "";
}

function normalizeHeroDescription(description?: string | null) {
  const fallback = "Curated resorts, protected trade resources, and local destination expertise for global travel partners.";
  const source = description?.trim() || fallback;

  if (source.toLowerCase() === "curated destination management for travel specialist") {
    return "Curated destination management for luxury travel specialists.";
  }

  if (source.toLowerCase() === "curated destination management for travel specialists") {
    return "Curated destination management for luxury travel specialists.";
  }

  return source;
}

function pickResortImage(index: number) {
  return featuredImages[index % featuredImages.length];
}

function formatAtoll(location?: string | null) {
  if (!location) {
    return "Maldives";
  }

  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.find((part) => /atoll/i.test(part)) || parts[0] || "Maldives";
}

function isVideoAsset(url: string, mediaType?: string) {
  return mediaType === "video" || /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
}

function getStat(stats: HomepageStat[], label: string, fallback: string) {
  return stats.find((item) => item.label.toLowerCase().includes(label.toLowerCase()))?.value || fallback;
}

function getHeroStats(stats: HomepageStat[]) {
  return [
    { value: getStat(stats, "resort", "198+"), label: "Resorts" },
    { value: getStat(stats, "experience", "20+"), label: "Years Experience" },
    { value: getStat(stats, "support", "24/7"), label: "Local Support" },
    { value: getStat(stats, "partner", "Global"), label: "Travel Partners" }
  ];
}

function StatIcon({ label }: { label: string }) {
  const normalized = label.toLowerCase();

  if (normalized.includes("experience") || normalized.includes("year")) {
    return <Clock3 size={18} strokeWidth={1.8} aria-hidden="true" />;
  }

  if (normalized.includes("support")) {
    return <Headphones size={18} strokeWidth={1.8} aria-hidden="true" />;
  }

  if (normalized.includes("partner")) {
    return <Globe2 size={18} strokeWidth={1.8} aria-hidden="true" />;
  }

  return <Building2 size={18} strokeWidth={1.8} aria-hidden="true" />;
}

function MarketEditorial({ markets }: { markets: MarketSettings }) {
  const displayMarkets = markets.options.slice(0, 5);

  return (
    <div className="market-editorial">
      <div className="market-editorial__copy">
        <p className="lux-eyebrow">{markets.sectionTitle || "Global Markets"}</p>
        <h2>{markets.heading}</h2>
        <p>{markets.description}</p>
        <div className="market-editorial__rows">
          {displayMarkets.map((market, index) => (
            <div className="market-editorial__row" key={market.id}>
              <strong>{market.label || market.region || `Market ${index + 1}`}</strong>
              <span>{market.region || marketDescriptions[index] || "Focused trade relationships and partner support."}</span>
              <em>{marketStatuses[index] || "Active"}</em>
            </div>
          ))}
        </div>
      </div>

      <div className="market-editorial__visual">
        <div className="market-editorial__map">
          <GlobalMarketMap markets={markets.options} />
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false
}: {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
}) {
  return (
    <div className={`lux-section-heading${light ? " lux-section-heading--light" : ""}`}>
      <p className="lux-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

function FeaturedRetreats({
  resorts,
  title,
  description
}: {
  resorts: ResortSummary[];
  title?: string;
  description?: string;
}) {
  const displayItems = resorts.length
    ? resorts.map((resort, index) => ({
        href: `/resorts/${resort.slug}`,
        image: resort.heroImageUrl || pickResortImage(index),
        type: resort.category || "Luxury Resort",
        title: resort.name,
        atoll: formatAtoll(resort.location),
        cta: "View more"
      }))
    : [
        {
          href: "/resorts",
          image: pickResortImage(0),
          type: "Resort Portfolio",
          title: "Curated private-island retreats",
          atoll: "Maldives luxury collection",
          cta: "View more"
        },
        {
          href: "/resorts",
          image: pickResortImage(3),
          type: "Trade Intelligence",
          title: "Partner-ready island positioning",
          atoll: "Rates, offers, access, and fit",
          cta: "View more"
        }
      ];

  return (
    <section className="lux-section lux-section--white" id="featured-retreats">
      <div className="lux-container">
        <div className="lux-heading-row">
          <SectionHeading
            eyebrow="Featured Retreats"
            title={title || "A luxury resort portfolio shaped for trade conversations"}
            description={description || "Image-led island intelligence for advisors, operators, and contracting teams."}
          />
          <Link href="/resorts" className="lux-text-link">
            View all resorts <ArrowRight size={16} />
          </Link>
        </div>

        <div className="lux-retreat-carousel" aria-label="Featured resort portfolio">
          {displayItems.map((item, index) => (
            <Link href={item.href} key={`${item.href}-${item.title}-${index}`} className="lux-retreat-card">
              <div
                className="lux-retreat-card__image"
                style={{ backgroundImage: `url(${optimizedImageUrl(item.image, { width: 620, height: 460, quality: 74 })})` }}
              />
              <div className="lux-retreat-card__shade" />
              <div className="lux-retreat-card__content">
                <h3>{item.title}</h3>
                <p><MapPin size={14} strokeWidth={1.8} />{item.atoll}</p>
                <span><Star size={14} strokeWidth={1.8} />{item.type}</span>
                <strong>{item.cta} <ArrowRight size={15} /></strong>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TravelGuideMagazine({ guide }: { guide: HomepageGuideItem[] }) {
  const articles = guide.filter((item) => item.title && item.published).slice(0, 5);

  return (
    <section className="lux-section lux-section--white" id="maldives-travel-guide">
      <div className="lux-container">
        <div className="lux-heading-row">
          <SectionHeading
            eyebrow="Maldives Travel Guide"
            title="Editorial intelligence for sharper destination selling"
            description="Partner-facing insight on geography, seasonality, transfers, room types, and client fit."
          />
          <Link href="/travel-guide" className="lux-text-link">
            View all insights <ArrowRight size={16} />
          </Link>
        </div>
        <div className="lux-guide-carousel" aria-label="Maldives travel guide insights">
          {articles.map((item, index) => (
            <article className="lux-guide-card" key={`${item.title}-${index}`}>
              <div
                className="lux-guide-card__image"
                style={{
                  backgroundImage: `url(${optimizedImageUrl(item.imageUrl || pickResortImage(index + 1), { width: 520, height: 360, quality: 74 })})`
                }}
              />
              <div className="lux-guide-card__content">
                <span>{item.category}</span>
                <h3>{item.title}</h3>
                <p>{item.summary || item.description}</p>
                <Link href={`/travel-guide/${item.slug}`}>Read insight <ArrowRight size={15} /></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function shortText(value: string | undefined, fallback = "", maxLength = 148) {
  const source = (value || fallback).replace(/\s+/g, " ").trim();
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength).trim()}...`;
}

function MobileHomeV2({
  hero,
  navbar,
  stats,
  resorts,
  ceo,
  story,
  markets,
  services,
  whyUs,
  awards,
  guide,
  newsletter,
  marketLabels
}: {
  hero: Awaited<ReturnType<typeof getHomepageHeroContent>>["content"];
  navbar: NavbarContent;
  stats: HomepageStat[];
  resorts: ResortSummary[];
  ceo: Awaited<ReturnType<typeof getHomepageCeoContent>>["content"];
  story: Awaited<ReturnType<typeof getHomepageStoryContent>>["content"];
  markets: MarketSettings;
  services: Awaited<ReturnType<typeof getHomepageServices>>["content"];
  whyUs: Awaited<ReturnType<typeof getHomepageWhyUs>>["content"];
  awards: Awaited<ReturnType<typeof getHomepageAwardsContent>>["content"];
  guide: HomepageGuideItem[];
  newsletter: Awaited<ReturnType<typeof getHomepageNewsletterContent>>["content"];
  marketLabels: string[];
}) {
  const heroImage = hero.mediaUrl || heroFallback;
  const logoUrl = navbar.whiteLogoUrl || navbar.primaryLogoUrl || navbar.blackLogoUrl;
  const partnerLoginHref = navbar.partnerLoginHref || navbar.ctaHref || "/partner/login";
  const mobileStats = getHeroStats(stats);
  const displayResorts = resorts.length ? resorts : [];
  const featuredCarouselItems = displayResorts.length
    ? displayResorts.slice(0, 5).map((resort, index) => ({
        href: `/resorts/${resort.slug}`,
        image: resort.heroImageUrl || pickResortImage(index),
        title: resort.name,
        location: [formatAtoll(resort.location), resort.category || resort.transferType || "Luxury"].filter(Boolean).join(" — ")
      }))
    : [
        {
          href: "/resorts",
          image: pickResortImage(0),
          title: "Curated Private-Island Retreats",
          location: "Maldives — Luxury"
        },
        {
          href: "/resorts",
          image: pickResortImage(1),
          title: "Partner-Ready Island Escapes",
          location: "Maldives — Trade Intelligence"
        }
      ];
  const primaryResort = displayResorts[0];
  const secondaryResorts = displayResorts.slice(1, 7);
  const configuredLogos = (hero.featuredResortLogos ?? []).filter((item) => item.enabled && (item.imageUrl || item.name));
  const tickerLogos = configuredLogos.length
    ? configuredLogos
    : (displayResorts.length
        ? displayResorts.map((resort) => ({ enabled: true, name: resort.name, imageUrl: "" }))
        : defaultPartnerLogos.map((name) => ({ enabled: true, name, imageUrl: "" })));
  const logoItems = [...tickerLogos, ...tickerLogos]
    .slice(0, 12);
  const activeMarkets = markets.options.filter((market) => market.enabled).slice(0, 4);
  const displayServices = services.filter((service) => service.enabled && service.title).slice(0, 4);
  const displayWhy = whyUs.filter((item) => item.title).slice(0, 3);
  const displayAwards = awards.items.filter((item) => item.enabled && (item.imageUrl || item.name)).slice(0, 4);
  const displayGuides = guide.filter((item) => item.published && item.title).slice(0, 4);

  return (
    <div className="mobile-v2-home" aria-label="Exciting Maldives mobile home">
      <section className="mv2-hero">
        <div
          className="mv2-hero__bg"
          style={{ backgroundImage: `url(${optimizedImageUrl(heroImage, { width: 900, height: 1250, quality: 84 })})` }}
        />
        <div className="mv2-hero__shade" />
        <div className="mv2-hero__nav">
          {logoUrl ? <img src={optimizedImageUrl(logoUrl, { width: 260, height: 120, quality: 90, resize: "contain" })} alt={navbar.brandLabel || "Exciting Maldives"} /> : <strong>{navbar.brandLabel || "Exciting Maldives"}</strong>}
          <Link href="/resorts" className="mv2-icon-button" aria-label="Search properties">
            <Search size={18} />
          </Link>
        </div>
        <div className="mv2-hero__copy">
          <p>{hero.eyebrow || "Luxury B2B Partner Platform"}</p>
          <h1>{hero.title || "The Art of Maldivian Luxury"}</h1>
          <div className="mv2-hero__actions">
            <Link href={hero.primaryCtaHref || "/resorts"} className="mv2-btn mv2-btn--white">
              {hero.primaryCtaLabel || "Explore Properties"}
            </Link>
            <PartnerModalButton className="mv2-btn mv2-btn--ghost">
              {hero.secondaryCtaLabel || "Become a Partner"}
            </PartnerModalButton>
          </div>
        </div>

        {logoItems.length ? (
          <div className="mv2-ticker" aria-label="Featured retreat logos">
            <div className="mv2-ticker__track">
              {logoItems.map((logo, index) => (
                <span className="mv2-ticker__item" key={`${logo.name}-${index}`}>
                  {logo.imageUrl ? (
                    <img src={optimizedImageUrl(logo.imageUrl, { width: 260, height: 120, quality: 94, resize: "contain" })} alt={logo.name || "Featured retreat"} />
                  ) : (
                    logo.name
                  )}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mv2-stats" aria-label="Exciting Maldives stats">
        {mobileStats.map((stat) => (
          <div className="mv2-stat" key={`${stat.value}-${stat.label}`}>
            <strong>{stat.value}</strong>
            <span>{stat.label.replace("Years Experience", "Yrs Exp.")}</span>
          </div>
        ))}
      </section>

      <section
        className="mv2-section mv2-section--white mv2-destination-panel"
        id="mobile-destinations"
        aria-labelledby="mobile-destinations-title"
      >
        <p className="mv2-eyebrow">Destinations</p>
        <h2 id="mobile-destinations-title">Choose your Maldives stay style</h2>
        <div className="mv2-destination-tabs" role="tablist" aria-label="Destination categories">
          <Link href="/resorts" className="mv2-destination-tab is-active" role="tab" aria-selected="true">
            Resorts
          </Link>
          <Link href="/hotels" className="mv2-destination-tab" role="tab" aria-selected="false">
            Hotels
          </Link>
          <Link href="/liveaboards" className="mv2-destination-tab" role="tab" aria-selected="false">
            Liveaboards
          </Link>
        </div>
      </section>

      <section className="mv2-section mv2-section--white mv2-focus-retreats" id="mobile-featured-retreats">
        <div className="mv2-focus-retreats__head">
          <span>Featured Retreats</span>
          <span><b>01</b> / {String(featuredCarouselItems.length).padStart(2, "0")}</span>
        </div>

        <div className="mv2-focus-retreats__track" aria-label="Featured resort carousel">
          <span className="mv2-focus-retreats__spacer" aria-hidden="true" />
          {featuredCarouselItems.map((retreat, index) => (
            <Link href={retreat.href} className="mv2-focus-retreat" key={`${retreat.href}-${retreat.title}-${index}`}>
              <div className="mv2-focus-retreat__frame">
                <img
                  src={optimizedImageUrl(retreat.image, { width: 760, height: 980, quality: 84 })}
                  alt={retreat.title}
                  loading="lazy"
                />
              </div>
              <h3>{retreat.title}</h3>
              <p>{retreat.location}</p>
              <span>Enquire about this retreat</span>
            </Link>
          ))}
          <span className="mv2-focus-retreats__spacer" aria-hidden="true" />
        </div>

        {primaryResort ? (
          <Link href={`/resorts/${primaryResort.slug}`} className="mv2-big-card">
            <div
              className="mv2-big-card__bg"
              style={{ backgroundImage: `url(${optimizedImageUrl(primaryResort.heroImageUrl || pickResortImage(0), { width: 800, height: 620, quality: 88 })})` }}
            />
            <div className="mv2-big-card__shade" />
            <div className="mv2-big-card__body">
              <span>★ {primaryResort.category || "Luxury Resort"}</span>
              <strong>{primaryResort.name}</strong>
              <p>{[formatAtoll(primaryResort.location), primaryResort.transferType].filter(Boolean).join(" · ")}</p>
            </div>
          </Link>
        ) : null}

        <div className="mv2-card-scroll">
          {secondaryResorts.map((resort, index) => (
            <Link href={`/resorts/${resort.slug}`} className="mv2-property-card" key={resort.id}>
              <div
                className="mv2-property-card__bg"
                style={{ backgroundImage: `url(${optimizedImageUrl(resort.heroImageUrl || pickResortImage(index + 1), { width: 620, height: 520, quality: 86 })})` }}
                role="img"
                aria-label={resort.name}
              />
              <div className="mv2-property-card__shade" />
              <div className="mv2-property-card__body">
                <span>{resort.category || "Luxury Resort"}</span>
                <strong>{resort.name}</strong>
                <p>{[formatAtoll(resort.location), resort.transferType].filter(Boolean).join(" · ")}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mv2-section mv2-section--paper">
        <p className="mv2-eyebrow">{ceo.sectionLabel || "CEO's Message"}</p>
        <article className="mv2-ceo">
          <div className="mv2-ceo__top">
            {ceo.photoUrl ? <img src={optimizedImageUrl(ceo.photoUrl, { width: 120, height: 120, quality: 80 })} alt={ceo.name} /> : <span>{ceo.name?.charAt(0) || "E"}</span>}
            <div>
              <strong>{ceo.name}</strong>
              <p>{ceo.title}</p>
            </div>
          </div>
          <h2>{ceo.quote}</h2>
          <p>{shortText(ceo.message, "", 210)}</p>
          <Link href="/about" className="mv2-read-more-link">Read more <ArrowRight size={14} /></Link>
        </article>
      </section>

      <section className="mv2-section mv2-section--white">
        <p className="mv2-eyebrow">{story.sectionLabel || "Our Story"}</p>
        <h2>{story.title}</h2>
        <img className="mv2-story-image" src={optimizedImageUrl(story.imageUrl || featuredImages[1], { width: 760, height: 520, quality: 84 })} alt="Exciting Maldives story" loading="lazy" />
        <p className="mv2-muted-copy">{shortText(story.description, "", 230)}</p>
        <Link href="/about" className="mv2-inline-link">Read more <ArrowRight size={14} /></Link>
      </section>

      <section className="mv2-section mv2-section--paper">
        <p className="mv2-eyebrow">PRIMARY MARKETS</p>
        <h2>Connected to Premium Markets</h2>
        <p className="mv2-subcopy">Supporting travel designers and agencies across global markets.</p>
        <div className="mv2-editorial-visual mv2-editorial-visual--map" aria-label="Primary markets map">
          <GlobalMarketMap
            markets={markets.options}
            labelledMap
            initialViewState={{
              longitude: 28,
              latitude: 18,
              zoom: 0.72
            }}
          />
        </div>
        <div className="mv2-market-list mv2-editorial-text-list" aria-label="Primary travel markets">
          {activeMarkets.map((market, index) => (
            <div className="mv2-market-row" key={market.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{market.label || market.region}</strong>
              <em>{market.region || marketStatuses[index] || "Active"}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="mv2-section mv2-section--white">
        <p className="mv2-eyebrow">DESTINATION MANAGEMENT</p>
        <h2>Built around every Maldives booking.</h2>
        <p className="mv2-subcopy">Local precision across every stage of the journey.</p>
        <img
          className="mv2-story-image mv2-editorial-image"
          src={optimizedImageUrl(serviceImages[0], { width: 760, height: 520, quality: 84 })}
          alt="Destination management in the Maldives"
          loading="lazy"
        />
        <div className="mv2-service-grid mv2-editorial-text-list" aria-label="Destination management services">
          {displayServices.map((service, index) => (
            <article className="mv2-service" key={`${service.title}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mv2-section mv2-section--paper">
        <p className="mv2-eyebrow">WHY TRAVEL DESIGNERS CHOOSE US</p>
        <h2>Local precision for more than a resort list.</h2>
        <p className="mv2-subcopy">Commercial fluency and resort relationships that protect high-value bookings.</p>
        <img
          className="mv2-story-image mv2-editorial-image"
          src={optimizedImageUrl(whyImages[0], { width: 760, height: 520, quality: 84 })}
          alt="Travel designer support in the Maldives"
          loading="lazy"
        />
        <div className="mv2-why-list mv2-editorial-text-list" aria-label="Why travel designers choose us">
          {displayWhy.map((item, index) => (
            <article className="mv2-why-card" key={`${item.title}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {displayAwards.length ? (
        <section className="mv2-section mv2-section--white">
          <p className="mv2-eyebrow">Prestigious Awards</p>
          <h2>{awards.title}</h2>
          <p className="mv2-subcopy">{awards.summary}</p>
          <div className="mv2-award-scroll">
            {displayAwards.map((award) => (
              <div className="mv2-award-card" key={award.name || award.imageUrl}>
                {award.imageUrl ? <img src={optimizedImageUrl(award.imageUrl, { width: 240, height: 140, quality: 88, resize: "contain" })} alt={award.name || "Award"} loading="lazy" /> : null}
                <strong>{award.name}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mv2-section mv2-section--paper">
        <div className="mv2-section__header">
          <div>
            <p className="mv2-eyebrow">MALDIVES TRAVEL GUIDE</p>
            <h2>Editorial intelligence for sharper selling</h2>
          </div>
          <Link href="/travel-guide">All insights</Link>
        </div>
        <div className="mv2-insight-list">
          {displayGuides.map((item) => (
            <Link href={`/travel-guide/${item.slug}`} className="mv2-insight" key={item.slug}>
              <div
                className="mv2-insight__image"
                style={{
                  backgroundImage: `url(${optimizedImageUrl(item.imageUrl || pickResortImage(1), { width: 760, height: 460, quality: 78 })})`
                }}
                aria-hidden="true"
              >
                <span>{item.category || "Destination Insight"}</span>
              </div>
              <div>
                <strong>{item.title}</strong>
                <p>{item.summary || item.description}</p>
                <em>Read Insight <ArrowRight size={14} /></em>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mv2-section mv2-section--white">
        <div className="mv2-partner-cta">
          <h2>Join Our Global Network of Travel Professionals</h2>
          <p>Apply for protected access to curated resort intelligence, trade-ready offers, and responsive Maldives support.</p>
          <div className="mv2-perks">
            {partnerBenefits.map((benefit) => <span key={benefit}>{benefit}</span>)}
          </div>
          <PartnerModalButton className="mv2-cta mv2-cta--dark">Become a Travel Partner</PartnerModalButton>
          <Link href={partnerLoginHref} className="mv2-cta mv2-cta--light">Partner Login</Link>
        </div>
      </section>

      <section className="mv2-section mv2-section--paper">
        <p className="mv2-eyebrow">{newsletter.sectionLabel || "Stay Connected"}</p>
        <h2>{newsletter.title || "Be in Touch"}</h2>
        <p className="mv2-subcopy">{newsletter.description}</p>
        <div className="mv2-newsletter-card">
          <NewsletterSignupForm markets={marketLabels.length ? marketLabels : defaultPartnerLogos} />
        </div>
      </section>
    </div>
  );
}

export default async function HomePage() {
  const [
    { content: hero },
    { content: homepageHighlights },
    { content: stats },
    { content: ceo },
    { content: story },
    { content: services },
    { content: whyUs },
    { content: awards },
    { content: guide },
    { content: newsletter },
    { content: markets },
    { content: navbar },
    resorts
  ] = await Promise.all([
    getHomepageHeroContent("published"),
    getHomepageFeatures("published"),
    getHomepageStats("published"),
    getHomepageCeoContent("published"),
    getHomepageStoryContent("published"),
    getHomepageServices("published"),
    getHomepageWhyUs("published"),
    getHomepageAwardsContent("published"),
    getHomepageGuide("published"),
    getHomepageNewsletterContent("published"),
    getMarketSettings("published"),
    getNavbarContent("published"),
    listHomepageFeaturedResorts(5)
  ]);

  const activeMarkets = markets.options.filter((market) => market.enabled);
  const marketList = activeMarkets.length ? activeMarkets : markets.options;
  const marketLabels = marketList.map((market) => market.label);
  const featuredResorts = resorts.slice(0, 5);
  const configuredHeroLogos = (hero.featuredResortLogos ?? []).filter((item) => item.enabled && (item.name || item.imageUrl));
  const heroLogos = configuredHeroLogos.length
    ? configuredHeroLogos
    : (featuredResorts.length ? featuredResorts.map((resort) => ({ name: resort.name, imageUrl: "" })) : defaultPartnerLogos.map((name) => ({ name, imageUrl: "" })));
  const featuredRetreatHeading = homepageHighlights[0];
  const heroImage = hero.mediaUrl || heroFallback;

  return (
    <main className="home-page lux-home">
      <MobileHomeV2
        hero={hero}
        navbar={navbar}
        stats={stats}
        resorts={featuredResorts}
        ceo={ceo}
        story={story}
        markets={{ ...markets, options: marketList }}
        services={services}
        whyUs={whyUs}
        awards={awards}
        guide={guide}
        newsletter={newsletter}
        marketLabels={marketLabels}
      />

      <div className="lux-home__desktop">
      <section className="lux-hero">
        <div className="lux-hero__media">
          {hero.mediaUrl && isVideoAsset(hero.mediaUrl, hero.mediaType) ? (
            <video
              className="lux-hero__asset"
              src={hero.mediaUrl}
              poster={hero.mediaPosterUrl || undefined}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div
              className="lux-hero__asset"
              style={{ backgroundImage: `url(${optimizedImageUrl(heroImage, { width: 1800, height: 1100, quality: 84 })})` }}
            />
          )}
        </div>
        <div className="lux-hero__overlay" />
        <div className="lux-container lux-hero__inner">
          <div className="lux-hero__copy">
            <h1>{hero.title || "A Premium Maldives B2B Travel Ecosystem"}</h1>
            <p>{normalizeHeroDescription(hero.description)}</p>
            <div className="lux-hero__actions">
              <PartnerModalButton className="lux-button lux-button--glass">
                Become a Partner
              </PartnerModalButton>
            </div>
          </div>
        </div>
        <div className="lux-hero__mobile-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="lux-hero__retreat-logos" aria-label="Featured retreats">
          <div>
            {[...heroLogos.slice(0, 5), ...heroLogos.slice(0, 5)].map((logo, index) => (
              <span className={`lux-hero__retreat-logo-frame ${logoScaleClass(logo.name)}`} key={`${logo.name}-${index}`}>
                {logo.imageUrl ? (
                  <img
                    src={optimizedImageUrl(logo.imageUrl, { width: 360, height: 160, quality: 96, resize: "contain" })}
                    alt={logo.name || "Featured resort"}
                    width={220}
                    height={120}
                    loading="lazy"
                  />
                ) : (
                  logo.name
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      <FeaturedRetreats
        resorts={featuredResorts}
        title={featuredRetreatHeading?.title}
        description={featuredRetreatHeading?.description}
      />

      <section className="lux-section lux-section--sand" id="ceo-message">
        <div className="lux-container lux-editorial-split lux-editorial-split--ceo">
          <div className="lux-portrait-card">
            <div
              className="lux-portrait-card__image"
              style={{ backgroundImage: `url(${optimizedImageUrl(ceo.photoUrl || featuredImages[2], { width: 720, height: 560, quality: 76 })})` }}
            />
            <div className="lux-portrait-card__caption">
              <strong>{ceo.name}</strong>
              <span>{ceo.title}</span>
            </div>
          </div>
          <div className="lux-editorial-copy">
            <p className="lux-eyebrow">{ceo.sectionLabel}</p>
            <h2>&ldquo;{ceo.quote}&rdquo;</h2>
            <p className="lux-mobile-clamp-source">{ceo.message}</p>
            <details className="lux-mobile-readmore">
              <summary>Read more</summary>
              <p>{ceo.message}</p>
            </details>
            <div className="lux-signature">
              <strong>{ceo.name}</strong>
              <span>{ceo.title}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="lux-section lux-section--white" id="our-story">
        <div className="lux-container lux-story-split">
          <div className="lux-story-copy">
            <p className="lux-eyebrow">{story.sectionLabel}</p>
            <h2>{story.title}</h2>
            <p className="lux-mobile-clamp-source">{story.description}</p>
            <details className="lux-mobile-readmore">
              <summary>Read more</summary>
              <p>{story.description}</p>
            </details>
          </div>
          <div className="lux-story-image-panel">
            <div
              className="lux-story-panel__image"
              style={{ backgroundImage: `url(${optimizedImageUrl(story.imageUrl || featuredImages[1], { width: 760, height: 580, quality: 76 })})` }}
            />
          </div>
        </div>
      </section>

      <section className="lux-section lux-section--white market-editorial-section" id="primary-markets">
        <span className="section-anchor-alias" id="global-markets" aria-hidden="true" />
        <div className="lux-container">
          <MarketEditorial markets={{ ...markets, options: marketList }} />
        </div>
      </section>

      <section className="lux-stat-strip" aria-label="Exciting Maldives expertise stats">
        <div className="lux-container lux-stat-strip__grid">
          {getHeroStats(stats).map((item) => (
            <div className="lux-stat-strip__item" key={`${item.value}-${item.label}`}>
              <span className="lux-stat-strip__icon">
                <StatIcon label={item.label} />
              </span>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="lux-section lux-section--sand services-editorial-section" id="destination-management">
        <ServicesParallax
          services={services}
          images={serviceImages}
          title="Built around every Maldives booking."
          description="We support travel professionals with resort intelligence, transfer planning, arrival handling, and in-destination support — all managed with local precision."
        />
      </section>
      <section className="lux-section lux-section--white why-trust-section" id="why-travel-designers">
        <WhyUsParallax
          items={whyUs}
          images={whyImages}
          title="Why Travel Designers Choose Us"
          description="Local precision, commercial fluency, and resort relationships that protect high-value bookings."
        />
      </section>

      <section className="lux-section lux-section--white" id="prestigious-awards">
        <div className="lux-container lux-awards-container">
          <SectionHeading
            eyebrow="Prestigious Awards"
            title={awards.title}
            description={awards.summary || homepageHighlights[0]?.description || "Recognition across luxury travel and partner networks."}
          />
          <div className="lux-awards-strip">
            {awards.items
              .filter((item) => item.enabled && (item.name || item.imageUrl))
              .map((award) => (
                <div className="lux-award-logo" key={award.name || award.imageUrl}>
                  {award.imageUrl ? (
                    <img
                      src={optimizedImageUrl(award.imageUrl, { width: 240, height: 140, quality: 78, resize: "contain" })}
                      alt={award.name || "Award recognition"}
                      width={240}
                      height={140}
                      loading="lazy"
                    />
                  ) : (
                    <span>{award.name}</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="lux-partner-cta">
        <div className="lux-container lux-partner-cta__inner">
          <p className="lux-eyebrow">Partner Network</p>
          <h2>Join Our Global Network of Travel Professionals</h2>
          <p>
            Apply for protected access to curated resort intelligence, trade-ready offers, and responsive Maldives
            support from a team built around B2B luxury selling.
          </p>
          <div className="lux-benefit-pills">
            {partnerBenefits.map((benefit) => (
              <span key={benefit}>{benefit}</span>
            ))}
          </div>
          <PartnerModalButton className="lux-button lux-button--gold">
            Become a Travel Partner <ArrowRight size={16} />
          </PartnerModalButton>
        </div>
      </section>

      <TravelGuideMagazine guide={guide} />

      <section className="lux-contact-section" id="stay-connected">
        <span className="section-anchor-alias" id="newsletter" aria-hidden="true" />
        <div className="lux-container lux-contact-grid">
          <div className="lux-contact-copy">
            <p className="lux-eyebrow">{newsletter.sectionLabel}</p>
            <h2>{newsletter.title}</h2>
            <p>{newsletter.description}</p>
            <div className="lux-contact-assurance">
              <span>Trade-focused updates</span>
              <span>Human follow-up</span>
              <span>No noisy campaigns</span>
            </div>
            <div
              className="lux-contact-image"
              style={{ backgroundImage: `url(${optimizedImageUrl(newsletter.imageUrl || featuredImages[3], { width: 760, height: 560, quality: 76 })})` }}
            />
          </div>
          <div className="lux-contact-card">
            <NewsletterSignupForm markets={marketLabels.length ? marketLabels : defaultPartnerLogos} />
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}
