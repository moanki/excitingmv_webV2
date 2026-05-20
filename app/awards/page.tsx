import { Award, ShieldCheck } from "lucide-react";

import { optimizedImageUrl } from "@/lib/image-urls";
import { getFooterContent, getHomepageAwardsContent } from "@/lib/site-content";

export default async function AwardsPage() {
  const [{ content: homepageAwards }, { content: footer }] = await Promise.all([
    getHomepageAwardsContent("published"),
    getFooterContent("published")
  ]);

  const uniqueItems = new Map(
    [...homepageAwards.items, ...footer.awards, ...footer.memberships]
      .filter((item) => item.enabled && (item.name || item.imageUrl))
      .map((item) => [`${item.name}-${item.imageUrl}`, item])
  );
  const items = Array.from(uniqueItems.values());

  return (
    <main className="public-lux-page">
      <section className="public-lux-hero public-lux-hero--compact">
        <div className="lux-container public-lux-hero__copy public-lux-hero__copy--center">
          <p className="lux-eyebrow">Awards & Memberships</p>
          <h1>{homepageAwards.title || "Recognized by the Maldives Travel Industry"}</h1>
          <p>
            Industry recognition, memberships, and trusted proof points that help global travel
            professionals book with confidence.
          </p>
        </div>
      </section>

      <section className="public-lux-section public-lux-section--sand">
        <div className="lux-container awards-proof">
          <article>
            <Award size={24} />
            <strong>TTM Top Producer Recognition</strong>
            <span>Repeated performance across premium Maldives trade relationships.</span>
          </article>
          <article>
            <ShieldCheck size={24} />
            <strong>Trusted Industry Memberships</strong>
            <span>Destination credibility backed by partner networks and market presence.</span>
          </article>
        </div>
      </section>

      <section className="public-lux-section">
        <div className="lux-container">
          <div className="lux-section-heading about-centered-heading">
            <p className="lux-eyebrow">Recognition</p>
            <h2>{homepageAwards.summary || "A clean proof layer for partners and resort stakeholders."}</h2>
          </div>
          <div className="about-logo-grid awards-logo-grid">
            {items.map((item) => {
              const body = item.imageUrl ? (
                <img
                  src={optimizedImageUrl(item.imageUrl, { width: 240, height: 140, quality: 76, resize: "contain" })}
                  alt={item.name || "Award logo"}
                  width={240}
                  height={140}
                  loading="lazy"
                />
              ) : (
                <span>{item.name}</span>
              );

              return item.href ? (
                <a className="about-logo-tile" href={item.href} target="_blank" rel="noreferrer" key={`${item.name}-${item.imageUrl}`}>
                  {body}
                </a>
              ) : (
                <div className="about-logo-tile" key={`${item.name}-${item.imageUrl}`}>
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
