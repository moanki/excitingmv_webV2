import Link from "next/link";

import { ResortManagerListView } from "@/app/admin/resorts/forms";
import { getResortCounts, listAdminResorts } from "@/lib/services/resort-service";

const labels = {
  singular: "Liveaboard",
  plural: "Liveaboards",
  publicBasePath: "/liveaboards",
  adminBasePath: "/admin/liveaboards"
};

export default async function AdminLiveaboardsPage() {
  const [liveaboards, counts] = await Promise.all([
    listAdminResorts("liveaboards"),
    getResortCounts("liveaboards")
  ]);

  return (
    <section className="stack">
      <div className="admin-page-header admin-page-header--actions-only">
        <div className="admin-page-header__actions">
          <Link href="/admin/liveaboards/new" className="admin-btn admin-btn--primary">
            + Add New Liveaboard
          </Link>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="stat-card">
          <p className="eyebrow">Total Liveaboards</p>
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

      <ResortManagerListView resorts={liveaboards} propertyType="liveaboards" labels={labels} />
    </section>
  );
}
