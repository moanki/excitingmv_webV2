import Link from "next/link";

import { listPublishedResorts } from "@/lib/services/resort-service";

export default async function PartnerResortsPage() {
  const resorts = await listPublishedResorts();

  return (
    <section>
      <p className="eyebrow">Protected Resort Library</p>
      <h1 className="section-title">Resort material prepared for partner conversion.</h1>
      <div className="grid">
        {resorts.map((resort) => (
          <article className="card" key={resort.slug}>
            <span className="badge">{resort.status}</span>
            <h2>{resort.name}</h2>
            <p className="muted">{resort.summary}</p>
            <p className="muted">
              {resort.location} • {resort.transferType}
            </p>
            <Link href={`/resorts/${resort.slug}`} className="button-muted">
              Open Resort File
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
