import { ImportDriveForm } from "@/app/admin/imports/import-form";

export default async function AdminImportsPage() {
  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">AI Import Center</p>
          <h1 className="section-title">Import new resorts from Google Drive PDFs.</h1>
          <p className="admin-page-lede">
            Paste a Google Drive file or folder URL. Each PDF is treated as one resort fact sheet, and existing
            resorts are skipped automatically.
          </p>
        </div>
      </div>

      <article className="panel admin-form-card">
        <div className="admin-form-section__header">
          <h3 className="admin-form-section__title">Enter Google Drive URL</h3>
          <p className="admin-form-section__help">
            Import new resorts directly into the live resort inventory. Existing resorts will not be duplicated.
          </p>
        </div>
        <ImportDriveForm />
      </article>
    </section>
  );
}
