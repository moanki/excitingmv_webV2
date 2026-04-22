import { createImportBatchAction } from "@/app/admin/imports/actions";
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
          <h3 className="admin-form-section__title">Create Import Batch</h3>
          <p className="admin-form-section__help">
            Queue a source for brochure parsing and downstream extraction review.
          </p>
        </div>
        <form action={createImportBatchAction} className="stack">
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Batch Name</span>
              <input className="admin-input" name="batchName" placeholder="April partner brochure sync" />
            </label>
            <label className="field">
              <span className="field__label">Source Type</span>
              <select className="admin-select" name="sourceType" defaultValue="folder">
                <option value="folder">Google Drive Folder</option>
                <option value="pdf">PDF File</option>
                <option value="zip">ZIP Upload</option>
                <option value="manual">Manual Entry</option>
              </select>
            </label>
            <label className="field field--full">
              <span className="field__label">Google Drive URL</span>
              <input className="admin-input" name="googleDriveUrl" placeholder="https://drive.google.com/..." />
            </label>
            <label className="field field--full">
              <span className="field__label">Notes</span>
              <textarea className="admin-textarea" name="notes" placeholder="Add context for the import review team." />
            </label>
          </div>
          <div className="admin-form-actions">
            <button className="admin-btn admin-btn--primary" type="submit">
              Create Import Batch
            </button>
          </div>
        </form>
      </article>

      <div className="admin-table-shell">
        <table className="table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Source Type</th>
              <th>Source</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td>{batch.batchName}</td>
                <td>{batch.sourceType}</td>
                <td>{batch.sourcePath || "-"}</td>
                <td>
                  <span className="badge">{batch.status}</span>
                </td>
                <td>{new Date(batch.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
