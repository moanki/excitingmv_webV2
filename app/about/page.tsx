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

const services = [
  {
    title: "Resort & Accommodation Coordination",
    body: "Preferred accommodation access with clear product-fit guidance.",
    Icon: BedDouble,
  },
  {
    title: "Transportation & Transfers",
    body: "Seaplane, speedboat, domestic flight, and arrival movement support.",
    Icon: Plane,
  },
  {
    title: "Concierge & Personalization",
    body: "Special requests, private dining, wellness, family, and celebration details.",
    Icon: ConciergeBell,
  },
  {
    title: "Events, Groups & Meet & Greet",
    body: "Airport handling, group movement, event support, and guest flow coordination.",
    Icon: BadgeCheck,
  },
];

const partnerLogos = ["Luxury Resorts", "Boutique Hotels", "Local Providers", "Preferred DMC Network"];

const brandPortfolio = [
  {
    title: "ETH Hospitality Services",
    body: "Regional hospitality operations hub, Dubai.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=84",
  },
  {
    title: "Exciting Travel Holidays",
    body: "Global travel distribution and partner network.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=84",
  },
  {
    title: "Exciting Islands",
    body: "Destination branding and curated experience development.",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=84",
  },
];

const partnerTypes = [
  {
    title: "Luxury Resorts",
    body: "Premium digital exposure, high-value partner visibility, and stronger storytelling.",
  },
  {
    title: "Boutique Hotels & Guesthouses",
    body: "Access to premium markets and scalable growth opportunities.",
  },
  {
    title: "Experience Providers",
    body: "Curated exposure, cross-selling opportunities, and global distribution.",
  },
];

export default async function AboutPage() {
  const { content } = await getAboutPageContent();
  const logos = content.awards.logos.filter((item) => item.enabled && item.name);
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
            Exciting Maldives is a Maldives-based B2B Destination Management Company built to support travel professionals with
            trusted resort partnerships, local destination expertise, and seamless inbound travel coordination.
          </p>
        </div>
      </section>

      <section className="about-company-section about-company-services-section">
        <div className="lux-container about-company-services">
          <div className="about-company-services__list">
            <p className="lux-eyebrow">WHAT WE DO</p>
            <h2>End-to-end inbound tourism solutions.</h2>
            <div className="about-company-service-list">
              {services.map(({ title, body, Icon }, index) => (
                <article className="about-company-service" key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={22} aria-hidden="true" />
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </article>
              ))}
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
            <p className="lux-eyebrow">STRATEGIC HOSPITALITY PARTNERS</p>
            <h2>Trusted access across the Maldives.</h2>
          </div>
          <p>
            We collaborate with a curated portfolio of luxury resorts, boutique properties, and local providers to give partners
            clearer product positioning and stronger Maldives recommendations.
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
          <h2>Experienced with care, clarity, and respect for the islands.</h2>
          <p>
            Our team supports partners with personalized service, responsible destination knowledge, and reliable on-ground
            coordination from planning to departure.
          </p>
          <p>
            We believe in destination growth that respects the Maldives, supports local partnerships, and protects the character of
            the islands.
          </p>
        </div>
      </section>

      <section className="about-company-section about-brand-section">
        <div className="lux-container">
          <div className="about-company-heading">
            <p className="lux-eyebrow">BRAND PORTFOLIO & ECOSYSTEM</p>
            <h2>A connected hospitality and travel platform.</h2>
          </div>
          <div className="about-brand-grid">
            {brandPortfolio.map((item) => (
              <article className="about-brand-card" key={item.title}>
                <img
                  src={optimizedImageUrl(item.image, { width: 760, height: 540, quality: 84 })}
                  alt=""
                  width={760}
                  height={540}
                  loading="lazy"
                />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
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
                    <p>{item.body}</p>
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
            <h2>Let's Build Stronger Maldives Partnerships</h2>
            <p>Work with a destination partner that brings clarity, access, and on-ground confidence.</p>
          </div>
          <div className="about-company-cta__actions">
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
