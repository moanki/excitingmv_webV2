import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  ConciergeBell,
  Handshake,
  Plane,
} from "lucide-react";

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

const serviceIcons = [BedDouble, Plane, ConciergeBell, BadgeCheck];

const defaultServices = [
  {
    title: "Resort & Accommodation Coordination",
    description: "Trusted support for resort selection, product matching, and booking coordination across the Maldives.",
  },
  {
    title: "Transportation & Transfers",
    description: "Seamless coordination for speedboat, domestic flight, seaplane, and arrival-to-resort movement.",
  },
  {
    title: "Concierge & Personalization",
    description: "Tailored support for guest preferences, special requests, and high-value travel experiences.",
  },
  {
    title: "Events, Groups & Meet & Greet",
    description: "Coordinated support for arrivals, groups, events, and on-ground guest handling.",
  },
];

const partnerLogos = ["Luxury Resorts", "Boutique Hotels", "Local Providers", "Preferred DMC Network"];

const brandImages = [
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=84",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=84",
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=84",
];

const defaultBrandPortfolio = [
  { region: "ETH Hospitality Services", description: "Regional hospitality operations hub, Dubai." },
  { region: "Exciting Travel Holidays", description: "Global travel distribution and partner network." },
  { region: "Exciting Islands", description: "Destination branding and curated experience development." },
];

const defaultPartnerTypes = [
  {
    title: "Luxury Resorts",
    description: "Premium digital exposure, high-value partner visibility, and stronger storytelling.",
  },
  {
    title: "Boutique Hotels & Guesthouses",
    description: "Access to premium markets and scalable growth opportunities.",
  },
  {
    title: "Experience Providers",
    description: "Curated exposure, cross-selling opportunities, and global distribution.",
  },
];

export default async function AboutPage() {
  const { content } = await getAboutPageContent();
  const logos = content.awards.logos.filter((item) => item.enabled && item.name);
  const savedServices = content.whatWeDo.cards.filter((item) => item.enabled && item.title).slice(0, 4);
  const savedBrands = content.markets.cards.filter((item) => item.enabled && item.region).slice(0, 3);
  const savedPartnerTypes = content.whyUs.points.filter((item) => item.enabled && item.title).slice(0, 3);
  const hasLegacyServices = /what we do/i.test(content.whatWeDo.title);
  const hasLegacyBrands = /market/i.test(content.markets.title);
  const hasLegacyPhilosophy = /why travel|destination knowledge|resort relationships/i.test(content.whyUs.title);
  const services = hasLegacyServices ? defaultServices : savedServices.length ? savedServices : defaultServices;
  const brandPortfolio = hasLegacyBrands ? defaultBrandPortfolio : savedBrands.length ? savedBrands : defaultBrandPortfolio;
  const partnerTypes = hasLegacyPhilosophy
    ? defaultPartnerTypes
    : savedPartnerTypes.length
      ? savedPartnerTypes
      : defaultPartnerTypes;
  const serviceImage =
    content.story.imageUrl || "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=84";
  const partnerImage =
    content.cta.backgroundImageUrl ||
    "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1600&q=86";

  return (
    <main className="about-company-page">
      <section className="about-company-hero">
        <img
          src={optimizedImageUrl(content.hero.imageUrl, { width: 1920, height: 980, quality: 88 })}
          alt=""
          width={1920}
          height={980}
          fetchPriority="high"
        />
        <div className="about-company-hero__shade" aria-hidden="true" />
        <div className="lux-container about-company-hero__content">
          <p className="lux-eyebrow">ABOUT EXCITING MALDIVES</p>
          <h1>The Maldives DMC Behind Confident Travel Partnerships</h1>
          <p>
            We connect travel professionals with trusted resort access, curated destination knowledge, and seamless on-ground support
            across the Maldives.
          </p>
          <a href="#about-introduction" className="about-company-link">
            Explore Our Story
            <ArrowRight size={20} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="about-company-section about-company-introduction" id="about-introduction">
        <div className="lux-container">
          <p>
            {content.story.body ||
              "Exciting Maldives is a Maldives-based B2B Destination Management Company built to support travel professionals with trusted resort partnerships, local destination expertise, and seamless inbound travel coordination."}
          </p>
        </div>
      </section>

      <section className="about-company-section about-company-services-section">
        <div className="lux-container about-company-services">
          <div className="about-company-services__list">
            <p className="lux-eyebrow">WHAT WE DO</p>
            <h2>{hasLegacyServices ? "End-to-End Destination Support" : content.whatWeDo.title || "End-to-End Destination Support"}</h2>
            {content.whatWeDo.subtitle && !hasLegacyServices ? <p className="about-company-section-note">{content.whatWeDo.subtitle}</p> : null}
            <div className="about-company-service-list">
              {services.map(({ title, description }, index) => {
                const Icon = serviceIcons[index] || BadgeCheck;
                return (
                  <article className="about-company-service" key={title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Icon size={22} aria-hidden="true" />
                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="about-company-services__image">
            <img
              src={optimizedImageUrl(serviceImage, { width: 900, height: 1120, quality: 86 })}
              alt={content.story.imageAlt}
              width={900}
              height={1120}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="about-company-section about-company-partners">
        <div className="lux-container about-company-partners__grid">
          <div>
            <p className="lux-eyebrow">TRUSTED HOSPITALITY NETWORK</p>
            <h2>{/recognized/i.test(content.awards.title) ? "Trusted access across the Maldives." : content.awards.title || "Trusted access across the Maldives."}</h2>
          </div>
          <p>
            {content.awards.subtitle ||
              "We collaborate with a curated portfolio of luxury resorts, boutique properties, and local providers to give partners trusted access, clearer product positioning, and stronger Maldives recommendations."}
          </p>
        </div>
        <div className="lux-container about-company-logo-strip" aria-label="Strategic hospitality partner categories">
          {(logos.length ? logos.slice(0, 4).map((logo) => logo.name) : partnerLogos).map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </section>

      <section className="about-company-section about-company-philosophy">
        <div className="lux-container">
          <p className="lux-eyebrow">OUR PHILOSOPHY & PROMISE</p>
          <h2>{hasLegacyPhilosophy ? "Our Philosophy & Promise" : content.whyUs.title || "Our Philosophy & Promise"}</h2>
          <p>
            {!hasLegacyPhilosophy && content.whyUs.subtitle ||
              "We believe the Maldives should be experienced with care, clarity, and respect for the islands. Our team supports partners with personalized service, responsible destination knowledge, and reliable on-ground coordination from planning to departure."}
          </p>
          {content.story.secondaryBody ? <p>{content.story.secondaryBody}</p> : null}
        </div>
      </section>

      <section className="about-company-section about-brand-section">
        <div className="lux-container">
          <div className="about-company-heading">
            <p className="lux-eyebrow">BRAND PORTFOLIO & ECOSYSTEM</p>
            <h2>{hasLegacyBrands ? "Brand Portfolio & Ecosystem" : content.markets.title || "Brand Portfolio & Ecosystem"}</h2>
            {content.markets.subtitle && !hasLegacyBrands ? <p className="about-company-section-note">{content.markets.subtitle}</p> : null}
          </div>
          <div className="about-brand-grid">
            {brandPortfolio.map((item, index) => (
              <article className="about-brand-card" key={item.region}>
                <img
                  src={optimizedImageUrl(brandImages[index] || brandImages[0], { width: 760, height: 540, quality: 84 })}
                  alt=""
                  width={760}
                  height={540}
                  loading="lazy"
                />
                <div>
                  <h3>{item.region}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-company-section about-who-partner">
        <div className="lux-container about-who-partner__grid">
          <div className="about-who-partner__image">
            <img
              src={optimizedImageUrl(partnerImage, { width: 900, height: 980, quality: 86 })}
              alt=""
              width={900}
              height={980}
              loading="lazy"
            />
          </div>
          <div className="about-who-partner__content">
            <p className="lux-eyebrow">WHO WE PARTNER WITH</p>
            <h2>Partnership opportunities for Maldives hospitality providers.</h2>
            <div className="about-partner-type-list">
              {partnerTypes.map((item) => (
                <article className="about-partner-type" key={item.title}>
                  <Handshake size={20} aria-hidden="true" />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-company-cta">
        <img
          src={optimizedImageUrl(partnerImage, { width: 1800, height: 560, quality: 86 })}
          alt=""
          width={1800}
          height={560}
          loading="lazy"
        />
        <div className="about-company-cta__shade" aria-hidden="true" />
        <div className="lux-container about-company-cta__content">
          <div>
            <h2>{content.cta.headline || "Build Stronger Maldives Partnerships With Us"}</h2>
            <p>{content.cta.body || "Work with a destination partner that brings clarity, access, and on-ground confidence."}</p>
          </div>
          <div className="about-company-cta__actions">
            <Cta href={content.cta.primaryCtaHref || "#partner"}>{content.cta.primaryCtaLabel || "Become a Partner"}</Cta>
            <Cta href={content.cta.secondaryCtaHref || "/contact"} variant="light">
              {content.cta.secondaryCtaLabel || "Contact Us"}
            </Cta>
          </div>
        </div>
      </section>
    </main>
  );
}
