import Link from "next/link";

import { optimizedImageUrl } from "@/lib/image-urls";
import { getCatalogueContent, getContactPageContent } from "@/lib/site-content";

function whatsappHref(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function ContactPage() {
  const [{ content }, { content: catalogue }] = await Promise.all([
    getContactPageContent("published"),
    getCatalogueContent("resorts")
  ]);
  const regions = content.regions.filter((region) => region.enabled);
  const heroImageUrl = optimizedImageUrl(catalogue.heroImageUrl, { width: 2200, height: 1100, quality: 92 });

  return (
    <main className="public-lux-page contact-registry-page">
      <section className="contact-registry-hero">
        <div
          className="contact-registry-hero__image"
          style={heroImageUrl ? { backgroundImage: `url(${JSON.stringify(heroImageUrl)})` } : undefined}
          aria-hidden="true"
        />
        <div className="contact-registry-hero__overlay" aria-hidden="true" />
        <div className="lux-container">
          <p className="lux-eyebrow">Contact</p>
          <h1>{content.title}</h1>
          <p>{content.subtitle}</p>
        </div>
      </section>

      <section className="contact-registry-section">
        <div className="lux-container">
          <div className="contact-registry-grid">
            {regions.map((region) => (
              <article className="contact-registry-entry" key={`${region.regionTitle}-${region.email}`}>
                <div className="contact-registry-entry__heading">
                  <p>{region.regionTitle}</p>
                  <span>{region.location}</span>
                </div>
                <div className="contact-registry-entry__profile">
                  <div className="contact-registry-entry__portrait" aria-hidden="true">
                    {region.photoUrl ? (
                      <img
                        src={optimizedImageUrl(region.photoUrl, { width: 240, height: 240, quality: 82 })}
                        alt=""
                      />
                    ) : (
                      <span>{initials(region.contactName || region.regionTitle)}</span>
                    )}
                  </div>
                  <div className="contact-registry-entry__person">
                    <strong>{region.contactName}</strong>
                    {region.role ? <span>{region.role}</span> : null}
                  </div>
                </div>
                <div className="contact-registry-entry__links">
                  <a href={`mailto:${region.email}`}>{region.email}</a>
                  <a href={whatsappHref(region.whatsapp)} target="_blank" rel="noreferrer">
                    {region.whatsapp} WhatsApp
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="contact-registry-cta">
            <p>{content.ctaText}</p>
            <Link href={content.ctaHref || "/partner/register"}>{content.ctaLabel || "Become a Partner"}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
