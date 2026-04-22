"use client";

import { useActionState } from "react";

import { createImportBatchAction } from "@/app/admin/imports/actions";

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
            Use a shareable Google Drive file or folder URL. Publicly accessible PDFs and Google Docs work best.
          </p>
        </label>
      </div>

      <div className="admin-form-actions">
        <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
          {pending ? "Importing..." : "Import Resort Fact Sheet"}
        </button>
      </div>

      {state?.message ? <p className="admin-alert admin-alert--success">{state.message}</p> : null}
      {state?.error ? <p className="admin-alert admin-alert--error">{state.error}</p> : null}
    </form>
  );
}
