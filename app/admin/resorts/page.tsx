import { sampleResorts } from "@/lib/sample-data";

export default function AdminResortsPage() {
  return (
    <section>
      <p className="eyebrow">Resort Manager</p>
      <h1 className="section-title">Maintain published inventory and editorial readiness.</h1>
      <div className="grid">
        {sampleResorts.map((resort) => (
          <article className="card" key={resort.slug}>
            <span className="badge">{resort.status}</span>
            <h2>{resort.name}</h2>
            <p className="muted">{resort.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
