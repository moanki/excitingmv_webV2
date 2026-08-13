import { notFound } from "next/navigation";

import { PropertyDetailOverview, propertyFactIcons } from "@/components/property-detail-overview";
import { optimizedImageUrl } from "@/lib/image-urls";
import { getResortBySlug } from "@/lib/services/resort-service";

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
    { label: "Route / Atoll", value: liveaboard.location || "Maldives", Icon: propertyFactIcons.MapPin },
    { label: "Cabins", value: liveaboard.roomTypes.length ? `${liveaboard.roomTypes.length} cabin types` : "To be confirmed", Icon: propertyFactIcons.BedDouble },
    { label: "Transfer", value: liveaboard.transferType || "Available on request", Icon: propertyFactIcons.Sailboat },
    { label: "Category", value: liveaboard.category || "Liveaboard", Icon: propertyFactIcons.Sparkles }
  ];
  const overviewCopy =
    liveaboard.accommodationSummary ||
    liveaboard.description ||
    liveaboard.summary ||
    "Discover a marine-focused Maldives voyage shaped for diving, cruising, and private ocean itineraries.";

  return (
    <main className="resort-detail-page resort-story-page resort-story-page--resort">
      <PropertyDetailOverview
        actionLabel="liveaboard"
        backHref="/liveaboards"
        curatedMoments={liveaboard.curatedMoments}
        facts={facts}
        heroImageUrl={liveaboard.heroImageUrl}
        kicker={`${liveaboard.location || "Maldives"}${liveaboard.category ? ` / ${liveaboard.category}` : ""}`}
        name={liveaboard.name}
        overviewCopy={overviewCopy}
        overviewTitle={liveaboard.seoTitle || liveaboard.name}
        roomsLabel="Discover the Voyage"
      />

      {liveaboard.roomTypes.length ? (
        <section className="site-section site-section--white" id="rooms">
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
