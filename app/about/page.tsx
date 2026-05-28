import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Globe2, Handshake, Landmark, MapPin, Palmtree, Star } from "lucide-react";

import { PartnerModalButton } from "@/components/partner-modal-button";
import { optimizedImageUrl } from "@/lib/image-urls";
import { getAboutPageContent } from "@/lib/site-content";

function Cta({ href, children, variant = "gold" }: { href: string; children: ReactNode; variant?: "gold" | "light" }) {
  const className = variant === "gold" ? "lux-button lux-button--gold" : "about-button about-button--light";

  if (href === "#partner") {
    return <PartnerModalButton className={className}>{children}</PartnerModalButton>;
  }

  return (
    <Link href={href || "/contact"} className={className}>
      {children}
    </Link>
  );
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
      images: content.seo.ogImageUrl || content.hero.imageUrl ? [content.seo.ogImageUrl || content.hero.imageUrl] : undefined,
    },
  };
}

const defaultStoryPanels = [
  {
    kicker: "Resort Partnerships",
    title: "Access that supports better recommendations.",
    body:
      "We work with a curated portfolio of Maldives resorts, building relationships that create real value for our travel partners.",
  },
  {
    kicker: "Destination Support",
    title: "Seamless journeys, handled locally.",
    body:
      "From airport arrival to island transfers and in-stay support, we make sure every detail is looked after with care and consistency.",
  },
  {
    kicker: "Market Understanding",
    title: "Insight shaped by real travel demand.",
    body:
      "We stay close to our key source markets, understanding trends and traveller expectations to support smarter business decisions.",
  },
];

const proofItems = [
  { value: "4x", label: "TTM Top Producer", Icon: Star },
  { value: "150+", label: "Resort Partnerships", Icon: Handshake },
  { value: "Key", label: "Global Markets", Icon: Globe2 },
  { value: "Maldives-Based", label: "Expertise", Icon: MapPin },
];

const marketIcons = [Landmark, Globe2, Landmark, Landmark, Palmtree];

export default async function AboutPage() {
  const { content } = await getAboutPageContent();
  const marketCards = content.markets.cards.filter((item) => item.enabled);
  const logos = content.awards.logos.filter((item) => item.enabled && item.name);
  const storyPanelImages = [
    content.hero.imageUrl,
    "https://images.unsplash.com/photo-1544511916-0148ccdeb877?auto=format&fit=crop&w=1400&q=84",
    content.cta.backgroundImageUrl || content.story.imageUrl,
  ];
  const ctaImage = content.cta.backgroundImageUrl || content.hero.imageUrl;

  return (
    <main className="about-cinematic-page">
      <section className="about-cinematic-hero">
        <img
          src={optimizedImageUrl(content.hero.imageUrl, { width: 1920, height: 980, quality: 88 })}
          alt=""
          width={1920}
          height={980}
          fetchPriority="high"
        />
        <div className="about-cinematic-hero__shade" aria-hidden="true" />
        <div className="lux-container about-cinematic-hero__content">
          <p className="lux-eyebrow">About Exciting Maldives</p>
          <h1>The Maldives DMC behind confident travel partnerships.</h1>
          <p>
            We connect travel professionals with trusted resort access, destination knowledge, and seamless on-ground support
            across the Maldives.
          </p>
          <a href="#about-story" className="about-cinematic-link">
            Explore our story
            <ArrowRight size={22} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="about-cinematic-section" id="about-story">
        <div className="lux-container about-cinematic-intro">
          <div className="about-cinematic-intro__copy">
            <span aria-hidden="true" />
            <h2>Built around partner confidence.</h2>
            <p>Exciting Maldives was created to make Maldives travel partnerships clearer, smoother, and more reliable.</p>
            <p>We combine local destination knowledge with trusted resort relationships and responsive partner support.</p>
          </div>
          <div className="about-cinematic-intro__image">
            <img
              src={optimizedImageUrl(content.story.imageUrl, { width: 980, height: 620, quality: 84 })}
              alt={content.story.imageAlt}
              width={980}
              height={620}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="about-cinematic-proof" aria-label="Exciting Maldives proof points">
        <div className="lux-container about-cinematic-proof__grid">
          {proofItems.map(({ value, label, Icon }) => (
            <div className="about-cinematic-proof__item" key={`${value}-${label}`}>
              <Icon size={32} aria-hidden="true" />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-cinematic-section about-cinematic-section--panels">
        <div className="lux-container about-cinematic-panels">
          {defaultStoryPanels.map((panel, index) => (
            <article className={`about-cinematic-panel ${index % 2 ? "is-reversed" : ""}`} key={panel.kicker}>
              <div className="about-cinematic-panel__image">
                <img
                  src={optimizedImageUrl(storyPanelImages[index], { width: 1100, height: 700, quality: 84 })}
                  alt=""
                  width={1100}
                  height={700}
                  loading="lazy"
                />
              </div>
              <div className="about-cinematic-panel__copy">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{panel.kicker}</h2>
                <strong>{panel.title}</strong>
                <p>{panel.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-cinematic-markets">
        <div className="lux-container about-cinematic-markets__grid">
          <div className="about-cinematic-markets__title">
            <span aria-hidden="true" />
            <h2>Connected to key Maldives travel markets.</h2>
          </div>
          <div className="about-cinematic-markets__list">
            {marketCards.map((market, index) => {
              const Icon = marketIcons[index] || Globe2;
              return (
                <div className="about-cinematic-market" key={market.region}>
                  <Icon size={34} aria-hidden="true" />
                  <span>{market.region}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {logos.length ? (
        <section className="about-cinematic-recognition">
          <div className="lux-container about-cinematic-recognition__grid">
            <div className="about-cinematic-recognition__title">
              <h2>{content.awards.title}</h2>
            </div>
            <div className="about-cinematic-logos">
              {logos.map((logo) => {
                const body = logo.imageUrl ? (
                  <img
                    src={optimizedImageUrl(logo.imageUrl, { width: 260, height: 120, quality: 90, resize: "contain" })}
                    alt={logo.name}
                    width={260}
                    height={120}
                    loading="lazy"
                  />
                ) : (
                  <span>{logo.name}</span>
                );

                return logo.href ? (
                  <a className="about-cinematic-logo" href={logo.href} target="_blank" rel="noreferrer" key={logo.name}>
                    {body}
                  </a>
                ) : (
                  <div className="about-cinematic-logo" key={logo.name}>
                    {body}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="about-cinematic-cta">
        <img
          src={optimizedImageUrl(ctaImage, { width: 1800, height: 560, quality: 86 })}
          alt=""
          width={1800}
          height={560}
          loading="lazy"
        />
        <div className="about-cinematic-cta__shade" aria-hidden="true" />
        <div className="lux-container about-cinematic-cta__content">
          <div>
            <h2>Let's build stronger Maldives partnerships.</h2>
            <p>Work with a destination partner that brings clarity, access, and on-ground confidence.</p>
          </div>
          <div className="about-cinematic-cta__actions">
            <Cta href="#partner">Become a Partner</Cta>
            <Cta href="/contact" variant="light">
              Contact Us
            </Cta>
          </div>
        </div>
      </section>
    </main>
  );
}
