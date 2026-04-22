import {
  CreateResortForm,
  ExistingResortForms,
  ResortInventoryTable,
  SeedResortsButton
} from "@/app/admin/resorts/forms";
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
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">Resort Manager</p>
          <h1 className="section-title">Manage your resort inventory and homepage featured collection.</h1>
          <p className="admin-page-lede">
            Total resorts added: {counts.total}. Mark a resort as <strong>Published Featured</strong> to surface it
            in the homepage featured resorts area, up to 5 properties.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <SeedResortsButton />
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

      <article className="panel admin-form-card">
        <div className="admin-form-section__header">
          <h3 className="admin-form-section__title">All Resorts</h3>
          <p className="admin-form-section__help">
            Review every resort in one table, update the publishing state, and jump straight into editing.
          </p>
        </div>
        <ResortInventoryTable resorts={resorts} />
      </article>

      <CreateResortForm mediaLibrary={mediaLibrary} />
      <ExistingResortForms resorts={resorts} mediaLibrary={mediaLibrary} />
    </section>
  );
}
