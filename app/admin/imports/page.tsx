import { ImportDriveForm } from "@/app/admin/imports/import-form";
import { listImportBatches } from "@/lib/services/import-service";

export default async function AdminImportsPage() {
  const batches = await listImportBatches();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">AI Import Center</p>
          <h1 className="section-title">Queue Google Drive brochure batches for review and AI extraction.</h1>
          <p className="admin-page-lede">
            Keep import creation and history in one operations view with clearer status visibility.
          </p>
        </div>
      </div>

      <article className="panel admin-form-card">
        <div className="admin-form-section__header">
          <h3 className="admin-form-section__title">Enter Google Drive URL</h3>
          <p className="admin-form-section__help">
            Paste a Google Drive fact sheet URL and import resorts directly into the live resort inventory.
          </p>
        </div>
        <ImportDriveForm />
      </article>

      <div className="admin-table-shell">
        <table className="table">
          <thead>
            <tr>
              <th>Import</th>
              <th>Source Type</th>
              <th>Google Drive Source</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td>{batch.batchName}</td>
                <td>{batch.sourceType}</td>
                <td>{batch.sourcePath ? <a href={batch.sourcePath}>{batch.sourcePath}</a> : "-"}</td>
                <td>
                  <span className="badge">{batch.status}</span>
                </td>
                <td>{new Date(batch.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {!batches.length ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <strong>No imports yet</strong>
                    <p>Imported Google Drive sources will appear here after the first successful run.</p>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
