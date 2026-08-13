import { notFound } from "next/navigation";

import { PropertyDetailOverview, propertyFactIcons } from "@/components/property-detail-overview";
import { optimizedImageUrl } from "@/lib/image-urls";
import { getResortBySlug } from "@/lib/services/resort-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    { label: "Location", value: hotel.location || "Maldives", Icon: propertyFactIcons.MapPin },
    { label: "Rooms", value: hotel.roomTypes.length ? `${hotel.roomTypes.length} room types` : "To be confirmed", Icon: propertyFactIcons.BedDouble },
    { label: "Transfer", value: hotel.transferType || "Available on request", Icon: propertyFactIcons.Plane },
    { label: "Category", value: hotel.category || "Hotel", Icon: propertyFactIcons.Sparkles }
  ];
  const overviewCopy = hotel.accommodationSummary || hotel.description || hotel.summary || "Discover a curated hotel stay in the Maldives.";

  return (
    <main className="resort-detail-page resort-story-page resort-story-page--resort">
      <PropertyDetailOverview
        actionLabel="hotel"
        backHref="/hotels"
        curatedMoments={hotel.curatedMoments}
        facts={facts}
        heroImageUrl={hotel.heroImageUrl}
        kicker={`${hotel.location || "Maldives"}${hotel.category ? ` / ${hotel.category}` : ""}`}
        name={hotel.name}
        overviewCopy={overviewCopy}
        overviewTitle={hotel.seoTitle || hotel.name}
      />

      {hotel.roomTypes.length ? (
        <section className="site-section site-section--white" id="rooms">
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
