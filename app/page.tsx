import Link from "next/link";

import { homepageHighlights, sampleResorts } from "@/lib/sample-data";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">Partner Sales Platform</div>
          <h1 className="headline">Luxury Maldives inventory, partner-ready.</h1>
          <p className="lede">
            Exciting Maldives is being rebuilt as a production B2B platform for approved travel
            partners, protected resort assets, live support, and admin-controlled AI-assisted import
            workflows.
          </p>
          <div className="hero-actions">
            <Link href="/partner/register" className="button">
              Apply As Partner
            </Link>
            <Link href="/resorts" className="button-muted">
              Explore Resorts
            </Link>
          </div>
        </div>
        <div className="stack">
          {homepageHighlights.map((highlight) => (
            <article className="panel" key={highlight.title}>
              <p className="eyebrow">{highlight.eyebrow}</p>
              <h2>{highlight.title}</h2>
              <p className="muted">{highlight.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Curated Portfolio</p>
            <h2 className="section-title">Resorts prepared for partner sales.</h2>
          </div>
          <Link href="/partner/login" className="button-muted">
            Protected Partner Access
          </Link>
        </div>
        <div className="grid">
          {sampleResorts.map((resort) => (
            <article key={resort.slug} className="card">
              <p className="eyebrow">{resort.location}</p>
              <h3>{resort.name}</h3>
              <p className="muted">{resort.summary}</p>
              <div className="card-actions">
                <Link href={`/resorts/${resort.slug}`} className="button-muted">
                  View Resort
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section split">
        <article className="panel">
          <p className="eyebrow">Protected Materials</p>
          <h2>Trade rates, offers, kits, and sales resources.</h2>
          <p className="muted">
            Approved partners will access protected brochures, rate sheets, presentations, and
            offers from one secure portal.
          </p>
        </article>
        <article className="panel">
          <p className="eyebrow">Admin Operations</p>
          <h2>AI-assisted imports, approvals, and live support.</h2>
          <p className="muted">
            The admin center is structured for resort management, partner approvals, chat inbox
            handling, newsletter export, and OpenAI-assisted content extraction.
          </p>
        </article>
      </section>
    </main>
  );
}
