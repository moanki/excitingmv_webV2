import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, Heart, MapPin, Palette, Plane, Share2, Sparkles, Utensils, Waves } from "lucide-react";

import {
  getResortBySlug,
  listSimilarPublishedResorts
} from "@/lib/services/resort-service";
import { optimizedImageUrl } from "@/lib/image-urls";

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

function buildEditorialPhilosophy(resort: NonNullable<Awaited<ReturnType<typeof getResortBySlug>>>) {
  const category = resort.category ? resort.category.toLowerCase() : "island luxury";

  return [
    `${resort.name} pairs ${category} with a calm sense of place, where design, nature, and service are allowed to breathe.`,
    "Days unfold through private villas, considered dining, and curated moments that feel personal, unhurried, and deeply connected to the Maldives."
  ];
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
  const philosophyParagraphs = buildEditorialPhilosophy(resort);
  const topFacts = [
    { label: "Location", value: resort.location || "Maldives", Icon: MapPin },
    { label: "Villas", value: resort.roomTypes.length ? `${resort.roomTypes.length} room types` : "To be confirmed", Icon: BedDouble },
    { label: "Transfer", value: resort.transferType || "Available on request", Icon: Plane },
    { label: "Category", value: resort.category || formatInlineList(resort.mealPlans, "Luxury island resort"), Icon: Sparkles }
  ];
  const heroBackground = resort.heroImageUrl
    ? `url(${optimizedImageUrl(resort.heroImageUrl, { width: 1800, height: 1100, quality: 86 })})`
    : "linear-gradient(135deg, #163f35 0%, #f3edaa 52%, #f4f2ec 100%)";
  const curatedMoments = [
    {
      title: "Art-immersive island",
      copy: "Discover installations, sculptures, and creative spaces woven through the island.",
      Icon: Palette
    },
    {
      title: "Private pool villas",
      copy: "Elegant beach and overwater villas designed for privacy and comfort.",
      Icon: Waves
    },
    {
      title: "Jadugar service",
      copy: "Enjoy intuitive, personal service from your own Jadugar throughout your stay.",
      Icon: Sparkles
    },
    {
      title: "Island wellness",
      copy: "Slow rituals, ocean calm, and restorative spaces for mind and body.",
      Icon: Utensils
    }
  ];
  const topSectionLinks = [
    { href: "#overview", label: "Overview" },
    { href: "#experiences", label: "Curated Moments" },
    { href: "#rooms", label: "Rooms & Villas" }
  ];

  return (
    <main className="resort-detail-page resort-story-page resort-story-page--resort">
      <section className="resort-story-hero" style={{ backgroundImage: heroBackground }}>
        <div className="resort-story-hero__overlay" />
        <div className="mobile-detail-actions" aria-label="Resort actions">
          <Link href="/resorts" aria-label="Back to resorts"><ArrowLeft size={18} /></Link>
          <button type="button" aria-label="Share resort"><Share2 size={18} /></button>
          <button type="button" aria-label="Save resort"><Heart size={18} /></button>
        </div>
        <div className="site-container resort-story-hero__inner">
          <div className="resort-story-hero__copy">
            <p className="section-kicker">{resort.location || "Maldives"}{resort.category ? ` / ${resort.category}` : ""}</p>
            <h1>{resort.name}</h1>
          </div>
        </div>
      </section>

      <section className="resort-story-intro" id="overview">
        <div className="site-container stack">
          <article className="resort-story-facts-card">
            <div className="resort-story-facts__grid">
              {topFacts.map((fact) => (
                <div key={fact.label} className="resort-story-fact-card">
                  <fact.Icon size={16} aria-hidden="true" />
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <nav className="resort-story-tabs" aria-label="Resort sections">
            {topSectionLinks.map((link) => (
              <a key={link.href} href={link.href} className="resort-story-tab">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="resort-story-editorial">
            <article className="resort-story-editorial__main">
              <p className="eyebrow">The Philosophy</p>
              <h2>Where art, nature, and joy come together</h2>
              {philosophyParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <a href="#rooms" className="resort-story-text-link">Discover the stay</a>
            </article>

            <article className="resort-story-editorial__aside" id="experiences">
              <p className="eyebrow">Curated Moments</p>
              <div className="resort-story-curated-list">
                {curatedMoments.map((item) => (
                  <div className="resort-story-curated-item" key={`${item.title}-${item.copy}`}>
                    <span className="resort-story-curated-icon">
                      <item.Icon size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

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
                const amenities = room.amenities.filter(Boolean);

                return (
                  <article className="resort-story-room-card--property" key={room.id ?? `${room.name}-${room.sortOrder}`}>
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
