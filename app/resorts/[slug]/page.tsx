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

function formatInlineList(items: string[], fallback: string) {
  const cleaned = items.filter(Boolean);
  return cleaned.length ? cleaned.join(" • ") : fallback;
}

function buildStoryCopy(resort: Awaited<ReturnType<typeof getResortBySlug>>) {
  if (!resort) {
    return "";
  }

  return resort.description || resort.summary || resort.seoSummary || "Discover a luxury island stay in the Maldives.";
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

  const storyCopy = buildStoryCopy(resort);
  const similarResorts = await listSimilarPublishedResorts(resort.slug, resort.category, 3);
  const heroFacts = [
    { label: "Location", value: resort.location || "Maldives" },
    { label: "Transfer", value: resort.transferType || "Available on request" },
    { label: "Meal Plans", value: formatInlineList(resort.mealPlans, "Available on request") },
    { label: "Room Types", value: `${resort.roomTypes.length || 0}` },
    { label: "Category", value: resort.category || "Luxury Resort" }
  ];

  const sectionCards = [
    {
      title: "Signature Experiences",
      items: resort.highlights.filter((item) => /experience|excursion|diving|marine|adventure|snorkel|cruise/i.test(item))
    },
    {
      title: "Dining & Meal Plans",
      items: resort.mealPlans
    },
    {
      title: "Wellness & Island Living",
      items: resort.highlights.filter((item) => /spa|wellness|yoga|healing|retreat|relax/i.test(item))
    }
  ].filter((section) => section.items.length);

  const snapshotHighlights = resort.highlights.filter(Boolean).slice(0, 6);

  return (
    <main className="resort-detail-page resort-story-page">
      <section className="resort-story-hero">
        <div
          className="resort-story-hero__media"
          style={resort.heroImageUrl ? { backgroundImage: `url(${resort.heroImageUrl})` } : undefined}
        />
        <div className="resort-story-hero__overlay" />
        <div className="site-container resort-story-hero__inner">
          <div className="resort-story-hero__copy">
            <p className="section-kicker">{resort.location || "Maldives"}</p>
            <h1>{resort.name}</h1>
            <div className="resort-story-hero__badges">
              <span>{resort.category || "Luxury Resort"}</span>
              <span>{resort.transferType || "Available on request"}</span>
            </div>
            <p className="resort-story-hero__lede">{storyCopy}</p>
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
          <article className="resort-story-facts-card">
            <div className="resort-story-facts__grid">
              {heroFacts.map((fact) => (
                <div key={fact.label} className="resort-story-fact-card">
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="site-section site-section--white">
        <div className="site-container resort-story-editorial">
          <article className="resort-story-editorial__main">
            <p className="eyebrow">About The Resort</p>
            <h2>An island retreat shaped for luxury Maldives stays</h2>
            <p>{resort.description || storyCopy}</p>
            {resort.summary && resort.summary !== resort.description ? <p>{resort.summary}</p> : null}
            {resort.seoSummary && resort.seoSummary !== resort.summary && resort.seoSummary !== resort.description ? (
              <p>{resort.seoSummary}</p>
            ) : null}
          </article>

          <aside className="resort-story-editorial__aside">
            <article className="resort-story-aside-card">
              <p className="eyebrow">Property Snapshot</p>
              <ul className="resort-story-aside-list">
                <li>
                  <span>Atoll / Location</span>
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
                  <strong>{formatInlineList(resort.mealPlans, "Available on request")}</strong>
                </li>
                <li>
                  <span>Highlights</span>
                  <strong>{snapshotHighlights.length ? snapshotHighlights.join(" • ") : "Curated island experiences"}</strong>
                </li>
              </ul>
            </article>
          </aside>
        </div>
      </section>

      <section className="site-section site-section--white" id="rooms">
        <div className="site-container">
          <div className="section-heading resort-story-section-heading">
            <div>
              <p className="eyebrow">Rooms & Villas</p>
              <h2>Accommodation designed around island comfort</h2>
              <p className="muted">
                Every accommodation type saved in the database is surfaced here with its room photo and key details.
              </p>
            </div>
          </div>

          {resort.roomTypes.length ? (
            <div className="resort-story-room-stack">
              {resort.roomTypes.map((room, index) => {
                const roomMeta = [
                  room.sizeLabel,
                  room.maxOccupancy ? `Up to ${room.maxOccupancy} guests` : "",
                  room.bedType,
                  room.viewLabel
                ].filter(Boolean);
                const roomCopy = room.description || room.seoDescription || "Curated room details coming soon.";

                return (
                  <article
                    className={`resort-story-room-card resort-story-room-card--feature${index % 2 === 1 ? " is-reversed" : ""}`}
                    key={room.id ?? `${room.name}-${room.sortOrder}`}
                  >
                    <div
                      className="resort-story-room-card__media"
                      style={room.photoUrl ? { backgroundImage: `url(${room.photoUrl})` } : undefined}
                    />
                    <div className="resort-story-room-card__body">
                      <div className="resort-story-room-card__header">
                        <p className="eyebrow">Room Type</p>
                        <h3>{room.name}</h3>
                        {roomMeta.length ? (
                          <div className="resort-story-room-card__meta">
                            {roomMeta.map((item) => (
                              <span key={item}>{item}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <p>{roomCopy}</p>
                      {room.amenities.filter(Boolean).length ? (
                        <div className="resort-story-chip-row">
                          {room.amenities
                            .filter(Boolean)
                            .slice(0, 10)
                            .map((feature) => (
                              <span key={feature} className="resort-story-chip">
                                {feature}
                              </span>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <article className="resort-story-empty-card">
              <h3>Room details will be updated soon</h3>
              <p>Accommodation details are being prepared and will appear here once room records are added.</p>
            </article>
          )}
        </div>
      </section>

      {sectionCards.length ? (
        <section className="site-section site-section--paper">
          <div className="site-container">
            <div className="resort-story-sections">
              {sectionCards.map((section) => (
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
          </div>
        </section>
      ) : null}

      {resort.seoDescription ? (
        <section className="site-section site-section--white">
          <div className="site-container">
            <article className="resort-story-seo-card">
              <p className="eyebrow">Luxury Travel Perspective</p>
              <h2>Why travellers choose this resort</h2>
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
