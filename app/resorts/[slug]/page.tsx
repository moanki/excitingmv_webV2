import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getResortBySlug,
  listSimilarPublishedResorts
} from "@/lib/services/resort-service";
import { optimizedImageUrl } from "@/lib/image-urls";
import { PropertyDetailOverview, propertyFactIcons } from "@/components/property-detail-overview";
import { PropertyRoomCard } from "@/components/property-room-card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatInlineList(items: string[], fallback: string) {
  const cleaned = items.filter(Boolean);
  return cleaned.length ? cleaned.join(" / ") : fallback;
}

const similarResortFallbackImages = [
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=82"
];

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

  const similarResorts = await listSimilarPublishedResorts(resort.slug, resort.category, 5);
  const aboutParagraphs = buildAboutParagraphs(resort);
  const storyTitle = resort.seoTitle?.trim() || `Discover ${resort.name}`;
  const topFacts = [
    { label: "Location", value: resort.location || "Maldives", Icon: propertyFactIcons.MapPin },
    { label: "Villas", value: resort.roomTypes.length ? `${resort.roomTypes.length} room types` : "To be confirmed", Icon: propertyFactIcons.BedDouble },
    { label: "Transfer", value: resort.transferType || "Available on request", Icon: propertyFactIcons.Plane },
    { label: "Category", value: resort.category || formatInlineList(resort.mealPlans, "Luxury island resort"), Icon: propertyFactIcons.Sparkles }
  ];
  const curatedMoments = resort.curatedMoments.filter((item) => item.title || item.description || item.iconUrl);
  const overviewCopy = resort.accommodationSummary || aboutParagraphs[0];

  return (
    <main className="resort-detail-page resort-story-page resort-story-page--resort">
      <PropertyDetailOverview
        actionLabel="resort"
        backHref="/resorts"
        curatedMoments={curatedMoments}
        facts={topFacts}
        heroImageUrl={resort.heroImageUrl}
        kicker={`${resort.location || "Maldives"}${resort.category ? ` / ${resort.category}` : ""}`}
        name={resort.name}
        overviewCopy={overviewCopy}
        overviewTitle={storyTitle}
      />

      <section className="site-section site-section--white" id="rooms">
        <div className="site-container">
          <div className="section-heading resort-story-section-heading">
            <div>
              <p className="eyebrow">Rooms & Villas</p>
              <h2>Explore the accommodation collection</h2>
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
                return (
                  <PropertyRoomCard
                    room={room}
                    imageAltPrefix={resort.name}
                    meta={roomMeta}
                    fallbackCopy={roomCopy}
                    key={room.id ?? `${room.name}-${room.sortOrder}`}
                  />
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

      {similarResorts.length ? (
        <section className="site-section site-section--white resort-story-similar" id="similar-resorts">
          <div className="site-container">
            <div className="resort-story-similar__heading">
              <p>Continue exploring the collection</p>
            </div>
            <div className="resort-story-similar__row">
              {similarResorts.map((item, index) => {
                const cardImage = item.heroImageUrl || similarResortFallbackImages[index % similarResortFallbackImages.length];

                return (
                <article key={item.slug} className="resort-story-similar-card">
                  <Link href={`/resorts/${item.slug}`} className="resort-story-similar-card__image" aria-label={`Explore ${item.name}`}>
                    <img
                      src={optimizedImageUrl(cardImage, { width: 420, height: 280, quality: 78 })}
                      alt=""
                    />
                  </Link>
                  <div className="resort-story-similar-card__body">
                    <h3>{item.name}</h3>
                    <p>{item.summary || `${item.category || "Luxury resort"} in ${item.location || "the Maldives"}.`}</p>
                    <Link href={`/resorts/${item.slug}`} className="resort-story-similar-card__link">
                      Explore
                    </Link>
                  </div>
                </article>
                );
              })}
              <article className="resort-story-similar-more">
                <Link href="/resorts" className="resort-story-similar-more__panel">
                  <span>More Resorts</span>
                </Link>
                <Link href="/resorts" className="resort-story-similar-more__link">
                  View All Collection
                </Link>
              </article>
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
