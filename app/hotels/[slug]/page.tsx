import { notFound } from "next/navigation";

import { getResortBySlug, listPublishedProperties } from "@/lib/services/resort-service";

export async function generateStaticParams() {
  const hotels = await listPublishedProperties("hotel");
  return hotels.map((item) => ({ slug: item.slug }));
}

export default async function HotelDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hotel = await getResortBySlug(slug, "hotel");

  if (!hotel) {
    notFound();
  }

  return (
    <main className="resort-detail-page resort-story-page">
      <section className="resort-story-hero">
        <div
          className="resort-story-hero__media"
          style={hotel.heroImageUrl ? { backgroundImage: `url(${hotel.heroImageUrl})` } : undefined}
        />
        <div className="resort-story-hero__overlay" />
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

      <section className="site-section site-section--white">
        <div className="site-container resort-story-editorial">
          <article className="resort-story-editorial__main">
            <p className="eyebrow">About The Hotel</p>
            <h2>{hotel.seoTitle || hotel.name}</h2>
            <p>{hotel.description || hotel.summary}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
