"use client";

import { useActionState } from "react";

import { createImportBatchAction, type ImportActionState } from "@/app/admin/imports/actions";
import type { ImportLogEntry } from "@/lib/services/import-service";

function ImportProgress({ pending, state }: { pending: boolean; state: ImportActionState }) {
  const progressValue = pending ? 68 : state?.ok ? 100 : 0;
  const progressLabel = pending
    ? "Import in progress"
    : state?.ok
      ? `Completed ${state.result.processedSources} of ${state.result.totalSources} files`
      : "Waiting to start";

  return (
    <div className="admin-import-progress">
      <div className="admin-import-progress__header">
        <strong>{progressLabel}</strong>
        <span>{progressValue}%</span>
      </div>
      <div className="admin-import-progress__track" aria-hidden="true">
        <div
          className={pending ? "admin-import-progress__bar is-pending" : "admin-import-progress__bar"}
          style={{ width: `${progressValue}%` }}
        />
      </div>
      <p className="admin-import-progress__meta">
        {pending
          ? "Reading the folder, downloading PDF fact sheets, and extracting resort content."
          : "The run summary below shows imported, skipped, warning, and error counts."}
      </p>
    </div>
  );
}

function ImportRunSummary({ state }: { state: ImportActionState }) {
  if (!state?.ok) {
    return null;
  }

  const { result } = state;

  return (
    <div className="admin-import-run stack">
      <div className="dashboard-grid dashboard-grid-quad">
        <article className="stat-card">
          <p className="eyebrow">Detected PDFs</p>
          <strong>{result.totalSources}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Imported</p>
          <strong>{result.importedResorts}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Skipped</p>
          <strong>{result.skippedSources}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Warnings / Errors</p>
          <strong>
            {result.warningCount} / {result.errorCount}
          </strong>
        </article>
      </div>

      <article className="panel admin-form-card">
        <div className="admin-form-section__header">
          <h3 className="admin-form-section__title">Run Details</h3>
          <p className="admin-form-section__help">
            Provider used: <strong>{result.providerUsed}</strong>. Review exactly what was imported, skipped, warned,
            or failed.
          </p>
        </div>

        <div className="admin-import-log-list">
          {result.logs.map((entry: ImportLogEntry, index: number) => (
            <article key={`${entry.sourceUrl}-${index}`} className={`admin-import-log admin-import-log--${entry.status}`}>
              <div className="admin-import-log__header">
                <strong>{entry.resortName || entry.filename}</strong>
                <span className="badge">{entry.status}</span>
              </div>
              <p>{entry.message}</p>
              <small>
                Provider: {entry.provider} | Source: {entry.sourceUrl}
              </small>
            </article>
          ))}
        </div>
      </article>
    </div>
  );
}

export function ImportDriveForm() {
  const [state, action, pending] = useActionState(createImportBatchAction, undefined);

  return (
    <form action={action} className="stack">
      <div className="form-grid">
        <label className="field field--full">
          <span className="field__label">Google Drive URL</span>
          <input
            className="admin-input"
            name="googleDriveUrl"
            placeholder="https://drive.google.com/file/d/... or https://drive.google.com/drive/folders/..."
            required
          />
          <p className="field__help">
            Use a shareable Google Drive file or folder URL. The importer reads PDF fact sheets, treats each PDF as
            one resort, and skips resorts that already exist.
          </p>
        </label>
      </div>

      <ImportProgress pending={pending} state={state} />

      <div className="admin-form-actions">
        <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
          {pending ? "Importing..." : "Import Resort Fact Sheet"}
        </button>
      </div>

      {state?.ok ? <p className="admin-alert admin-alert--success">{state.message}</p> : null}
      {state?.ok === false ? <p className="admin-alert admin-alert--error">{state.error}</p> : null}

      <ImportRunSummary state={state} />
    </form>
  );
}
