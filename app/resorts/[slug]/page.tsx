import { notFound } from "next/navigation";

import { getResortBySlug, listPublishedResorts } from "@/lib/services/resort-service";

export async function generateStaticParams() {
  const resorts = await listPublishedResorts();
  return resorts.map((resort) => ({ slug: resort.slug }));
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

  return (
    <main className="resort-detail-page">
      <section className="resort-detail-hero">
        <div
          className="resort-detail-hero__media"
          style={
            resort.heroImageUrl
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.72)), url(${resort.heroImageUrl})`
                }
              : undefined
          }
        />
        <div className="resort-detail-hero__overlay" />
        <div className="site-container resort-detail-hero__content">
          <p className="section-kicker">{resort.location || "Maldives"}</p>
          <h1>{resort.name}</h1>
          <p className="resort-detail-hero__lede">{resort.description || resort.summary}</p>
          <div className="resort-detail-facts">
            <article className="resort-detail-fact">
              <span>Category</span>
              <strong>{resort.category || "Luxury Resort"}</strong>
            </article>
            <article className="resort-detail-fact">
              <span>Transfer Type</span>
              <strong>{resort.transferType || "Available on request"}</strong>
            </article>
            <article className="resort-detail-fact">
              <span>Meal Plans</span>
              <strong>{resort.mealPlans[0] || "Details available on request"}</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="site-section site-section--white">
        <div className="site-container resort-detail-grid">
          <article className="panel resort-detail-panel">
            <p className="section-kicker">Overview</p>
            <h2>About {resort.name}</h2>
            <p>{resort.description || resort.summary}</p>
          </article>

          <article className="panel resort-detail-panel">
            <p className="section-kicker">Commercial Details</p>
            <h2>Meal Plans</h2>
            <ul className="resort-detail-list">
              {resort.mealPlans.length ? (
                resort.mealPlans.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>Meal plan details will be added by the resort team.</li>
              )}
            </ul>
          </article>
        </div>
      </section>

      <section className="site-section site-section--paper">
        <div className="site-container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Highlights</p>
              <h2>What makes this resort stand out</h2>
            </div>
          </div>
          <div className="resort-highlights-grid">
            {(resort.highlights.length ? resort.highlights : ["More highlights will be published soon."]).map((item) => (
              <article className="resort-highlight-card" key={item}>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-section--white">
        <div className="site-container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Room Types</p>
              <h2>Accommodation at {resort.name}</h2>
            </div>
          </div>
          <div className="room-grid">
            {resort.roomTypes.length ? (
              resort.roomTypes.map((room) => (
                <article className="room-card" key={`${room.name}-${room.sortOrder}`}>
                  <div
                    className="room-card__media"
                    style={room.photoUrl ? { backgroundImage: `url(${room.photoUrl})` } : undefined}
                  />
                  <div className="room-card__content">
                    <h3>{room.name}</h3>
                    <p>{room.description || room.seoDescription}</p>
                    {room.seoDescription && room.seoDescription !== room.description ? (
                      <p className="room-card__seo">{room.seoDescription}</p>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <article className="room-card room-card--empty">
                <div className="room-card__content">
                  <h3>Room information coming soon</h3>
                  <p>The resort room types will appear here as soon as they are added in the admin portal.</p>
                </div>
              </article>
            )}
          </div>
        </div>
      </section>

      {resort.galleryMediaUrls.length ? (
        <section className="site-section site-section--paper">
          <div className="site-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Gallery</p>
                <h2>Property visuals</h2>
              </div>
            </div>
            <div className="resort-gallery-grid">
              {resort.galleryMediaUrls.map((imageUrl) => (
                <div
                  key={imageUrl}
                  className="resort-gallery-card"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
