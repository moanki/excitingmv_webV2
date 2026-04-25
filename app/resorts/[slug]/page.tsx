import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getResortBySlug,
  listPublishedResorts,
  listSimilarPublishedResorts
} from "@/lib/services/resort-service";

export async function generateStaticParams() {
  const resorts = await listPublishedResorts();
  return resorts.map((resort) => ({ slug: resort.slug }));
}

function formatFactList(items: string[]) {
  if (!items.length) {
    return "Available on request";
  }

  return items.join(" • ");
}

export default async function ResortDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resort = await getResortBySlug(slug);

  if (!resort) {
    notFound();
  }

  const similarResorts = await listSimilarPublishedResorts(resort.slug, resort.category, 3);
  const heroSummary = resort.description || resort.summary || resort.seoSummary;
  const heroBadges = [resort.location, resort.category, resort.transferType].filter(Boolean);
  const quickFacts = [
    { label: "Transfer", value: resort.transferType || "Available on request" },
    { label: "Meal Plans", value: formatFactList(resort.mealPlans) },
    { label: "Rooms", value: resort.roomTypes.length ? `${resort.roomTypes.length} room types` : "To be confirmed" },
    { label: "Category", value: resort.category || "Luxury Resort" },
    { label: "Highlights", value: resort.highlights[0] || "Curated island experience" }
  ];
  const experienceSections = [
    {
      title: "Signature Experiences",
      items: resort.highlights.filter((item) => /experience|excursion|diving|marine|adventure/i.test(item))
    },
    {
      title: "Dining & Culinary Moments",
      items: resort.mealPlans.filter((item) => /board|inclusive|dining|culinary/i.test(item))
    },
    {
      title: "Wellness & Slow Living",
      items: resort.highlights.filter((item) => /spa|wellness|yoga|healing|retreat/i.test(item))
    }
  ].filter((section) => section.items.length);

  return (
    <main className="resort-detail-page resort-story-page">
      <section className="resort-story-hero">
        <div
          className="resort-story-hero__media"
          style={
            resort.heroImageUrl
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(8, 15, 26, 0.16), rgba(8, 15, 26, 0.76)), url(${resort.heroImageUrl})`
                }
              : undefined
          }
        />
        <div className="resort-story-hero__overlay" />
        <div className="site-container resort-story-hero__inner">
          <div className="resort-story-hero__copy">
            <p className="section-kicker">{resort.location || "Maldives"}</p>
            <h1>{resort.name}</h1>
            <div className="resort-story-hero__badges">
              {heroBadges.map((badge) => (
                <span key={badge}>{badge}</span>
              ))}
            </div>
            <p className="resort-story-hero__lede">{heroSummary}</p>
            <div className="resort-story-hero__actions">
              <Link href="/contact" className="site-button site-button--teal">
                Send Enquiry
              </Link>
              <a href="#rooms" className="site-button site-button--ghost">
                View Rooms
              </a>
              <Link href="/contact" className="site-button site-button--ghost">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section site-section--paper resort-story-facts">
        <div className="site-container">
          <div className="resort-story-facts__grid">
            {quickFacts.map((fact) => (
              <article key={fact.label} className="resort-story-fact-card">
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-section--white">
        <div className="site-container resort-story-editorial">
          <article className="resort-story-editorial__main">
            <p className="eyebrow">About The Resort</p>
            <h2>{resort.name} at a glance</h2>
            <p>{heroSummary}</p>
            {resort.highlights.length ? (
              <div className="resort-story-chip-row">
                {resort.highlights.map((highlight) => (
                  <span key={highlight} className="resort-story-chip">
                    {highlight}
                  </span>
                ))}
              </div>
            ) : null}
          </article>

          <aside className="resort-story-editorial__aside">
            <article className="resort-story-aside-card">
              <p className="eyebrow">Property Snapshot</p>
              <ul className="resort-story-aside-list">
                <li>
                  <span>Atoll</span>
                  <strong>{resort.location || "Maldives"}</strong>
                </li>
                <li>
                  <span>Category</span>
                  <strong>{resort.category || "Luxury Resort"}</strong>
                </li>
                <li>
                  <span>Transfer</span>
                  <strong>{resort.transferType || "Available on request"}</strong>
                </li>
                <li>
                  <span>Meal Plans</span>
                  <strong>{formatFactList(resort.mealPlans)}</strong>
                </li>
              </ul>
            </article>
          </aside>
        </div>
      </section>

      {resort.galleryMediaUrls.length ? (
        <section className="site-section site-section--paper">
          <div className="site-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Gallery</p>
                <h2>Inside the resort experience</h2>
              </div>
            </div>
            <div className="resort-story-gallery">
              {resort.galleryMediaUrls.map((imageUrl, index) => (
                <article
                  key={`${imageUrl}-${index}`}
                  className={`resort-story-gallery__item${index === 0 ? " is-featured" : ""}`}
                  style={{ backgroundImage: `url(${imageUrl})` }}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="site-section site-section--white" id="rooms">
        <div className="site-container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Rooms & Villas</p>
              <h2>Stay options at {resort.name}</h2>
              <p className="muted">If room records exist in the database, they are surfaced here automatically.</p>
            </div>
          </div>

          {resort.roomTypes.length ? (
            <div className="resort-story-room-grid">
              {resort.roomTypes.map((room) => (
                <article className="resort-story-room-card" key={room.id ?? `${room.name}-${room.sortOrder}`}>
                  <div
                    className="resort-story-room-card__media"
                    style={room.photoUrl ? { backgroundImage: `url(${room.photoUrl})` } : undefined}
                  />
                  <div className="resort-story-room-card__body">
                    <div className="resort-story-room-card__header">
                      <h3>{room.name}</h3>
                      <div className="resort-story-room-card__meta">
                        {[room.sizeLabel, room.maxOccupancy ? `Up to ${room.maxOccupancy} guests` : "", room.bedType]
                          .filter(Boolean)
                          .map((item) => (
                            <span key={item}>{item}</span>
                          ))}
                      </div>
                    </div>
                    <p>{room.description || room.seoDescription || "Curated room details coming soon."}</p>
                    {[room.viewLabel, ...room.amenities].filter(Boolean).length ? (
                      <div className="resort-story-chip-row">
                        {[room.viewLabel, ...room.amenities]
                          .filter(Boolean)
                          .slice(0, 8)
                          .map((feature) => (
                            <span key={feature} className="resort-story-chip">
                              {feature}
                            </span>
                          ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <article className="resort-story-empty-card">
              <h3>Room details will be updated soon</h3>
              <p>Accommodation details are being prepared and will appear here once room records are added.</p>
            </article>
          )}
        </div>
      </section>

      {experienceSections.length ? (
        <section className="site-section site-section--paper">
          <div className="site-container resort-story-sections">
            {experienceSections.map((section) => (
              <article key={section.title} className="resort-story-section-card">
                <p className="eyebrow">{section.title}</p>
                <div className="resort-story-chip-row">
                  {section.items.map((item) => (
                    <span key={item} className="resort-story-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {resort.seoDescription ? (
        <section className="site-section site-section--white">
          <div className="site-container">
            <article className="resort-story-seo-card">
              <p className="eyebrow">SEO Overview</p>
              <h2>Why this resort resonates with luxury travelers</h2>
              <p>{resort.seoDescription}</p>
            </article>
          </div>
        </section>
      ) : null}

      {similarResorts.length ? (
        <section className="site-section site-section--paper">
          <div className="site-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Similar Resorts</p>
                <h2>Continue exploring the collection</h2>
              </div>
            </div>
            <div className="resort-collection-grid resort-collection-grid--luxury">
              {similarResorts.map((item) => (
                <article key={item.slug} className="resort-collection-card resort-collection-card--luxury">
                  <div
                    className="resort-collection-card__media"
                    style={
                      item.heroImageUrl
                        ? {
                            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.72)), url(${item.heroImageUrl})`
                          }
                        : undefined
                    }
                  />
                  <div className="resort-collection-card__content">
                    <div className="featured-card__meta">
                      <span>{item.location || "Maldives"}</span>
                      <span>{item.category || "Luxury Resort"}</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.summary}</p>
                    <div className="card-actions">
                      <Link href={`/resorts/${item.slug}`} className="site-button site-button--teal">
                        View Resort
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
