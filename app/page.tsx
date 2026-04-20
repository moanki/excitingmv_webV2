import Link from "next/link";

import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { listPublishedResorts } from "@/lib/services/resort-service";
import {
  getFooterContent,
  getHomepageFeatures,
  getHomepageHeroContent,
  getMarketSettings,
  getNavbarContent
} from "@/lib/site-content";

const featuredImages = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=80"
];

const defaultPartnerLogos = [
  "Soneva",
  "JOALI",
  "Patina",
  "Milaidhoo",
  "Baros",
  "Anantara"
];

const defaultStats = [
  { value: "198+", label: "Resorts" },
  { value: "20+", label: "Years Experience" },
  { value: "24/7", label: "Local Support" },
  { value: "Global", label: "Travel Partners" }
];

const defaultServices = [
  "Luxury Resort Contracting",
  "Bespoke Itinerary Planning",
  "VIP Arrival & Transfer Coordination",
  "Dedicated On-Island Partner Support",
  "Group & Incentive Handling",
  "Trade Rate & Offer Management"
];

const defaultWhyUs = [
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

const defaultGuide = [
  {
    category: "Destination Insight",
    title: "Choosing the Right Atoll for the Right Client",
    description: "A partner-facing guide to matching geography, transfer logic, and experience style."
  },
  {
    category: "Sales Narrative",
    title: "How to Position Seaplane Resorts Versus Speedboat Access",
    description: "Help clients understand the trade-off between convenience and iconic Maldives arrival moments."
  },
  {
    category: "Planning",
    title: "Seasonality, Demand Windows, and Luxury Booking Patterns",
    description: "A practical guide for premium agencies planning around travel windows and lead time."
  },
  {
    category: "Product",
    title: "Room Types That Actually Matter in the Decision Process",
    description: "A quick read on how to frame villas, family units, and signature inventory."
  }
];

const defaultAwards = ["World Luxury Travel Awards", "Indian Ocean Travel Awards", "Preferred DMC Recognition"];

function pickResortImage(index: number) {
  return featuredImages[index % featuredImages.length];
}

export default async function HomePage() {
  const [
    { content: hero },
    { content: homepageHighlights },
    { content: markets },
    { content: navbar },
    { content: footer },
    resorts
  ] = await Promise.all([
    getHomepageHeroContent("published"),
    getHomepageFeatures("published"),
    getMarketSettings("published"),
    getNavbarContent("published"),
    getFooterContent("published"),
    listPublishedResorts()
  ]);

  const activeMarkets = markets.options.filter((market) => market.enabled).map((market) => market.label);
  const navLabels = navbar.navItems.filter((item) => item.enabled).map((item) => item.label);
  const partnerLogos = navLabels.length ? navLabels : defaultPartnerLogos;
  const featuredResorts = resorts.slice(0, 5);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__media" />
        <div className="home-hero__overlay" />
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <p className="home-hero__kicker">{hero.eyebrow}</p>
            <h1>{hero.title}</h1>
            <p className="home-hero__lede">{hero.description}</p>
            <div className="home-hero__actions">
              <Link href={hero.primaryCtaHref} className="site-button site-button--teal">
                {hero.primaryCtaLabel}
              </Link>
              <Link href={hero.secondaryCtaHref} className="site-button site-button--ghost">
                {hero.secondaryCtaLabel}
              </Link>
            </div>
          </div>
        </div>
        <div className="home-hero__logos">
          <div className="home-hero__logos-track">
            {[...partnerLogos, ...partnerLogos].map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-section--white">
        <div className="site-container">
          <div className="section-heading section-heading--center">
            <h2>Featured Retreats</h2>
            <p>Hand-picked luxury island experiences</p>
          </div>
          <div className="featured-grid">
            {featuredResorts.map((resort, index) => (
              <Link href={`/resorts/${resort.slug}`} key={resort.slug} className="featured-card">
                <div
                  className="featured-card__image"
                  style={{ backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.72)), url(${pickResortImage(index)})` }}
                />
                <div className="featured-card__content">
                  <h3>{resort.name}</h3>
                  <div className="featured-card__meta">
                    <span>{resort.location}</span>
                    <span>{resort.category}</span>
                  </div>
                  <span className="featured-card__cta">View More</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-section--paper">
        <div className="site-container split-section">
          <div className="portrait-frame">
            <div className="portrait-frame__image portrait-frame__image--ceo" />
          </div>
          <div className="split-section__copy">
            <p className="section-kicker">CEO&apos;s Message</p>
            <h2>“Our mission is to connect the world&apos;s leading travel designers with the extraordinary experiences of the Maldives.”</h2>
            <p>
              Founded on the principles of discretion and excellence, we have spent two decades building intimate
              relationships with the Maldives&apos; most secluded resorts and most trusted hospitality partners.
            </p>
            <div className="split-section__signature">
              <strong>Elias Jancel</strong>
              <span>Founder &amp; CEO</span>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section site-section--white">
        <div className="site-container split-section split-section--reverse">
          <div className="split-section__copy">
            <p className="section-kicker">Our Story</p>
            <h2>A Legacy of Luxury in the Maldives</h2>
            <p>
              Our role as a specialized B2B DMC is to act as an extension of your team on the ground, ensuring every
              client detail is executed with precision, warmth, and deep destination knowledge.
            </p>
          </div>
          <div className="portrait-frame">
            <div className="portrait-frame__image portrait-frame__image--story" />
          </div>
        </div>
      </section>

      <section className="site-section site-section--navy">
        <div className="site-container">
          <div className="section-heading section-heading--center section-heading--light">
            <h2>Global Markets</h2>
            <p>Supporting travel designers and agencies across global markets.</p>
          </div>
          <div className="map-panel">
            <div className="map-panel__canvas">
              <div className="map-marker map-marker--one">
                <span>Europe</span>
              </div>
              <div className="map-marker map-marker--two">
                <span>Russia &amp; CIS</span>
              </div>
              <div className="map-marker map-marker--three">
                <span>Middle East</span>
              </div>
              <div className="map-marker map-marker--four">
                <span>South Asia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section site-section--white">
        <div className="site-container">
          <div className="section-heading section-heading--center">
            <h2>DMC Services</h2>
            <p>Comprehensive on-ground support for our partners</p>
          </div>
          <div className="services-grid">
            {defaultServices.map((service) => (
              <div className="service-card" key={service}>
                <div className="service-card__icon" />
                <h3>{service}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="expertise-band">
        <div className="site-container expertise-band__inner">
          {defaultStats.map((item) => (
            <div className="expertise-stat" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="site-section site-section--paper">
        <div className="site-container why-us">
          <div className="why-us__copy">
            <p className="section-kicker">Our Value Proposition</p>
            <h2>Why Travel Designers Choose Us</h2>
            <div className="why-us__list">
              {defaultWhyUs.map((item) => (
                <article className="why-us__item" key={item.title}>
                  <div className="why-us__check" />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="why-us__visual">
            <div className="stacked-card stacked-card--back" />
            <div className="stacked-card stacked-card--mid" />
            <div className="stacked-card stacked-card--front" />
          </div>
        </div>
      </section>

      <section className="site-section site-section--white awards-strip">
        <div className="site-container">
          <div className="section-heading section-heading--center">
            <h2>Prestigious Awards</h2>
            <p>{homepageHighlights[0]?.description ?? "Recognition from global luxury travel partners and trade networks."}</p>
          </div>
          <div className="awards-cloud">
            {[...defaultAwards, ...footer.awards.filter((item) => item.enabled).map((item) => item.name)].map((award) => (
              <span className="award-pill" key={award}>
                {award}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="join-banner">
        <div className="join-banner__media" />
        <div className="join-banner__overlay" />
        <div className="join-banner__inner">
          <h2>Join Our Global Network of Travel Professionals</h2>
          <div className="join-banner__checks">
            <span>Priority Support</span>
            <span>Exclusive Rates</span>
            <span>Access to Offers</span>
          </div>
          <Link href="/partner/register" className="site-button site-button--teal">
            Become a Travel Partner
          </Link>
        </div>
      </section>

      <section className="site-section site-section--white">
        <div className="site-container">
          <div className="section-heading">
            <div>
              <h2>The Maldives Travel Guide</h2>
              <p>Destination knowledge for professionals</p>
            </div>
            <Link href="/travel-guide" className="section-heading__link">
              View All Insights
            </Link>
          </div>
          <div className="guide-grid">
            {defaultGuide.map((item, index) => (
              <article className="guide-card" key={item.title}>
                <div
                  className="guide-card__image"
                  style={{ backgroundImage: `url(${pickResortImage(index + 1)})` }}
                />
                <span className="guide-card__category">{item.category}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-section--paper">
        <div className="site-container newsletter-block">
          <div className="newsletter-block__media" />
          <div className="newsletter-block__content">
            <p className="section-kicker">Stay Connected</p>
            <h2>Be in Touch</h2>
            <p className="newsletter-block__lede">
              We would be delighted to stay connected and learn more about your business.
            </p>
            <NewsletterSignupForm markets={activeMarkets.length ? activeMarkets : defaultPartnerLogos} />
          </div>
        </div>
      </section>
    </main>
  );
}
