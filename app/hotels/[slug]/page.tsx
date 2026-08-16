import { notFound } from "next/navigation";

import { PropertyDetailOverview, propertyFactIcons } from "@/components/property-detail-overview";
import { PropertyRoomCard } from "@/components/property-room-card";
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
              {hotel.roomTypes.map((room) => {
                const roomMeta = [
                  room.sizeLabel,
                  room.maxOccupancy ? `Up to ${room.maxOccupancy} guests` : "",
                  room.bedType,
                  room.viewLabel
                ].filter(Boolean);

                return (
                  <PropertyRoomCard
                    room={room}
                    imageAltPrefix={hotel.name}
                    meta={roomMeta}
                    fallbackCopy="Room details coming soon."
                    key={room.id ?? room.name}
                  />
                );
              })}
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
