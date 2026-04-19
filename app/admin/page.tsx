const stats = [
  { label: "Pending Partner Approvals", value: "12" },
  { label: "Published Resorts", value: "42" },
  { label: "Unread Chat Threads", value: "6" }
];

export default function AdminDashboardPage() {
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
