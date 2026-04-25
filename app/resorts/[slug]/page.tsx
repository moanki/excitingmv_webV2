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

function buildAboutParagraphs(resort: Awaited<ReturnType<typeof getResortBySlug>>) {
  if (!resort) {
    return ["Discover a luxury island stay in the Maldives."];
  }

  const paragraphs = [resort.description, resort.summary, resort.seoSummary]
    .map((item) => item?.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, 2);

  return paragraphs.length ? paragraphs : ["Discover a luxury island stay in the Maldives."];
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
  const aboutParagraphs = buildAboutParagraphs(resort);
  const signatureExperiences = resort.highlights.filter(
    (item) => !/spa|wellness|yoga|healing|retreat|relax/i.test(item)
  );
  const wellnessHighlights = resort.highlights.filter((item) =>
    /spa|wellness|yoga|healing|retreat|relax/i.test(item)
  );
  const topFacts = [
    { label: "Location", value: resort.location || "Maldives" },
    { label: "Transfer", value: resort.transferType || "Available on request" },
    { label: "Meal Plans", value: formatInlineList(resort.mealPlans, "Available on request") },
    { label: "Room Types", value: resort.roomTypes.length ? `${resort.roomTypes.length}` : "To be confirmed" },
    { label: "Category", value: resort.category || "Luxury Resort" }
  ];

  const sectionLinks = [
    { href: "#overview", label: "Overview" },
    { href: "#rooms", label: "Rooms & Villas" },
    ...(signatureExperiences.length ? [{ href: "#experiences", label: "Experiences" }] : []),
    ...(wellnessHighlights.length ? [{ href: "#wellness", label: "Wellness" }] : []),
    ...(similarResorts.length ? [{ href: "#similar-resorts", label: "Similar Resorts" }] : [])
  ];

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
            <div className="resort-story-hero__actions">
              <a href="#rooms" className="site-button site-button--ghost">
                View Rooms
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section site-section--paper resort-story-facts">
        <div className="site-container stack">
          <article className="resort-story-facts-card">
            <div className="resort-story-facts__grid">
              {topFacts.map((fact) => (
                <div key={fact.label} className="resort-story-fact-card">
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <nav className="resort-story-tabs" aria-label="Resort sections">
            {sectionLinks.map((link) => (
              <a key={link.href} href={link.href} className="resort-story-tab">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="site-section site-section--white" id="overview">
        <div className="site-container resort-story-editorial">
          <article className="resort-story-editorial__main">
            <p className="eyebrow">About The Resort</p>
            <h2>A modern island stay designed around comfort and place</h2>
            {aboutParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
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
                  <strong>
                    {resort.highlights.filter(Boolean).length
                      ? resort.highlights.filter(Boolean).slice(0, 4).join(" • ")
                      : "Curated island experiences"}
                  </strong>
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
              <h2>Explore the accommodation collection</h2>
              <p className="muted">Large room cards highlight the stay experience without any booking clutter.</p>
            </div>
          </div>

          {resort.roomTypes.length ? (
            <div className="resort-story-room-stack">
              {resort.roomTypes.map((room) => {
                const roomMeta = [
                  room.sizeLabel,
                  room.maxOccupancy ? `Up to ${room.maxOccupancy} guests` : "",
                  room.bedType,
                  room.viewLabel
                ].filter(Boolean);
                const roomCopy = room.description || room.seoDescription || "Curated room details coming soon.";
                const amenities = room.amenities.filter(Boolean);

                return (
                  <article className="resort-story-room-card--property" key={room.id ?? `${room.name}-${room.sortOrder}`}>
                    <div
                      className="resort-story-room-card__media"
                      style={room.photoUrl ? { backgroundImage: `url(${room.photoUrl})` } : undefined}
                    />
                    <div className="resort-story-room-card__body">
                      <div className="resort-story-room-card__header">
                        <p className="eyebrow">Room Type</p>
                        <h3>{room.name}</h3>
                      </div>

                      {roomMeta.length ? (
                        <div className="resort-story-room-facts">
                          {roomMeta.map((item) => (
                            <span key={item}>{item}</span>
                          ))}
                        </div>
                      ) : null}

                      <p>{roomCopy}</p>

                      {amenities.length ? (
                        <div className="resort-story-room-amenities">
                          <p className="eyebrow">Room Amenities</p>
                          <ul className="resort-story-room-amenities__list">
                            {amenities.map((feature) => (
                              <li key={feature}>{feature}</li>
                            ))}
                          </ul>
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

      {signatureExperiences.length ? (
        <section className="site-section site-section--paper" id="experiences">
          <div className="site-container">
            <article className="resort-story-section-card">
              <p className="eyebrow">Signature Experiences</p>
              <ul className="resort-story-points">
                {signatureExperiences.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      ) : null}

      {wellnessHighlights.length ? (
        <section className="site-section site-section--white" id="wellness">
          <div className="site-container">
            <article className="resort-story-section-card">
              <p className="eyebrow">Wellness & Island Living</p>
              <ul className="resort-story-points">
                {wellnessHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      ) : null}

      {similarResorts.length ? (
        <section className="site-section site-section--paper" id="similar-resorts">
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
