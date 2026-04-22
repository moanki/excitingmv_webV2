import Link from "next/link";

import { listPublishedResorts } from "@/lib/services/resort-service";

export default async function ResortsPage() {
  const resorts = await listPublishedResorts();

  return (
    <main className="site-section site-section--paper">
      <div className="site-container stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Resort Collection</p>
            <h1 className="section-title">Explore the resorts currently published on the website.</h1>
            <p className="muted">
              Each resort card now follows the same banner, atoll, and category data managed inside the admin portal.
            </p>
          </div>
        </div>

        <div className="resort-collection-grid">
          {resorts.map((resort) => (
            <article key={resort.slug} className="resort-collection-card">
              <div
                className="resort-collection-card__media"
                style={
                  resort.heroImageUrl
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.68)), url(${resort.heroImageUrl})`
                      }
                    : undefined
                }
              />
              <div className="resort-collection-card__content">
                <div className="featured-card__meta">
                  <span>{resort.location || "Maldives"}</span>
                  <span>{resort.category || "Luxury Resort"}</span>
                </div>
                <h2>{resort.name}</h2>
                <p>{resort.summary}</p>
                <div className="card-actions">
                  <Link href={`/resorts/${resort.slug}`} className="site-button site-button--teal">
                    View Resort
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
