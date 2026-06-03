import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, Heart, MapPin, Palette, Plane, Share2, Sparkles, Utensils, Waves } from "lucide-react";

import {
  getResortBySlug,
  listPublishedResorts,
  listSimilarPublishedResorts
} from "@/lib/services/resort-service";
import { optimizedImageUrl } from "@/lib/image-urls";

export async function generateStaticParams() {
  const resorts = await listPublishedResorts();
  return resorts.map((resort) => ({ slug: resort.slug }));
}

function formatInlineList(items: string[], fallback: string) {
  const cleaned = items.filter(Boolean);
  return cleaned.length ? cleaned.join(" / ") : fallback;
}

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

  const similarResorts = await listSimilarPublishedResorts(resort.slug, resort.category, 3);
  const aboutParagraphs = buildAboutParagraphs(resort);
  const signatureExperiences = resort.highlights.filter(
    (item) => !/spa|wellness|yoga|healing|retreat|relax/i.test(item)
  );
  const wellnessHighlights = resort.highlights.filter((item) =>
    /spa|wellness|yoga|healing|retreat|relax/i.test(item)
  );
  const topFacts = [
    { label: "Location", value: resort.location || "Maldives", Icon: MapPin },
    { label: "Transfer", value: resort.transferType || "Available on request", Icon: Plane },
    { label: "Meal Plans", value: formatInlineList(resort.mealPlans, "Available on request"), Icon: Utensils },
    { label: "Room Types", value: resort.roomTypes.length ? `${resort.roomTypes.length}` : "To be confirmed", Icon: BedDouble }
  ];
  const experienceCards = (signatureExperiences.length ? signatureExperiences : resort.highlights.filter(Boolean)).slice(0, 4);
  const experienceIcons = [Palette, Waves, Sparkles, Utensils];
  const wellnessCards = wellnessHighlights.length
    ? wellnessHighlights.slice(0, 3)
    : [
        "Spa rituals and holistic treatments",
        "Calm island spaces for slow mornings",
        "Ocean-facing wellness and restoration"
      ];
  const discoveryCopy = aboutParagraphs[1] ?? aboutParagraphs[0];
  const heroBackground = resort.heroImageUrl
    ? `linear-gradient(115deg, rgba(250, 247, 238, 0.74) 0%, rgba(244, 240, 226, 0.34) 46%, rgba(210, 226, 202, 0.16) 100%), url(${optimizedImageUrl(resort.heroImageUrl, { width: 1800, height: 1100, quality: 78 })})`
    : "linear-gradient(135deg, #163f35 0%, #f3edaa 52%, #f4f2ec 100%)";
  const topSectionLinks = [
    { href: "#overview", label: "Overview" },
    ...(experienceCards.length ? [{ href: "#experiences", label: "Experiences" }] : []),
    { href: "#wellness", label: "Wellness" },
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
            <p className="section-kicker">{resort.category || "Island Retreat"} in {resort.location || "the Maldives"}</p>
            <h1>{resort.name}</h1>
            <p className="resort-story-hero__lede">
              {resort.summary || "An immersive Maldives resort stay shaped by privacy, ocean calm, and thoughtful island living."}
            </p>
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
              <h2>A modern island stay designed around comfort and place</h2>
            </article>

            <article className="resort-story-editorial__aside">
              {aboutParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p>{discoveryCopy}</p>
              <a href="#rooms" className="resort-story-text-link">Discover the stay</a>
            </article>
          </div>
        </div>
      </section>

      {experienceCards.length ? (
        <section className="resort-story-moments" id="experiences">
          <div className="site-container">
            <div className="resort-story-section-heading">
              <p className="eyebrow">Curated Moments</p>
              <h2>Signature Experiences</h2>
            </div>
            <div className="resort-story-experience-grid">
              {experienceCards.map((item, index) => {
                const Icon = experienceIcons[index] ?? Sparkles;
                return (
                  <article className={index === 0 ? "resort-story-experience-card is-large" : "resort-story-experience-card"} key={item}>
                    <Icon size={18} aria-hidden="true" />
                    <div>
                      <h3>{item}</h3>
                      <p>{index === 0 ? "Engage with the island through immersive, place-led moments." : "A crafted resort experience for unhurried island days."}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="resort-story-wellness" id="wellness">
        <div className="site-container">
          <article className="resort-story-wellness-card">
            <p className="eyebrow">Sanctuary</p>
            <h2>Wellness at {resort.name}</h2>
            <p>A haven of wellbeing shaped by tropical surroundings, quiet rituals, and restorative island spaces.</p>
            <ul>
              {wellnessCards.map((item) => (
                <li key={item}>
                  <Sparkles size={15} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="site-section site-section--white" id="rooms">
        <div className="site-container">
          <div className="section-heading resort-story-section-heading">
            <div>
              <p className="eyebrow">Rooms & Villas</p>
              <h2>Explore the accommodation collection</h2>
              <p className="muted">Large room cards highlight the stay experience without any booking clutter.</p>
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
        <section className="site-section site-section--paper" id="similar-resorts">
          <div className="site-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Similar Resorts</p>
                <h2>Continue exploring the collection</h2>
              </div>
            </div>
            <div className="resort-collection-grid resort-collection-grid--luxury">
              {similarResorts.map((item) => (
                <article key={item.slug} className="resort-collection-card resort-collection-card--luxury">
                  <div
                    className="resort-collection-card__media"
                    style={
                      item.heroImageUrl
                        ? {
                            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.72)), url(${optimizedImageUrl(item.heroImageUrl, { width: 680, height: 480, quality: 74 })})`
                          }
                        : undefined
                    }
                  />
                  <div className="resort-collection-card__content">
                    <div className="featured-card__meta">
                      <span>{item.location || "Maldives"}</span>
                      <span>{item.category || "Luxury Resort"}</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.summary}</p>
                    <div className="card-actions">
                      <Link href={`/resorts/${item.slug}`} className="site-button site-button--teal">
                        View Resort
                      </Link>
                    </div>
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
