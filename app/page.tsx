import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { GlobalMarketMap } from "@/components/global-market-map";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { ServicesParallax } from "@/components/services-parallax";
import { WhyUsParallax } from "@/components/why-us-parallax";
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
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=90"
];

const whyImages = [
  "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=90"
];

const partnerBenefits = ["Priority Support", "Exclusive Rates", "Access to Offers"];

const defaultPartnerLogos = ["Soneva", "JOALI", "Patina", "Milaidhoo", "Baros", "Anantara"];

function pickResortImage(index: number) {
  return featuredImages[index % featuredImages.length];
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

function FeaturedRetreats({ resorts }: { resorts: ResortSummary[] }) {
  const displayItems = resorts.length
    ? resorts.map((resort, index) => ({
        href: `/resorts/${resort.slug}`,
        image: resort.heroImageUrl || pickResortImage(index),
        eyebrow: resort.category || "Luxury Resort",
        title: resort.name,
        meta: `${resort.location || "Maldives"}${resort.transferType ? ` · ${resort.transferType}` : ""}`,
        cta: "View partner profile"
      }))
    : [
        {
          href: "/resorts",
          image: pickResortImage(0),
          eyebrow: "Resort Portfolio",
          title: "Curated private-island retreats",
          meta: "Maldives luxury collection",
          cta: "Explore the collection"
        },
        {
          href: "/resorts",
          image: pickResortImage(3),
          eyebrow: "Trade Intelligence",
          title: "Partner-ready island positioning",
          meta: "Rates, offers, access, and fit",
          cta: "Explore the collection"
        }
      ];

  return (
    <section className="lux-section lux-section--ivory">
      <div className="lux-container">
        <div className="lux-heading-row">
          <SectionHeading
            eyebrow="Featured Retreats"
            title="A luxury resort portfolio shaped for trade conversations"
            description="Image-led island intelligence for advisors, operators, and contracting teams."
          />
          <Link href="/resorts" className="lux-text-link">
            View all resorts <ArrowRight size={16} />
          </Link>
        </div>

        <div className="lux-retreat-carousel" aria-label="Featured resort portfolio">
          {[...displayItems, ...displayItems].map((item, index) => (
            <Link href={item.href} key={`${item.href}-${item.title}-${index}`} className="lux-retreat-card">
              <div
                className="lux-retreat-card__image"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="lux-retreat-card__shade" />
              <div className="lux-retreat-card__content">
                <span>{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.meta}</p>
                <strong>{item.cta} <ArrowRight size={15} /></strong>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStats({ stats }: { stats: HomepageStat[] }) {
  const displayStats = stats.length ? stats : getHeroStats([]);

  return (
    <section className="lux-trust-band" aria-label="Exciting Maldives partner credibility">
      <div className="lux-container lux-trust-band__grid">
        {displayStats.map((item) => (
          <div className="lux-trust-card" key={`${item.value}-${item.label}`}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TravelGuideMagazine({ guide }: { guide: HomepageGuideItem[] }) {
  const articles = guide.filter((item) => item.title);

  return (
    <section className="lux-section lux-section--ivory">
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
          {[...articles, ...articles].map((item, index) => (
            <article className="lux-guide-card" key={`${item.title}-${index}`}>
              <div className="lux-guide-card__image" style={{ backgroundImage: `url(${item.imageUrl || pickResortImage(index + 1)})` }} />
              <div className="lux-guide-card__content">
                <span>{item.category}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Link href="/travel-guide">Read insight <ArrowRight size={15} /></Link>
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
  const partnerLogos = defaultPartnerLogos;
  const featuredResorts = resorts.slice(0, 5);
  const heroStats = getHeroStats(stats);
  const heroImage = hero.mediaUrl || heroFallback;

  return (
    <main className="home-page lux-home">
      <section className="lux-hero">
        <div className="lux-hero__media">
          {hero.mediaUrl && hero.mediaType === "video" ? (
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
            <div className="lux-hero__asset" style={{ backgroundImage: `url(${heroImage})` }} />
          )}
        </div>
        <div className="lux-hero__overlay" />
        <div className="lux-container lux-hero__inner">
          <div className="lux-hero__copy">
            <p className="lux-eyebrow">{hero.eyebrow || "Premium Maldives DMC Platform"}</p>
            <h1>{hero.title || "A Premium Maldives B2B Travel Ecosystem"}</h1>
            <p>
              {hero.description ||
                "Curated resorts, protected trade resources, and local destination expertise for global travel partners."}
            </p>
            <div className="lux-hero__actions">
              <Link href="/resorts" className="lux-button lux-button--gold">
                Explore Resorts <ArrowRight size={16} />
              </Link>
              <Link href="/partner/register" className="lux-button lux-button--glass">
                Become a Partner
              </Link>
            </div>
          </div>
          <div className="lux-hero__stats">
            {heroStats.map((item) => (
              <div className="lux-hero-stat" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lux-hero__ticker" aria-hidden="true">
          <div>
            {[...partnerLogos, ...partnerLogos].map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
        </div>
      </section>

      <FeaturedRetreats resorts={featuredResorts} />

      <section className="lux-section lux-section--sand">
        <div className="lux-container lux-editorial-split lux-editorial-split--ceo">
          <div className="lux-portrait-card">
            <div
              className="lux-portrait-card__image"
              style={{ backgroundImage: `url(${ceo.photoUrl || featuredImages[2]})` }}
            />
            <div className="lux-portrait-card__caption">
              <strong>{ceo.name}</strong>
              <span>{ceo.title}</span>
            </div>
          </div>
          <div className="lux-editorial-copy">
            <p className="lux-eyebrow">{ceo.sectionLabel}</p>
            <h2>&ldquo;{ceo.quote}&rdquo;</h2>
            <p>{ceo.message}</p>
            <div className="lux-signature">
              <strong>{ceo.name}</strong>
              <span>{ceo.title}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="lux-section lux-section--ivory">
        <div className="lux-container lux-story-split">
          <div className="lux-story-copy">
            <p className="lux-eyebrow">{story.sectionLabel}</p>
            <h2>{story.title}</h2>
            <p>{story.description}</p>
          </div>
          <div className="lux-story-image-panel">
            <div
              className="lux-story-panel__image"
              style={{ backgroundImage: `url(${story.imageUrl || featuredImages[1]})` }}
            />
          </div>
        </div>
      </section>

      <section className="lux-section lux-section--ivory lux-market-map-split" id="global-markets">
        <div className="lux-container lux-market-map-grid">
          <div className="lux-market-panel">
            <SectionHeading
              eyebrow={markets.sectionTitle || "Global Markets"}
              title="Connected to the markets shaping premium Maldives demand"
              description="A focused DMC presence for travel designers and agencies across priority regions."
            />
          </div>
          <div className="lux-market-map-card">
            <GlobalMarketMap markets={marketList} />
          </div>
        </div>
      </section>

      <section className="lux-section lux-section--sand svc-section lux-parallax-section">
        <ServicesParallax
          services={services}
          images={serviceImages}
          title="DMC Services"
          description="Commercial support, island logistics, and product clarity in one partner rhythm."
        />
      </section>
      <TrustStats stats={stats} />
      <section className="lux-section lux-section--ivory svc-section lux-parallax-section lux-parallax-section--why">
        <WhyUsParallax
          items={whyUs}
          images={whyImages}
          title="Why Travel Designers Choose Us"
          description="Local precision, commercial fluency, and resort relationships that protect high-value bookings."
        />
      </section>

      <section className="lux-section lux-section--sand">
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
                    <img src={award.imageUrl} alt={award.name || "Award recognition"} />
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
          <Link href="/partner/register" className="lux-button lux-button--gold">
            Become a Travel Partner <ArrowRight size={16} />
          </Link>
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
              style={{ backgroundImage: `url(${newsletter.imageUrl || featuredImages[3]})` }}
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
