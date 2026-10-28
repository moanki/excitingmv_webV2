import { notFound } from "next/navigation";

import { PropertyDetailOverview, propertyFactIcons } from "@/components/property-detail-overview";
import { PropertyRoomCard } from "@/components/property-room-card";
import { getResortBySlug } from "@/lib/services/resort-service";
import { ResortLocationMap } from "@/components/resort-location-map";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { propertyOverviewCopy } from "@/lib/property-overview";

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

  const brochureUrl = hotel.brochurePath
    ? createSupabaseAdminClient().storage.from("resort-brochures").getPublicUrl(hotel.brochurePath, {
        download: `${hotel.name} Brochure.pdf`
      }).data.publicUrl
    : "";
  const butlerServiceLabel = hotel.butlerService.available === false
    ? "Not available"
    : hotel.butlerService.displayName?.trim().toLowerCase() === "yes"
      ? "Available"
      : hotel.butlerService.displayName?.trim() || hotel.butlerService.description?.trim() || "To be confirmed";
  const facts = [
    { label: "Location", value: hotel.location || "Maldives", Icon: propertyFactIcons.MapPin },
    { label: "Rooms", value: hotel.roomTypes.length ? `${hotel.roomTypes.length} room types` : "To be confirmed", Icon: propertyFactIcons.BedDouble },
    { label: "Transfer", value: hotel.transferType || "Available on request", Icon: propertyFactIcons.Plane },
    { label: "Category", value: hotel.category || "Hotel", Icon: propertyFactIcons.Sparkles },
    { label: "Butler Service", value: butlerServiceLabel, Icon: propertyFactIcons.ConciergeBell },
    ...(brochureUrl ? [{ label: "Download Brochure", value: `${hotel.name} Brochure`, href: brochureUrl, Icon: propertyFactIcons.FileDown }] : [])
  ];
  const overviewCopy = propertyOverviewCopy(hotel, "Discover a curated hotel stay in the Maldives.");

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

      {hotel.mapEmbedUrl || (hotel.latitude !== null && hotel.longitude !== null) ? (
        <section className="site-section site-section--white resort-location-section" id="location">
          <div className="site-container">
            <div className="section-heading resort-story-section-heading">
              <div>
                <p className="eyebrow">Location</p>
                <h2>Find {hotel.name}</h2>
              </div>
            </div>
            <ResortLocationMap name={hotel.name} mapEmbedUrl={hotel.mapEmbedUrl} latitude={hotel.latitude} longitude={hotel.longitude} />
          </div>
        </section>
      ) : null}

    </main>
  );
}
