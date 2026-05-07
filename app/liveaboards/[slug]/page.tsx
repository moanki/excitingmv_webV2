import { notFound } from "next/navigation";

import { getResortBySlug, listPublishedProperties } from "@/lib/services/resort-service";

export async function generateStaticParams() {
  const liveaboards = await listPublishedProperties("liveaboard");
  return liveaboards.map((item) => ({ slug: item.slug }));
}

export default async function LiveaboardDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const liveaboard = await getResortBySlug(slug, "liveaboard");

  if (!liveaboard) {
    notFound();
  }

  const facts = [
    { label: "Route / Atoll", value: liveaboard.location || "Maldives" },
    { label: "Category", value: liveaboard.category || "Liveaboard" },
    { label: "Transfer", value: liveaboard.transferType || "Available on request" },
    { label: "Cabins", value: liveaboard.roomTypes.length ? `${liveaboard.roomTypes.length}` : "To be confirmed" }
  ];

  return (
    <main className="resort-detail-page resort-story-page">
      <section className="resort-story-hero">
        <div
          className="resort-story-hero__media"
          style={liveaboard.heroImageUrl ? { backgroundImage: `url(${liveaboard.heroImageUrl})` } : undefined}
        />
        <div className="resort-story-hero__overlay" />
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
    </main>
  );
}
