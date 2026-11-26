import Link from "next/link";
import { groupTeamContacts } from "@/lib/team-departments";
import { Mail, MessageCircle } from "lucide-react";

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
    getCatalogueContent("contact")
  ]);
  const departments = groupTeamContacts(content.departments, content.regions);
  const heroImageUrl = optimizedImageUrl(content.heroImageUrl ?? catalogue.heroImageUrl, { width: 2200, height: 1100, quality: 92 });

  return (
    <main className="public-lux-page contact-registry-page team-directory">
      <section className="contact-registry-hero">
        <div
          className="contact-registry-hero__image"
          style={heroImageUrl ? { backgroundImage: `url(${JSON.stringify(heroImageUrl)})` } : undefined}
          aria-hidden="true"
        />
        <div className="contact-registry-hero__overlay" aria-hidden="true" />
        <div className="lux-container">
          <h1>{content.title}</h1>
          <p>{content.subtitle}</p>
        </div>
      </section>

      <section className="contact-registry-section">
        <div className="lux-container">
          {departments.map((department) => (
            <section className="contact-team-department" key={department.id} aria-label={department.name}>
              <h2>{department.name}</h2>
              <div className="contact-registry-grid">
                {department.contacts.map((region, index) => (
                  <article className="contact-registry-entry" key={`${region.email}-${index}`}>
                    {region.regionTitle || region.location ? (
                      <div className="contact-registry-entry__heading">
                        {region.regionTitle ? <p>{region.regionTitle}</p> : null}
                        {region.location ? <span>{region.location}</span> : null}
                      </div>
                    ) : null}
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
                      {region.email ? <a href={`mailto:${region.email}`}>
                        <Mail className="contact-registry-entry__link-icon" aria-hidden="true" />
                        <span>{region.email}</span>
                      </a> : null}
                      {region.whatsapp ? <a href={whatsappHref(region.whatsapp)} target="_blank" rel="noreferrer">
                        <MessageCircle className="contact-registry-entry__link-icon" aria-hidden="true" />
                        <span>{region.whatsapp} WhatsApp</span>
                      </a> : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <div className="contact-registry-cta">
            <p>{content.ctaText}</p>
            <Link href={content.ctaHref || "/partner/register"}>{content.ctaLabel || "Become a Partner"}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
