import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  Check,
  Globe2,
  Handshake,
  Landmark,
  MapPin,
  Plane,
  Sparkles,
  Waves
} from "lucide-react";

import { PartnerModalButton } from "@/components/partner-modal-button";
import { optimizedImageUrl } from "@/lib/image-urls";
import { getAboutPageContent } from "@/lib/site-content";

const iconMap = {
  "briefcase-business": BriefcaseBusiness,
  "building-2": Building2,
  check: Check,
  "globe-2": Globe2,
  handshake: Handshake,
  landmark: Landmark,
  "map-pin": MapPin,
  plane: Plane,
  sparkles: Sparkles,
  waves: Waves
};

function getIcon(name: string) {
  return iconMap[name as keyof typeof iconMap] ?? Sparkles;
}

function Cta({
  href,
  children,
  variant = "gold"
}: {
  href: string;
  children: ReactNode;
  variant?: "gold" | "ghost" | "light";
}) {
  const className =
    variant === "gold"
      ? "lux-button lux-button--gold"
      : variant === "light"
        ? "about-button about-button--light"
        : "lux-button lux-button--glass";

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
  const ctaStyle = content.cta.backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(7, 19, 31, 0.9), rgba(7, 19, 31, 0.68)), url("${optimizedImageUrl(content.cta.backgroundImageUrl, { width: 1800, height: 780, quality: 78 })}")`
      }
    : { backgroundColor: content.cta.backgroundColor || "#07131f" };

  return (
    <main className="about-page lux-home">
      <section className="about-hero">
        <div className="about-hero__media">
          <img
            src={optimizedImageUrl(content.hero.imageUrl, { width: 1800, height: 1100, quality: 82 })}
            alt=""
            width={1800}
            height={1100}
            fetchPriority="high"
          />
        </div>
        <div className="about-hero__overlay" />
        <div className="lux-container about-hero__inner">
          <div className="about-hero__copy">
            <p className="lux-eyebrow">{content.hero.kicker}</p>
            <h1>{content.hero.headline}</h1>
            <p>{content.hero.body}</p>
            <div className="about-hero__actions">
              <Cta href={content.hero.primaryCtaHref}>{content.hero.primaryCtaLabel}</Cta>
              <Cta href={content.hero.secondaryCtaHref} variant="ghost">{content.hero.secondaryCtaLabel}</Cta>
            </div>
          </div>

          {enabledStats.length ? (
            <div className="about-hero__stats" aria-label="Exciting Maldives trust signals">
              {enabledStats.map((stat) => (
                <div className="about-stat-card" key={`${stat.value}-${stat.label}`}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="about-section about-section--white">
        <div className="lux-container about-story">
          <div className="about-story__copy">
            <p className="lux-eyebrow">Who We Are</p>
            <h2>{content.story.title}</h2>
            <p>{content.story.body}</p>
            {content.story.secondaryBody ? <p>{content.story.secondaryBody}</p> : null}
          </div>
          <div className="about-story__image">
            <img
              src={optimizedImageUrl(content.story.imageUrl, { width: 900, height: 720, quality: 78 })}
              alt={content.story.imageAlt}
              width={900}
              height={720}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="about-section about-section--sand">
        <div className="lux-container">
          <div className="lux-section-heading">
            <p className="lux-eyebrow">Capabilities</p>
            <h2>{content.whatWeDo.title}</h2>
            <p>{content.whatWeDo.subtitle}</p>
          </div>
          <div className="about-bento-grid">
            {whatCards.map((card, index) => {
              const Icon = getIcon(card.icon);
              return (
                <article className={`about-bento-card${index === 0 ? " about-bento-card--wide" : ""}`} key={card.title}>
                  <span className="lux-icon-box"><Icon size={21} /></span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-section about-section--white">
        <div className="lux-container about-markets">
          <div className="about-markets__intro">
            <p className="lux-eyebrow">Market Expertise</p>
            <h2>{content.markets.title}</h2>
            <p>{content.markets.subtitle}</p>
          </div>
          <div className="about-market-list">
            {marketCards.map((market) => {
              const Icon = getIcon(market.icon);
              return (
                <article className="about-market-row" key={market.region}>
                  <Icon size={20} />
                  <div>
                    <strong>{market.region}</strong>
                    <span>{market.description}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-section about-section--dark">
        <div className="lux-container about-why">
          <div className="lux-section-heading lux-section-heading--light">
            <p className="lux-eyebrow">Partner Confidence</p>
            <h2>{content.whyUs.title}</h2>
            <p>{content.whyUs.subtitle}</p>
          </div>
          <div className="about-why-list">
            {whyPoints.map((point) => {
              const Icon = getIcon(point.icon);
              return (
                <article className="about-why-row" key={point.title}>
                  <span><Icon size={18} /></span>
                  <div>
                    <h3>{point.title}</h3>
                    <p>{point.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {logos.length ? (
        <section className="about-section about-section--sand">
          <div className="lux-container">
            <div className="lux-section-heading about-centered-heading">
              <p className="lux-eyebrow">Awards & Memberships</p>
              <h2>{content.awards.title}</h2>
              <p>{content.awards.subtitle}</p>
            </div>
            <div className="about-logo-grid">
              {logos.map((logo) => {
                const body = logo.imageUrl ? (
                  <img
                    src={optimizedImageUrl(logo.imageUrl, { width: 220, height: 120, quality: 76, resize: "contain" })}
                    alt={logo.name}
                    width={220}
                    height={120}
                    loading="lazy"
                  />
                ) : (
                  <span>{logo.name}</span>
                );

                return logo.href ? (
                  <a className="about-logo-tile" href={logo.href} target="_blank" rel="noreferrer" key={logo.name}>
                    {body}
                  </a>
                ) : (
                  <div className="about-logo-tile" key={logo.name}>{body}</div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="about-section about-section--cta">
        <div className="lux-container">
          <div className="about-callout" style={ctaStyle}>
            <p className="lux-eyebrow">Partnership</p>
            <h2>{content.cta.headline}</h2>
            <p>{content.cta.body}</p>
            <div className="about-callout__actions">
              <Cta href={content.cta.primaryCtaHref}>{content.cta.primaryCtaLabel}</Cta>
              <Cta href={content.cta.secondaryCtaHref} variant="ghost">{content.cta.secondaryCtaLabel}</Cta>
              <Cta href={content.cta.tertiaryCtaHref} variant="light">{content.cta.tertiaryCtaLabel}</Cta>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
