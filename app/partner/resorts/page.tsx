import Link from "next/link";

import { sampleResorts } from "@/lib/sample-data";

export default function PartnerResortsPage() {
  return (
    <section>
      <p className="eyebrow">Protected Resort Library</p>
      <h1 className="section-title">Resort material prepared for partner conversion.</h1>
      <div className="grid">
        {sampleResorts.map((resort) => (
          <article className="card" key={resort.slug}>
            <h2>{resort.name}</h2>
            <p className="muted">{resort.summary}</p>
            <Link href={`/resorts/${resort.slug}`} className="button-muted">
              Open Resort File
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
