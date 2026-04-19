import Link from "next/link";

import { homepageHighlights, sampleResorts } from "@/lib/sample-data";

export default function HomePage() {
  return (
    <main>
      <section className="hero-band">
        <div className="shell hero">
          <div className="hero-copy">
            <div className="eyebrow">Corporate B2B Maldives Platform</div>
            <h1 className="headline">The luxury-facing partner portal for curated Maldives sales.</h1>
            <p className="lede">
              Built for destination partners, contracting teams, and internal operators who need
              premium resort presentation, protected trade resources, live support, and clean admin
              workflows from one polished platform.
            </p>
            <div className="hero-actions">
              <Link href="/partner/register" className="button">
                Partner With Us
              </Link>
              <Link href="/admin/login" className="button-muted">
                Admin Center
              </Link>
            </div>
            <div className="hero-metrics">
              <div className="metric">
                <strong>42+</strong>
                <span>Resort dossiers</span>
              </div>
              <div className="metric">
                <strong>24/7</strong>
                <span>Trade support</span>
              </div>
              <div className="metric">
                <strong>One</strong>
                <span>Unified portal</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-glow" />
            <div className="hero-stack">
              <article className="hero-preview-card primary">
                <p className="eyebrow">Protected Partner Access</p>
                <h2>Rates, offers, sales kits, and resort intelligence in one place.</h2>
                <p className="muted">
                  Approved partners get structured resort content, downloadable collateral, and
                  live support without leaving the platform.
                </p>
              </article>
              <article className="hero-preview-card">
                <p className="eyebrow">Admin Operations</p>
                <h3>Imports, approvals, live chat, and controlled publishing.</h3>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="shell section section-tight">
        <div className="section-heading">
          <div>
            <p className="eyebrow">What The Platform Handles</p>
            <h2 className="section-title">Designed for premium travel sales, not generic CMS admin.</h2>
          </div>
        </div>
        <div className="grid">
          {homepageHighlights.map((highlight) => (
            <article className="card feature-card" key={highlight.title}>
              <p className="eyebrow">{highlight.eyebrow}</p>
              <h2>{highlight.title}</h2>
              <p className="muted">{highlight.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Curated Portfolio</p>
            <h2 className="section-title">Resorts prepared for partner-facing storytelling.</h2>
          </div>
          <Link href="/partner/login" className="button-muted">
            Protected Partner Access
          </Link>
        </div>
        <div className="grid">
          {sampleResorts.map((resort) => (
            <article key={resort.slug} className="card resort-card">
              <div className="card-image" />
              <p className="eyebrow">{resort.location}</p>
              <h3>{resort.name}</h3>
              <p className="muted">{resort.summary}</p>
              <p className="card-meta">{resort.category} - {resort.transferType}</p>
              <div className="card-actions">
                <Link href={`/resorts/${resort.slug}`} className="button-muted">
                  View Resort
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section split callout-split">
        <article className="panel panel-dark">
          <p className="eyebrow">Protected Materials</p>
          <h2>Trade rates, offers, sales kits, and structured collateral.</h2>
          <p className="muted muted-on-dark">
            Approved partners access protected brochures, presentations, and current trade material
            from a single polished portal.
          </p>
          <div className="card-actions">
            <Link href="/partner/login" className="button light">
              Open Partner Portal
            </Link>
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">Admin Operations</p>
          <h2>Import, review, publish, and respond without clutter.</h2>
          <p className="muted">
            The admin center supports partner approvals, newsletter capture, chat inbox workflows,
            and AI-assisted content processing.
          </p>
          <div className="card-actions">
            <Link href="/admin/login" className="button-muted">
              Login To Admin
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
