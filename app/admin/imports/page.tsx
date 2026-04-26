import { listImportCheckpoints } from "@/lib/services/import-service";
import { ImportCenterForms } from "@/app/admin/imports/import-form";

export default async function AdminImportsPage() {
  const checkpoints = await listImportCheckpoints();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">AI Import Center</p>
          <h1 className="section-title">Import new resorts from Google Drive or a single PDF upload.</h1>
          <p className="admin-page-lede">
            Use Google Drive for folder imports or Smart Upload for a single fact sheet. Each PDF is treated as one
            resort fact sheet, and existing resorts are skipped automatically.
          </p>
        </div>
      </div>

      <ImportCenterForms checkpoints={checkpoints} />
    </section>
  );
}
