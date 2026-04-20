import { createImportBatchAction } from "@/app/admin/imports/actions";
import { listImportBatches } from "@/lib/services/import-service";

export default async function AdminImportsPage() {
  const batches = await listImportBatches();

  return (
    <section className="stack">
      <div>
        <p className="eyebrow">AI Import Center</p>
        <h1 className="section-title">Queue Google Drive brochure batches for review and AI extraction.</h1>
      </div>
      <article className="panel">
        <p className="eyebrow">New Import Batch</p>
        <form action={createImportBatchAction} className="stack">
          <div className="form-grid">
            <label className="field">
              Batch Name
              <input name="batchName" placeholder="April partner brochure sync" />
            </label>
            <label className="field">
              Source Type
              <select name="sourceType" defaultValue="folder">
                <option value="folder">Google Drive Folder</option>
                <option value="pdf">PDF File</option>
                <option value="zip">ZIP Upload</option>
                <option value="manual">Manual Entry</option>
              </select>
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Google Drive URL
              <input name="googleDriveUrl" placeholder="https://drive.google.com/..." />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Notes
              <textarea name="notes" placeholder="Add context for the import review team." />
            </label>
          </div>
          <button className="button" type="submit">
            Create Import Batch
          </button>
        </form>
      </article>
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
              <td>{batch.status}</td>
              <td>{new Date(batch.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
