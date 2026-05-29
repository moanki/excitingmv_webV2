import Link from "next/link";
import { ArrowRight, Building2, Clock3, Globe2, Headphones, MapPin, Star } from "lucide-react";

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
  type HomepageGuideItem,
  type HomepageStat,
  type MarketSettings,
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

function getMarketDisplayLabel(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("middle east")) {
    return "Middle East & GCC";
  }

  if (normalized.includes("south asia")) {
    return "India & South Asia";
  }

  return label;
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
              <strong>{getMarketDisplayLabel(market.label)}</strong>
              <span>{marketDescriptions[index] || "Focused trade relationships and partner support."}</span>
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
    <section className="lux-section lux-section--white">
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
    <section className="lux-section lux-section--white">
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
            <p>
              {hero.description ||
                "Curated resorts, protected trade resources, and local destination expertise for global travel partners."}
            </p>
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

      <section className="lux-section lux-section--sand">
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

      <section className="lux-section lux-section--white">
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

      <section className="lux-section lux-section--white market-editorial-section" id="global-markets">
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

      <section className="lux-section lux-section--sand services-editorial-section">
        <ServicesParallax
          services={services}
          images={serviceImages}
          title="Built around every Maldives booking."
          description="We support travel professionals with resort intelligence, transfer planning, arrival handling, and in-destination support — all managed with local precision."
        />
      </section>
      <section className="lux-section lux-section--white why-trust-section">
        <WhyUsParallax
          items={whyUs}
          images={whyImages}
          title="Why Travel Designers Choose Us"
          description="Local precision, commercial fluency, and resort relationships that protect high-value bookings."
        />
      </section>

      <section className="lux-section lux-section--white">
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

      <section className="lux-contact-section" id="newsletter">
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
    </main>
  );
}
