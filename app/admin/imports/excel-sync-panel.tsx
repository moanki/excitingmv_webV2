"use client";

import { useState, type FormEvent } from "react";

import type {
  ExcelResortPreview,
  ExcelSyncApplyResult,
  ExcelSyncStatus
} from "@/lib/services/excel-resort-sync-service";

type ExcelSyncProgress = {
  totalSources: number;
  processedSources: number;
  readyToUpdate: number;
  readyToCreate: number;
  newCandidates: number;
  needsReview: number;
  parseErrors: number;
  previews: ExcelResortPreview[];
};

type ExcelStartPayload = {
  batchId: string;
  sourceFiles: string[];
  message: string;
};

const categoryOptions = [
  { value: "resort", label: "Resort" },
  { value: "liveaboards", label: "Liveaboard" },
  { value: "hotels", label: "Hotel" }
] as const;

function statusLabel(status: ExcelSyncStatus) {
  return status.replaceAll("_", " ");
}

function statusClass(status: ExcelSyncStatus) {
  if (status === "updated" || status === "created" || status === "ready_to_update" || status === "ready_to_create") return "approved";
  if (status === "needs_review" || status === "new_candidate") return "pending";
  if (status === "parse_error" || status === "failed") return "error";
  return "neutral";
}

async function readJson(response: Response) {
  return (await response.json().catch(() => null)) as { ok?: boolean; error?: string; message?: string; data?: unknown } | null;
}

function PreviewCard({
  preview,
  pendingKey,
  onApply,
  onCreate,
  onManualMatch
}: {
  preview: ExcelResortPreview;
  pendingKey: string;
  onApply: (preview: ExcelResortPreview) => void;
  onCreate: (preview: ExcelResortPreview) => void;
  onManualMatch: (preview: ExcelResortPreview, resortId: string) => void;
}) {
  const matchedName = preview.status === "parse_error"
      ? "Workbook unavailable"
      : preview.match?.status === "matched"
        ? preview.match.resortName
      : preview.match?.status === "new_candidate"
        ? preview.model?.resort.name || "Not in database"
        : "Ambiguous match";
  const canApply = preview.status === "ready_to_update" || preview.status === "ready_to_create";
  const canCreate = preview.status === "new_candidate";
  const isPending = pendingKey === preview.stagingId;
  const [showChanges, setShowChanges] = useState(false);

  return (
    <article className="admin-checkpoint-card">
      <div className="admin-checkpoint-card__header">
        <div>
          <strong>{preview.filename}</strong>
          <p>{matchedName} · {preview.action}</p>
        </div>
        <span className={`admin-status-badge is-${statusClass(preview.status)}`}>{statusLabel(preview.status)}</span>
      </div>

      <div className="admin-checkpoint-meta">
        <span>Sheets: {preview.model?.sourceFile.sheets.join(", ") || "Unreadable"}</span>
        <span>Existing photos: {preview.existingPhotosCount}</span>
        <span>Room photos preserved: {preview.matchingRoomPhotosPreserved}</span>
      </div>

      {preview.model ? (
        <div className="admin-checkpoint-notes">
          <p>
            <strong>Generic Information:</strong>{" "}
            {preview.model.sections.generic.actualRows > 0 ? "Actual data detected - ready to update" : "No update"}
          </p>
          <p>
            <strong>Villa Types:</strong>{" "}
            {preview.model.sections.rooms.actualRows > 0
              ? `${preview.model.sections.rooms.actualRows} actual record${preview.model.sections.rooms.actualRows === 1 ? "" : "s"} detected - ready to update`
              : "No update - existing villa data will remain unchanged"}
          </p>
        </div>
      ) : null}

      {preview.diff ? (
        <div className="dashboard-grid dashboard-grid-quad">
          <div className="stat-card"><p className="eyebrow">Root changes</p><strong>{preview.diff.rootFields.length}</strong></div>
          <div className="stat-card"><p className="eyebrow">Villas added</p><strong>{preview.diff.rooms.added}</strong></div>
          <div className="stat-card"><p className="eyebrow">Villas updated</p><strong>{preview.diff.rooms.updated}</strong></div>
          <div className="stat-card"><p className="eyebrow">Existing villas kept</p><strong>{preview.diff.rooms.untouched}</strong></div>
        </div>
      ) : null}

      {preview.diff ? (
        <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowChanges((current) => !current)}>
          {showChanges ? "Hide Changes" : "Review Changes"}
        </button>
      ) : null}

      {showChanges && preview.diff ? (
        <div className="admin-checkpoint-notes">
          {preview.diff.rootFields.length ? preview.diff.rootFields.map((field) => (
            <p key={field.field}><strong>{field.field}:</strong> {field.action}</p>
          )) : <p>No resort fields need updating.</p>}
          <p><strong>Villas:</strong> {preview.diff.rooms.updated} matched update(s), {preview.diff.rooms.added} new, {preview.diff.rooms.untouched} existing villa(s) kept.</p>
          <p><strong>Photos and media:</strong> protected; existing IDs and storage objects are not replaced.</p>
        </div>
      ) : null}

      {preview.error ? <p className="admin-alert admin-alert--error">{preview.error}</p> : null}
      {preview.warnings.length ? (
        <ul className="admin-checkpoint-notes">
          {preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      ) : null}

      {preview.model?.ignoredExampleRows.length ? (
        <details>
          <summary>Ignored template/example rows ({preview.model.ignoredExampleRows.length})</summary>
          <ul className="admin-checkpoint-notes">
            {preview.model.ignoredExampleRows.map((row) => (
              <li key={`${row.sheet}-${row.rowNumber}-${row.reason}`}>
                {row.sheet} row {row.rowNumber}: {row.reason} - {row.values.slice(0, 2).join(" | ").slice(0, 180)}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {preview.match?.status === "review_required" || preview.match?.status === "new_candidate" ? (
        <div className="admin-checkpoint-resorts">
          <p className="field__help">Check the workbook identity before choosing an existing resort. A new candidate is never created automatically.</p>
          {preview.match.candidates.map((candidate) => (
            <div key={candidate.resortId} className="admin-checkpoint-resort">
              <div>
                <strong>{candidate.resortName}</strong>
                <p>{candidate.reason}</p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                disabled={Boolean(pendingKey)}
                onClick={() => onManualMatch(preview, candidate.resortId)}
              >
                Use This Match
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {canApply ? (
        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={Boolean(pendingKey)}
            onClick={() => onApply(preview)}
          >
            {isPending ? "Applying..." : "Apply Update"}
          </button>
        </div>
      ) : null}
      {canCreate ? (
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn--primary" disabled={Boolean(pendingKey)} onClick={() => onCreate(preview)}>
            {isPending ? "Creating draft..." : "Add as Draft Resort"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function ExcelSyncPanel() {
  const [propertyType, setPropertyType] = useState("resort");
  const [pending, setPending] = useState(false);
  const [pendingKey, setPendingKey] = useState("");
  const [batchId, setBatchId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ExcelSyncProgress | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setPendingKey("");
    setMessage("");
    setError("");
    setProgress(null);

    try {
      const formData = new FormData(event.currentTarget);
      const selectedPropertyType = String(formData.get("propertyType") ?? "resort");
      const sourceUrl = String(formData.get("googleDriveUrl") ?? "");
      const selectedFile = formData.get("excelFile");
      const excelFile = selectedFile instanceof File && selectedFile.size > 0 ? selectedFile : null;
      setUploadedFile(excelFile);

      if (excelFile) {
        const uploadForm = new FormData();
        uploadForm.append("excelFile", excelFile);
        uploadForm.append("propertyType", selectedPropertyType);
        const uploadResponse = await fetch("/api/admin/imports", { method: "POST", body: uploadForm });
        const uploadPayload = await readJson(uploadResponse);
        if (!uploadResponse.ok || !uploadPayload?.ok || !uploadPayload.data) throw new Error(uploadPayload?.error || "Excel workbook upload failed.");

        const delta = uploadPayload.data as Omit<ExcelSyncProgress, "totalSources" | "previews"> & { previews: ExcelResortPreview[]; batchId: string };
        setBatchId(delta.batchId);
        setProgress({
          totalSources: 1,
          processedSources: delta.processedSources,
          readyToUpdate: delta.readyToUpdate,
          readyToCreate: delta.readyToCreate,
          newCandidates: delta.newCandidates,
          needsReview: delta.needsReview,
          parseErrors: delta.parseErrors,
          previews: delta.previews
        });
        setMessage("Downloaded workbook analyzed and staged. Review the preview before applying any update.");
        return;
      }

      if (!sourceUrl.trim()) throw new Error("Provide a Google Drive URL or choose a downloaded Excel workbook.");
      const startResponse = await fetch("/api/admin/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "excel-start", googleDriveUrl: sourceUrl, propertyType: selectedPropertyType })
      });
      const startPayload = await readJson(startResponse);
      if (!startResponse.ok || !startPayload?.ok || !startPayload.data) throw new Error(startPayload?.error || "Excel sync could not start.");

      const start = startPayload.data as ExcelStartPayload;
      setBatchId(start.batchId);
      const nextProgress: ExcelSyncProgress = {
        totalSources: start.sourceFiles.length,
        processedSources: 0,
        readyToUpdate: 0,
        readyToCreate: 0,
        newCandidates: 0,
        needsReview: 0,
        parseErrors: 0,
        previews: []
      };
      setProgress(nextProgress);

      for (let index = 0; index < start.sourceFiles.length; index += 1) {
        const processResponse = await fetch("/api/admin/imports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "excel-process",
            batchId: start.batchId,
            sourceUrl: start.sourceFiles[index],
            sourceIndex: index,
            propertyType: selectedPropertyType
          })
        });
        const processPayload = await readJson(processResponse);
        if (!processResponse.ok || !processPayload?.ok || !processPayload.data) throw new Error(processPayload?.error || "Excel workbook analysis failed.");
        const delta = processPayload.data as Omit<ExcelSyncProgress, "totalSources" | "previews"> & { previews: ExcelResortPreview[] };
        nextProgress.processedSources += delta.processedSources;
        nextProgress.readyToUpdate += delta.readyToUpdate;
        nextProgress.readyToCreate += delta.readyToCreate;
        nextProgress.newCandidates += delta.newCandidates;
        nextProgress.needsReview += delta.needsReview;
        nextProgress.parseErrors += delta.parseErrors;
        nextProgress.previews = [...nextProgress.previews, ...delta.previews];
        setProgress({ ...nextProgress, previews: [...nextProgress.previews] });
      }

      setMessage("Excel workbooks analyzed and staged. Review each preview before applying any update.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Excel sync failed.");
    } finally {
      setPending(false);
    }
  }

  async function applyPreview(preview: ExcelResortPreview, decision: "update" | "create_draft" = "update") {
    setPendingKey(preview.stagingId);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "excel-apply", stagingId: preview.stagingId, propertyType, decision })
      });
      const payload = await readJson(response);
      if (!response.ok || !payload?.ok || !payload.data) throw new Error(payload?.error || "Excel preview could not be applied.");
      const result = payload.data as ExcelSyncApplyResult;
      setProgress((current) => current ? {
        ...current,
        previews: current.previews.map((item) => item.stagingId === preview.stagingId ? { ...item, status: result.status, action: result.status === "created" ? "create" : "update" } : item)
      } : current);
      setMessage(result.message);
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Excel preview could not be applied.");
    } finally {
      setPendingKey("");
    }
  }

  async function createDraft(preview: ExcelResortPreview) {
    await applyPreview(preview, "create_draft");
  }

  async function manualMatch(preview: ExcelResortPreview, resortId: string) {
    if (!batchId) return;
    setPendingKey(preview.stagingId);
    setMessage("");
    setError("");
    try {
      let response: Response;
      if (preview.sourceUrl.startsWith("upload:")) {
        if (!uploadedFile) throw new Error("The downloaded workbook is no longer available in this browser. Upload it again to rematch.");
        const uploadForm = new FormData();
        uploadForm.append("excelFile", uploadedFile);
        uploadForm.append("propertyType", propertyType);
        uploadForm.append("manualMatchResortId", resortId);
        uploadForm.append("modelIndex", String(preview.modelIndex ?? 0));
        response = await fetch("/api/admin/imports", { method: "POST", body: uploadForm });
      } else {
        response = await fetch("/api/admin/imports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "excel-process",
            batchId,
            sourceUrl: preview.sourceUrl,
            sourceIndex: preview.sourceIndex,
            modelIndex: preview.modelIndex,
            propertyType,
            manualMatchResortId: resortId
          })
        });
      }
      const payload = await readJson(response);
      if (!response.ok || !payload?.ok || !payload.data) throw new Error(payload?.error || "Manual resort match failed.");
      const delta = payload.data as { previews: ExcelResortPreview[] };
      const replacement = delta.previews[0];
      setProgress((current) => current ? { ...current, previews: current.previews.map((item) => item.stagingId === preview.stagingId ? replacement : item) } : current);
      setMessage("Manual resort match saved as a new reviewed preview. Apply it only after checking the diff.");
    } catch (matchError) {
      setError(matchError instanceof Error ? matchError.message : "Manual resort match failed.");
    } finally {
      setPendingKey("");
    }
  }

  const processed = progress?.processedSources ?? 0;
  const total = progress?.totalSources ?? 0;
  const progressValue = pending && total ? Math.max(8, Math.round((processed / total) * 100)) : progress && total ? Math.round((processed / total) * 100) : 0;

  return (
    <article className="panel admin-form-card">
      <div className="admin-form-section__header">
        <h3 className="admin-form-section__title">Update Resorts from Documents</h3>
        <p className="admin-form-section__help">Review workbook-derived resort changes before applying them. Existing resort IDs, villa photos, media, slugs, publish status, and homepage settings are protected.</p>
      </div>

      <form onSubmit={handleSubmit} className="stack">
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Property Type</span>
            <select className="admin-select" name="propertyType" value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>
              {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="field field--full">
            <span className="field__label">Google Drive Folder or Workbook URL</span>
            <input className="admin-input" name="googleDriveUrl" placeholder="https://drive.google.com/drive/folders/..." />
            <p className="field__help">Use a shareable link. If Drive preview is unavailable, download the workbook and use the upload field below.</p>
          </label>
          <label className="field field--full">
            <span className="field__label">Downloaded Excel Workbook</span>
            <input className="admin-file-input" name="excelFile" type="file" accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12" />
            <p className="field__help">Use either a Google Drive URL or a downloaded `.xlsx` / `.xlsm` file. Analysis creates staged previews only.</p>
          </label>
        </div>

        {progress ? (
          <div className="admin-import-progress" role="status" aria-live="polite">
            <div className="admin-import-progress__header"><strong>{pending ? `Analyzing Excel workbooks (${processed}/${total})` : `Analyzed ${processed} of ${total} workbooks`}</strong><span>{progressValue}%</span></div>
            <div className="admin-import-progress__track" aria-hidden="true"><div className={pending ? "admin-import-progress__bar is-pending" : "admin-import-progress__bar"} style={{ width: `${progressValue}%` }} /></div>
            <div className="dashboard-grid dashboard-grid-quad">
              <div className="stat-card"><p className="eyebrow">Ready to update</p><strong>{progress.readyToUpdate}</strong></div>
              <div className="stat-card"><p className="eyebrow">New candidates</p><strong>{progress.newCandidates}</strong></div>
              <div className="stat-card"><p className="eyebrow">Needs review</p><strong>{progress.needsReview}</strong></div>
              <div className="stat-card"><p className="eyebrow">Parse errors</p><strong>{progress.parseErrors}</strong></div>
            </div>
          </div>
        ) : null}

        <div className="admin-form-actions">
          <button className="admin-btn admin-btn--primary" type="submit" disabled={pending} data-admin-feedback-managed="true">{pending ? "Analyzing..." : "Analyze Excel Workbooks"}</button>
        </div>

        {message ? <p className="admin-alert admin-alert--success">{message}</p> : null}
        {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}
      </form>

      {progress?.previews.length ? (
        <div className="stack">
          <h4>Workbook Previews</h4>
          {progress.previews.map((preview) => <PreviewCard key={preview.stagingId} preview={preview} pendingKey={pendingKey} onApply={applyPreview} onCreate={createDraft} onManualMatch={manualMatch} />)}
        </div>
      ) : null}
    </article>
  );
}
