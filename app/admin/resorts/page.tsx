import { CreateResortForm, ExistingResortForms, SeedResortsButton } from "@/app/admin/resorts/forms";
import { getResortCounts, listAdminResorts } from "@/lib/services/resort-service";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminResortsPage() {
  const [resorts, counts, mediaLibrary] = await Promise.all([
    listAdminResorts(),
    getResortCounts(),
    listSiteAssets()
  ]);

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Resort Manager</p>
          <h1 className="section-title">Maintain published inventory and editorial readiness.</h1>
          <p className="muted">
            This module now writes directly to the resort database records that power the public
            site and the protected partner area.
          </p>
        </div>
        <SeedResortsButton />
      </div>

      <div className="dashboard-grid">
        <article className="stat-card">
          <p className="eyebrow">Total Properties</p>
          <strong>{counts.total}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Published</p>
          <strong>{counts.published}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Draft</p>
          <strong>{counts.draft}</strong>
        </article>
      </div>

      <CreateResortForm mediaLibrary={mediaLibrary} />
      <ExistingResortForms resorts={resorts} mediaLibrary={mediaLibrary} />
    </section>
  );
}
