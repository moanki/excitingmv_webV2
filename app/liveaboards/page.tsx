import Link from "next/link";

import { listPublishedProperties } from "@/lib/services/resort-service";

export default async function LiveaboardsPage() {
  const liveaboards = await listPublishedProperties("liveaboard");

  return (
    <main className="site-section site-section--paper resort-index-page">
      <div className="site-container stack">
        <section className="resort-index-hero">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Liveaboard Collection</p>
              <h1 className="section-title">Explore all liveaboards currently published on the website.</h1>
              <p className="muted">Published liveaboards are managed from the same editorial workflow as resorts.</p>
            </div>
          </div>
        </section>

        {liveaboards.length ? (
          <div className="resort-collection-grid resort-collection-grid--luxury">
            {liveaboards.map((item) => (
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
                    <span>{item.category || "Liveaboard"}</span>
                  </div>
                  <h2>{item.name}</h2>
                  <p>{item.summary}</p>
                  <div className="card-actions">
                    <Link href={`/liveaboards/${item.slug}`} className="site-button site-button--teal">
                      View Liveaboard
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="resort-story-empty-card">
            <h2>No published liveaboards are available yet.</h2>
            <p>Publish a liveaboard from the admin portal and it will appear here once public cache refresh completes.</p>
          </article>
        )}
      </div>
    </main>
  );
}
