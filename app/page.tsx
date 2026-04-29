import Link from "next/link";

import { GlobalMarketMap } from "@/components/global-market-map";
import { ServicesParallax } from "@/components/services-parallax";
import { WhyUsParallax } from "@/components/why-us-parallax";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { listHomepageFeaturedResorts } from "@/lib/services/resort-service";
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

// High-fidelity resort images for the services parallax (overwater bungalows / Maldives)
const serviceImages = [
  "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1600&q=90"
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
    listHomepageFeaturedResorts(5)
  ]);

  const activeMarkets = markets.options.filter((market) => market.enabled);
  const marketLabels = activeMarkets.map((market) => market.label);
  const navLabels = navbar.navItems.filter((item) => item.enabled).map((item) => item.label);
  const partnerLogos = navLabels.length ? navLabels : defaultPartnerLogos;
  const featuredResorts = resorts.slice(0, 5);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__media">
          {hero.mediaUrl ? (
            hero.mediaType === "video" ? (
              <video
                className="home-hero__media-asset"
                src={hero.mediaUrl}
                poster={hero.mediaPosterUrl || undefined}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img className="home-hero__media-asset" src={hero.mediaUrl} alt={hero.title} />
            )
          ) : null}
        </div>
        <div className="home-hero__overlay" />
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            {hero.eyebrow ? <p className="home-hero__kicker">{hero.eyebrow}</p> : null}
            <h1>{hero.title}</h1>
            <p className="home-hero__lede">{hero.description}</p>
            <div className="home-hero__actions">
              <Link href={hero.primaryCtaHref} className="site-button site-button--teal">
                {hero.primaryCtaLabel}
              </Link>
              {hero.secondaryCtaLabel && hero.secondaryCtaHref ? (
                <Link href={hero.secondaryCtaHref} className="site-button site-button--ghost">
                  {hero.secondaryCtaLabel}
                </Link>
              ) : null}
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
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.72)), url(${resort.heroImageUrl || pickResortImage(index)})`
                  }}
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

      <section className="home-map-section" id="global-markets">
        <div className="home-map-section__heading site-container">
          <div className="section-heading section-heading--center section-heading--light">
            <h2>{markets.sectionTitle || "Global Markets"}</h2>
            <p>Supporting travel designers and agencies across global markets.</p>
          </div>
        </div>
        <GlobalMarketMap markets={activeMarkets.length ? activeMarkets : markets.options} />
      </section>

      <section className="site-section site-section--white svc-section">
        <div className="site-container">
          <div className="section-heading section-heading--center">
            <h2>Services We Provide</h2>
            <p>Comprehensive on-ground support for our partners</p>
          </div>
        </div>
        <ServicesParallax services={services} images={serviceImages} />
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

      <section className="site-section site-section--paper svc-section">
        <div className="site-container">
          <div className="section-heading section-heading--center">
            <h2>Why Travel Designers Choose Us</h2>
            <p>Our Value Proposition</p>
          </div>
        </div>
        <WhyUsParallax 
          items={whyUs} 
          images={[
            "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=90"
          ]} 
        />
      </section>

      <section className="site-section site-section--white awards-strip">
        <div className="site-container">
          <div className="section-heading section-heading--center">
            <h2>{awards.title}</h2>
            <p>{awards.summary || homepageHighlights[0]?.description}</p>
          </div>
          <div className="awards-open">
            {awards.items.filter((item) => item.enabled && (item.name || item.imageUrl)).map((award) => (
              <div className="award-badge" key={award.name || award.imageUrl}>
                {award.imageUrl
                  ? <img src={award.imageUrl} alt={award.name} className="award-badge__img" />
                  : <span className="award-badge__name">{award.name}</span>}
              </div>
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

      <section className="newsletter-blend">
        <div className="site-container newsletter-blend__inner">
          <div className="newsletter-blend__photo">
            <img
              src={newsletter.imageUrl || "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80"}
              alt="Maldives resort"
            />
          </div>
          <div className="newsletter-blend__form-col">
            <p className="section-kicker">{newsletter.sectionLabel}</p>
            <h2>{newsletter.title}</h2>
            <p className="newsletter-blend__lede">{newsletter.description}</p>
            <NewsletterSignupForm markets={marketLabels.length ? marketLabels : defaultPartnerLogos} />
          </div>
        </div>
      </section>
    </main>
  );
}
