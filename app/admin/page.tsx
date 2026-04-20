import { getResortCounts } from "@/lib/services/resort-service";

export default async function AdminDashboardPage() {
  const counts = await getResortCounts();
  const stats = [
    { label: "Total Properties", value: String(counts.total) },
    { label: "Published Resorts", value: String(counts.published) },
    { label: "Draft Resorts", value: String(counts.draft) }
  ];

  return (
    <section>
      <p className="eyebrow">Operations Dashboard</p>
      <h1 className="section-title">One place for approvals, content, and trade support.</h1>
      <div className="dashboard-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <p className="eyebrow">{stat.label}</p>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
