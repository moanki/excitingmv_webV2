import Link from "next/link";

import { ResortManagerListView, SeedResortsButton } from "@/app/admin/resorts/forms";
import { getResortCounts, listAdminResorts } from "@/lib/services/resort-service";

export default async function AdminResortsPage() {
  const [resorts, counts] = await Promise.all([listAdminResorts(), getResortCounts()]);

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">Resort Manager</p>
          <h1 className="section-title">Manage resort content, rooms, media, and publishing.</h1>
          <p className="admin-page-lede">
            This workspace is for browsing and managing resorts only. Open a focused add or edit workspace when you
            need to change resort details.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <SeedResortsButton />
          <Link href="/admin/resorts/new" className="admin-btn admin-btn--primary">
            + Add New Resort
          </Link>
        </div>
      </div>

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

      <ResortManagerListView resorts={resorts} />
    </section>
  );
}
