import Link from "next/link";

import { listPublishedProperties } from "@/lib/services/resort-service";

export default async function HotelsPage() {
  const hotels = await listPublishedProperties("hotel");

  return (
    <main className="site-section site-section--paper resort-index-page">
      <div className="site-container stack">
        <section className="resort-index-hero">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Hotel Collection</p>
              <h1 className="section-title">Explore all hotels currently published on the website.</h1>
              <p className="muted">Published hotels are managed from the same editorial workflow as resorts.</p>
            </div>
          </div>
        </section>

        {hotels.length ? (
          <div className="resort-collection-grid resort-collection-grid--luxury">
            {hotels.map((item) => (
              <article key={item.slug} className="resort-collection-card resort-collection-card--luxury">
                <div
                  className="resort-collection-card__media"
                  style={
                    item.heroImageUrl
                      ? {
                          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.68)), url(${item.heroImageUrl})`
                        }
                      : undefined
                  }
                />
                <div className="resort-collection-card__content">
                  <div className="featured-card__meta">
                    <span>{item.location || "Maldives"}</span>
                    <span>{item.category || "Hotel"}</span>
                  </div>
                  <h2>{item.name}</h2>
                  <p>{item.summary}</p>
                  <div className="card-actions">
                    <Link href={`/hotels/${item.slug}`} className="site-button site-button--teal">
                      View Hotel
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="resort-story-empty-card">
            <h2>No published hotels are available yet.</h2>
            <p>Publish a hotel from the admin portal and it will appear here once public cache refresh completes.</p>
          </article>
        )}
      </div>
    </main>
  );
}
