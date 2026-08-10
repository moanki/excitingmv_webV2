import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Share2 } from "lucide-react";

import { getResortBySlug } from "@/lib/services/resort-service";
import { optimizedImageUrl } from "@/lib/image-urls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LiveaboardDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const liveaboard = await getResortBySlug(slug, "liveaboards");

  if (!liveaboard) {
    notFound();
  }

  const facts = [
    { label: "Route / Atoll", value: liveaboard.location || "Maldives" },
    { label: "Category", value: liveaboard.category || "Liveaboard" },
    { label: "Transfer", value: liveaboard.transferType || "Available on request" },
    { label: "Cabins", value: liveaboard.roomTypes.length ? `${liveaboard.roomTypes.length}` : "To be confirmed" },
    {
      label: "Our Selection",
      value: liveaboard.highlights.filter(Boolean).slice(0, 4).join(" • ") || "Marine-focused voyage"
    }
  ];

  return (
    <main className="resort-detail-page resort-story-page">
      <section className="resort-story-hero">
        <div
          className="resort-story-hero__media"
          style={
            liveaboard.heroImageUrl
              ? { backgroundImage: `url(${optimizedImageUrl(liveaboard.heroImageUrl, { width: 1800, height: 1100, quality: 82 })})` }
              : undefined
          }
        />
        <div className="resort-story-hero__overlay" />
        <div className="mobile-detail-actions" aria-label="Liveaboard actions">
          <Link href="/liveaboards" aria-label="Back to liveaboards"><ArrowLeft size={18} /></Link>
          <button type="button" aria-label="Share liveaboard"><Share2 size={18} /></button>
          <button type="button" aria-label="Save liveaboard"><Heart size={18} /></button>
        </div>
        <div className="site-container resort-story-hero__inner">
          <div className="resort-story-hero__copy">
            <p className="section-kicker">{liveaboard.location || "Maldives"}</p>
            <h1>{liveaboard.name}</h1>
            <div className="resort-story-hero__badges">
              <span>{liveaboard.category || "Liveaboard"}</span>
              <span>{liveaboard.transferType || "Available on request"}</span>
            </div>
          </div>
        </div>
      </section>

      {liveaboard.galleryMediaUrls.length ? (
        <section className="site-section site-section--white mobile-detail-gallery" aria-label={`${liveaboard.name} gallery`}>
          <div className="site-container">
            <div className="mobile-gallery-grid">
              {liveaboard.galleryMediaUrls.slice(0, 6).map((imageUrl) => (
                <div
                  key={imageUrl}
                  style={{ backgroundImage: `url(${optimizedImageUrl(imageUrl, { width: 420, height: 320, quality: 74 })})` }}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

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

      <section className="site-section site-section--white">
        <div className="site-container resort-story-editorial">
          <article className="resort-story-editorial__main">
            <p className="eyebrow">About The Liveaboard</p>
            <h2>{liveaboard.seoTitle || liveaboard.name}</h2>
            <p>{liveaboard.description || liveaboard.summary}</p>
          </article>
        </div>
      </section>

      {liveaboard.roomTypes.length ? (
        <section className="site-section site-section--white">
          <div className="site-container">
            <div className="section-heading resort-story-section-heading">
              <div>
                <p className="eyebrow">Cabins</p>
                <h2>Explore cabin types</h2>
              </div>
            </div>
            <div className="resort-story-room-stack">
              {liveaboard.roomTypes.map((room) => (
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
                      <p className="eyebrow">Cabin Type</p>
                      <h3>{room.name}</h3>
                    </div>
                    <p>{room.description || room.seoDescription || "Cabin details coming soon."}</p>
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
