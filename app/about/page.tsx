import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { PartnerModalButton } from "@/components/partner-modal-button";
import { optimizedImageUrl } from "@/lib/image-urls";
import { getAboutPageContent } from "@/lib/site-content";

function Cta({ href, children, variant = "gold" }: { href: string; children: ReactNode; variant?: "gold" | "light" }) {
  const className = variant === "gold" ? "lux-button lux-button--gold" : "about-button about-button--light";

  if (href === "#partner") {
    return <PartnerModalButton className={className}>{children}</PartnerModalButton>;
  }

  return <Link href={href || "/contact"} className={className}>{children}</Link>;
}

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getAboutPageContent();

  return {
    title: content.seo.title,
    description: content.seo.description,
    alternates: content.seo.canonicalUrl ? { canonical: content.seo.canonicalUrl } : undefined,
    openGraph: {
      title: content.seo.title,
      description: content.seo.description,
      images: content.seo.ogImageUrl || content.hero.imageUrl ? [content.seo.ogImageUrl || content.hero.imageUrl] : undefined
    }
  };
}

export default async function AboutPage() {
  const { content } = await getAboutPageContent();
  const enabledStats = content.hero.stats.filter((item) => item.enabled && (item.value || item.label));
  const whatCards = content.whatWeDo.cards.filter((item) => item.enabled);
  const marketCards = content.markets.cards.filter((item) => item.enabled);
  const whyPoints = content.whyUs.points.filter((item) => item.enabled);
  const logos = content.awards.logos.filter((item) => item.enabled && item.name);
  const storyPanelImages = [
    content.story.imageUrl,
    content.hero.imageUrl,
    content.cta.backgroundImageUrl || content.story.imageUrl
  ];
  const storyPanels = [
    {
      kicker: "Resort Partnerships",
      title: "Access that builds better recommendations.",
      body:
        whatCards.find((item) => /resort/i.test(item.title))?.description ||
        "We work with a curated portfolio of Maldives resorts, helping partners match the right island to the right client."
    },
    {
      kicker: "Destination Support",
      title: "Calm coordination behind every journey.",
      body:
        whatCards.find((item) => /dmc|service/i.test(item.title))?.description ||
        "From planning support to on-island details, our team keeps destination coordination clear and reliable."
    },
    {
      kicker: "Market Understanding",
      title: "Recommendations shaped by real demand.",
      body:
        whyPoints.find((item) => /market/i.test(item.title))?.description ||
        "We understand important Maldives source markets and help partners shape stronger, more relevant travel conversations."
    }
  ];

  return (
    <main className="public-lux-page">
      <section className="public-lux-hero public-lux-hero--split">
        <div className="lux-container public-lux-hero__grid">
          <div className="public-lux-hero__copy">
            <p className="lux-eyebrow">{content.hero.kicker}</p>
            <h1>{content.hero.headline}</h1>
            <p>{content.hero.body}</p>
            <Cta href={content.hero.primaryCtaHref}>{content.hero.primaryCtaLabel}</Cta>
          </div>
          <div className="public-lux-hero__image">
            <img
              src={optimizedImageUrl(content.hero.imageUrl, { width: 980, height: 780, quality: 80 })}
              alt=""
              width={980}
              height={780}
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="public-lux-section">
        <div className="lux-container about-story">
          <div className="about-story__copy">
            <p className="lux-eyebrow">Who We Are</p>
            <h2>{content.story.title}</h2>
            <p>{content.story.body}</p>
            {content.story.secondaryBody ? <p>{content.story.secondaryBody}</p> : null}
          </div>
          <div className="about-story__image">
            <img
              src={optimizedImageUrl(content.story.imageUrl, { width: 760, height: 560, quality: 78 })}
              alt={content.story.imageAlt}
              width={760}
              height={560}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {enabledStats.length ? (
        <section className="public-lux-strip about-proof-strip-section">
          <div className="lux-container public-lux-icon-strip about-proof-strip">
            {enabledStats.map((stat) => (
              <div className="public-lux-icon-strip__item" key={`${stat.value}-${stat.label}`}>
                <Sparkles size={16} aria-hidden="true" />
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="public-lux-section">
        <div className="lux-container">
          <div className="public-lux-section-title">
            <p className="lux-eyebrow">Capabilities</p>
            <h2>{content.whatWeDo.title}</h2>
          </div>
          <div className="about-editorial-tiles">
            {whatCards.map((card, index) => (
              <article className="about-editorial-tile" key={card.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-lux-section">
        <div className="lux-container about-story-panels">
          {storyPanels.map((panel, index) => (
            <article className={`about-story-panel ${index % 2 ? "is-reversed" : ""}`} key={panel.kicker}>
              <div className="about-story-panel__image">
                <img
                  src={optimizedImageUrl(storyPanelImages[index], { width: 980, height: 680, quality: 82 })}
                  alt=""
                  width={980}
                  height={680}
                  loading="lazy"
                />
              </div>
              <div className="about-story-panel__copy">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p className="lux-eyebrow">{panel.kicker}</p>
                <h2>{panel.title}</h2>
                <p>{panel.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="public-lux-section about-market-chip-section">
        <div className="lux-container about-markets">
          <div className="about-markets__intro">
            <p className="lux-eyebrow">Market Expertise</p>
            <h2>{content.markets.title}</h2>
            <p>{content.markets.subtitle}</p>
          </div>
          <div className="about-market-chips">
            {marketCards.map((market) => (
              <span className="about-market-chip" key={market.region}>
                {market.region}
              </span>
            ))}
          </div>
        </div>
      </section>

      {logos.length ? (
        <section className="public-lux-section about-recognition-section">
          <div className="lux-container">
            <div className="public-lux-section-title">
              <p className="lux-eyebrow">Awards & Memberships</p>
              <h2>{content.awards.title}</h2>
            </div>
            <div className="about-logo-strip awards-logo-grid">
              {logos.map((logo) => {
                const body = logo.imageUrl ? (
                  <img
                    src={optimizedImageUrl(logo.imageUrl, { width: 240, height: 130, quality: 82, resize: "contain" })}
                    alt={logo.name}
                    width={240}
                    height={130}
                    loading="lazy"
                  />
                ) : (
                  <span>{logo.name}</span>
                );

                return logo.href ? (
                  <a className="about-logo-item" href={logo.href} target="_blank" rel="noreferrer" key={logo.name}>{body}</a>
                ) : (
                  <div className="about-logo-item" key={logo.name}>{body}</div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="public-lux-section">
        <div className="lux-container">
          <div className="public-lux-banner">
            <p className="lux-eyebrow">Partnership</p>
            <h2>{content.cta.headline}</h2>
            <p>{content.cta.body}</p>
            <div className="public-lux-banner__actions">
              <Cta href={content.cta.primaryCtaHref}>{content.cta.primaryCtaLabel}</Cta>
              <Cta href={content.cta.secondaryCtaHref} variant="light">{content.cta.secondaryCtaLabel}</Cta>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
