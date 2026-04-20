import Link from "next/link";

import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { listPublishedResorts } from "@/lib/services/resort-service";
import {
  getHomepageAwardsContent,
  getHomepageCeoContent,
  getFooterContent,
  getHomepageGuide,
  getHomepageFeatures,
  getHomepageHeroContent,
  getHomepageNewsletterContent,
  getHomepageServices,
  getHomepageStats,
  getHomepageStoryContent,
  getHomepageWhyUs,
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

function pickResortImage(index: number) {
  return featuredImages[index % featuredImages.length];
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
    { content: footer },
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
            <div className="portrait-frame__image" style={{ backgroundImage: `url(${ceo.photoUrl})` }} />
          </div>
          <div className="split-section__copy">
            <p className="section-kicker">{ceo.sectionLabel}</p>
            <h2>“{ceo.quote}”</h2>
            <p>{ceo.message}</p>
            <div className="split-section__signature">
              <strong>{ceo.name}</strong>
              <span>{ceo.title}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section site-section--white">
        <div className="site-container split-section split-section--reverse">
          <div className="split-section__copy">
            <p className="section-kicker">{story.sectionLabel}</p>
            <h2>{story.title}</h2>
            <p>{story.description}</p>
          </div>
          <div className="portrait-frame">
            <div className="portrait-frame__image" style={{ backgroundImage: `url(${story.imageUrl})` }} />
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
            {services.filter((service) => service.enabled && service.title).map((service) => (
              <div className="service-card" key={service.title}>
                <div className="service-card__icon" />
                <h3>{service.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="expertise-band">
        <div className="site-container expertise-band__inner">
          {stats.map((item) => (
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
              {whyUs.map((item) => (
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
            <h2>{awards.title}</h2>
            <p>{awards.summary || homepageHighlights[0]?.description}</p>
          </div>
          <div className="awards-cloud">
            {awards.items.filter((item) => item.enabled && (item.name || item.imageUrl)).map((award) => (
              <span className="award-pill" key={award.name || award.imageUrl}>
                {award.imageUrl ? <img src={award.imageUrl} alt={award.name} className="award-pill__image" /> : award.name}
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
            {guide.map((item, index) => (
              <article className="guide-card" key={item.title}>
                <div
                  className="guide-card__image"
                  style={{ backgroundImage: `url(${item.imageUrl || pickResortImage(index + 1)})` }}
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
          <div className="newsletter-block__media" style={{ backgroundImage: `url(${newsletter.imageUrl})` }} />
          <div className="newsletter-block__content">
            <p className="section-kicker">{newsletter.sectionLabel}</p>
            <h2>{newsletter.title}</h2>
            <p className="newsletter-block__lede">{newsletter.description}</p>
            <NewsletterSignupForm markets={activeMarkets.length ? activeMarkets : defaultPartnerLogos} />
          </div>
        </div>
      </section>
    </main>
  );
}
