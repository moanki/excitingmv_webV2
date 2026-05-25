import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Share2 } from "lucide-react";

import { getResortBySlug, listPublishedProperties } from "@/lib/services/resort-service";
import { optimizedImageUrl } from "@/lib/image-urls";

export async function generateStaticParams() {
  const hotels = await listPublishedProperties("hotels");
  return hotels.map((item) => ({ slug: item.slug }));
}

export default async function HotelDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hotel = await getResortBySlug(slug, "hotels");

  if (!hotel) {
    notFound();
  }

  const facts = [
    { label: "Location", value: hotel.location || "Maldives" },
    { label: "Transfer", value: hotel.transferType || "Available on request" },
    { label: "Rooms", value: hotel.roomTypes.length ? `${hotel.roomTypes.length}` : "To be confirmed" },
    { label: "Meal Plans", value: hotel.mealPlans.filter(Boolean).join(" / ") || "Available on request" },
    { label: "Category", value: hotel.category || "Hotel" },
    {
      label: "Our Selection",
      value: hotel.highlights.filter(Boolean).slice(0, 4).join(" • ") || "Curated hotel stay"
    }
  ];

  return (
    <main className="resort-detail-page resort-story-page">
      <section className="resort-story-hero">
        <div
          className="resort-story-hero__media"
          style={
            hotel.heroImageUrl
              ? { backgroundImage: `url(${optimizedImageUrl(hotel.heroImageUrl, { width: 1800, height: 1100, quality: 82 })})` }
              : undefined
          }
        />
        <div className="resort-story-hero__overlay" />
        <div className="mobile-detail-actions" aria-label="Hotel actions">
          <Link href="/hotels" aria-label="Back to hotels"><ArrowLeft size={18} /></Link>
          <button type="button" aria-label="Share hotel"><Share2 size={18} /></button>
          <button type="button" aria-label="Save hotel"><Heart size={18} /></button>
        </div>
        <div className="site-container resort-story-hero__inner">
          <div className="resort-story-hero__copy">
            <p className="section-kicker">{hotel.location || "Maldives"}</p>
            <h1>{hotel.name}</h1>
            <div className="resort-story-hero__badges">
              <span>{hotel.category || "Hotel"}</span>
              <span>{hotel.transferType || "Available on request"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section site-section--paper resort-story-facts">
        <div className="site-container stack">
          <article className="resort-story-facts-card">
            <div className="resort-story-facts__grid">
              {facts.map((fact) => (
                <div key={fact.label} className="resort-story-fact-card">
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {hotel.galleryMediaUrls.length ? (
        <section className="site-section site-section--white mobile-detail-gallery" aria-label={`${hotel.name} gallery`}>
          <div className="site-container">
            <div className="mobile-gallery-grid">
              {hotel.galleryMediaUrls.slice(0, 6).map((imageUrl) => (
                <div
                  key={imageUrl}
                  style={{ backgroundImage: `url(${optimizedImageUrl(imageUrl, { width: 420, height: 320, quality: 74 })})` }}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="site-section site-section--white">
        <div className="site-container resort-story-editorial">
          <article className="resort-story-editorial__main">
            <p className="eyebrow">About The Hotel</p>
            <h2>{hotel.seoTitle || hotel.name}</h2>
            <p>{hotel.description || hotel.summary}</p>
          </article>
        </div>
      </section>

      {hotel.roomTypes.length ? (
        <section className="site-section site-section--white">
          <div className="site-container">
            <div className="section-heading resort-story-section-heading">
              <div>
                <p className="eyebrow">Rooms</p>
                <h2>Explore hotel room types</h2>
              </div>
            </div>
            <div className="resort-story-room-stack">
              {hotel.roomTypes.map((room) => (
                <article className="resort-story-room-card--property" key={room.id ?? room.name}>
                  <div
                    className="resort-story-room-card__media"
                    style={
                      room.photoUrl
                        ? { backgroundImage: `url(${optimizedImageUrl(room.photoUrl, { width: 760, height: 520, quality: 76 })})` }
                        : undefined
                    }
                  />
                  <div className="resort-story-room-card__body">
                    <div className="resort-story-room-card__header">
                      <p className="eyebrow">Room Type</p>
                      <h3>{room.name}</h3>
                    </div>
                    <p>{room.description || room.seoDescription || "Room details coming soon."}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="mobile-sticky-inquiry">
        <a href="/#newsletter">Inquire Now</a>
      </div>
    </main>
  );
}
