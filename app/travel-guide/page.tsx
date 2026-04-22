import { getHomepageGuide } from "@/lib/site-content";

export default async function TravelGuidePage() {
  const { content: guide } = await getHomepageGuide("published");

  return (
    <main className="shell section">
      <section className="panel stack">
        <div className="stack">
          <p className="eyebrow">Travel Guide</p>
          <h1 className="section-title">Destination planning guidance for premium Maldives itineraries.</h1>
          <p className="muted">
            This keeps the public navigation and footer links valid while surfacing the same destination
            insights managed from the admin homepage settings.
          </p>
        </div>

        <div className="grid">
          {guide.map((item) => (
            <article key={item.title} className="card">
              <p className="eyebrow">{item.category}</p>
              <h2>{item.title}</h2>
              <p className="muted">{item.description}</p>
              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} style={{ borderRadius: "16px" }} /> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
