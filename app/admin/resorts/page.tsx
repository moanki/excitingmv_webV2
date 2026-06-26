import { ResortManagerListView } from "@/app/admin/resorts/forms";
import { getResortCounts, listAdminResortCards } from "@/lib/services/resort-service";

export default async function AdminResortsPage() {
  const [resortsResult, counts] = await Promise.all([
    listAdminResortCards().then(
      (resorts) => ({ resorts, error: "" }),
      (error) => ({ resorts: [], error: error instanceof Error ? error.message : "Failed to load resorts." })
    ),
    getResortCounts()
  ]);
  const { resorts, error } = resortsResult;

  return (
    <section className="stack">
      <div className="dashboard-grid">
        <article className="stat-card">
          <p className="eyebrow">Total Resorts</p>
          <strong>{counts.total}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Published</p>
          <strong>{counts.published}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Featured On Homepage</p>
          <strong>{counts.featured}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Draft</p>
          <strong>{counts.draft}</strong>
        </article>
      </div>

      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}

      <ResortManagerListView resorts={resorts} />
    </section>
  );
}
