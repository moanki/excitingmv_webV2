import Link from "next/link";

import { sampleResorts } from "@/lib/sample-data";

export default function ResortsPage() {
  return (
    <main className="shell section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Resort Collection</p>
          <h1 className="section-title">Partner-curated resorts across the Maldives.</h1>
        </div>
      </div>
      <div className="grid">
        {sampleResorts.map((resort) => (
          <article key={resort.slug} className="card">
            <span className="badge">{resort.category}</span>
            <h2>{resort.name}</h2>
            <p className="muted">{resort.summary}</p>
            <p className="muted">
              {resort.location} • {resort.transferType}
            </p>
            <div className="card-actions">
              <Link href={`/resorts/${resort.slug}`} className="button">
                View Details
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
