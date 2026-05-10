import Link from "next/link";

import { listPublishedResorts } from "@/lib/services/resort-service";

export default async function ResortsPage() {
  const resorts = await listPublishedResorts();

  return (
    <main className="site-section site-section--paper resort-index-page">
      <div className="site-container stack">
        <section className="resort-index-hero">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Resort Collection</p>
              <h1 className="section-title">Explore all resorts currently published on the website.</h1>
              <p className="muted">
                This public collection now reflects only active published resorts from Supabase, with archived or
                deleted inventory excluded from view.
              </p>
            </div>
          </div>
          <div className="resort-index-hero__meta">
            <article className="resort-index-stat">
              <span>Published Resorts</span>
              <strong>{resorts.length}</strong>
            </article>
            <article className="resort-index-stat">
              <span>Collection Style</span>
              <strong>Luxury Maldives</strong>
            </article>
          </div>
        </section>

        {resorts.length ? (
          <div className="resort-collection-grid resort-collection-grid--luxury">
            {resorts.map((resort) => (
              <article key={resort.slug} className="resort-collection-card resort-collection-card--luxury">
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
        ) : (
          <article className="resort-story-empty-card">
            <h2>No published resorts are available yet.</h2>
            <p>Publish a resort from the admin portal and it will appear here once public cache refresh completes.</p>
          </article>
        )}
      </div>
    </main>
  );
}
