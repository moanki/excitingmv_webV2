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

type BulkMode = "update" | "create" | "mixed";

function previewResortName(preview: ExcelResortPreview) {
  if (preview.status === "parse_error") return "Workbook unavailable";
  if (preview.match?.status === "matched") return preview.match.resortName;
  if (preview.match?.status === "new_candidate") return preview.model?.resort.name || "Not in database";
  return "Ambiguous match";
}

function canApplyPreview(preview: ExcelResortPreview) {
  return preview.status === "ready_to_update" || preview.status === "ready_to_create";
}

function canCreatePreview(preview: ExcelResortPreview) {
  return preview.status === "new_candidate";
}

function isPreviewActionable(preview: ExcelResortPreview) {
  return canApplyPreview(preview) || canCreatePreview(preview);
}

function previewChangeItems(preview: ExcelResortPreview) {
  if (preview.error) return [preview.error];
  if (!preview.diff) return [statusLabel(preview.status)];

  const changes = preview.diff.rootFields.map((field) => (
    field.action === "Same" ? `Reapply ${field.field}` : `${field.action} ${field.field}`
  ));

  if (preview.diff.highlights.action === "Update") changes.push(`Update Highlights (${preview.diff.highlights.excel})`);
  if (preview.diff.mealPlans.action === "Update") changes.push(`Update Meal Plans (${preview.diff.mealPlans.excel})`);
  if (preview.diff.rooms.action === "Update") {
    if (preview.diff.rooms.updated > 0) changes.push(`Update ${preview.diff.rooms.updated} villa categor${preview.diff.rooms.updated === 1 ? "y" : "ies"}`);
    if (preview.diff.rooms.added > 0) changes.push(`Add ${preview.diff.rooms.added} villa categor${preview.diff.rooms.added === 1 ? "y" : "ies"}`);
    if (preview.diff.rooms.untouched > 0) changes.push(`Keep ${preview.diff.rooms.untouched} existing villa categor${preview.diff.rooms.untouched === 1 ? "y" : "ies"}`);
  }

  return changes.length ? changes : ["No field changes"];
}

function bulkTargetPreviews(previews: ExcelResortPreview[], selectedPreviewIds: string[], mode: BulkMode) {
  return previews.filter((preview) => {
    if (!selectedPreviewIds.includes(preview.stagingId)) return false;
    if (mode === "update") return canApplyPreview(preview);
    if (mode === "create") return canCreatePreview(preview);
    return isPreviewActionable(preview);
  });
}

function PreviewTable({
  previews,
  selectedPreviewIds,
  pendingKey,
  onToggle,
  onToggleAll,
  onApply,
  onCreate,
  onManualMatch,
  onBulkApply
}: {
  previews: ExcelResortPreview[];
  selectedPreviewIds: string[];
  pendingKey: string;
  onToggle: (previewId: string) => void;
  onToggleAll: () => void;
  onApply: (preview: ExcelResortPreview) => Promise<boolean>;
  onCreate: (preview: ExcelResortPreview) => Promise<boolean>;
  onManualMatch: (preview: ExcelResortPreview, resortId: string) => void;
  onBulkApply: (mode: BulkMode) => void;
}) {
  const actionablePreviews = previews.filter(isPreviewActionable);
  const selectedActionableCount = actionablePreviews.filter((preview) => selectedPreviewIds.includes(preview.stagingId)).length;
  const selectedUpdateCount = bulkTargetPreviews(previews, selectedPreviewIds, "update").length;
  const selectedCreateCount = bulkTargetPreviews(previews, selectedPreviewIds, "create").length;
  const allActionableSelected = actionablePreviews.length > 0 && selectedActionableCount === actionablePreviews.length;
  const isBusy = Boolean(pendingKey);

  return (
    <div className="stack">
      <h4>Review Action Table</h4>
      <div className="admin-table-shell excel-preview-table-shell">
        <table className="table excel-preview-table">
          <thead>
            <tr>
              <th className="admin-checkbox-cell">
                <input
                  type="checkbox"
                  aria-label="Select all actionable workbook previews"
                  checked={allActionableSelected}
                  disabled={!actionablePreviews.length || isBusy}
                  onChange={onToggleAll}
                />
              </th>
              <th>File Name</th>
              <th>Resort Name</th>
              <th>Changes</th>
              <th>No. of Villas Updated</th>
              <th>No. of Villas to be Removed</th>
              <th>Villas Added</th>
              <th>Action Items</th>
            </tr>
          </thead>
          <tbody>
            {previews.map((preview) => {
              const canApply = canApplyPreview(preview);
              const canCreate = canCreatePreview(preview);
              const isPending = pendingKey === preview.stagingId;
              const isSelected = selectedPreviewIds.includes(preview.stagingId);
              const canSelect = isPreviewActionable(preview);

              return (
                <tr key={preview.stagingId}>
                  <td className="admin-checkbox-cell">
                    <input
                      type="checkbox"
                      aria-label={`Select ${preview.filename}`}
                      checked={isSelected}
                      disabled={!canSelect || isBusy}
                      onChange={() => onToggle(preview.stagingId)}
                    />
                  </td>
                  <td>
                    <strong>{preview.filename}</strong>
                    <span className={`admin-status-badge is-${statusClass(preview.status)}`}>{statusLabel(preview.status)}</span>
                    <p className="admin-table-subtle">{preview.model?.sourceFile.sheets.join(", ") || "Unreadable workbook"}</p>
                  </td>
                  <td>
                    <strong>{previewResortName(preview)}</strong>
                    <p className="admin-table-subtle">{preview.action}</p>
                  </td>
                  <td>
                    <ul className="excel-preview-table__changes">
                      {previewChangeItems(preview).map((change) => <li key={change}>{change}</li>)}
                    </ul>
                    {preview.warnings.length ? <p className="admin-table-subtle">{preview.warnings.length} warning{preview.warnings.length === 1 ? "" : "s"}</p> : null}
                    {preview.model?.ignoredExampleRows.length ? <p className="admin-table-subtle">{preview.model.ignoredExampleRows.length} template row{preview.model.ignoredExampleRows.length === 1 ? "" : "s"} ignored</p> : null}
                  </td>
                  <td>{preview.diff?.rooms.updated ?? 0}</td>
                  <td>{preview.diff?.rooms.removed ?? 0}</td>
                  <td>{preview.diff?.rooms.added ?? 0}</td>
                  <td>
                    <div className="admin-bulk-actions excel-preview-table__actions">
                      {canApply ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--primary"
                          disabled={isBusy}
                          onClick={() => onApply(preview)}
                        >
                          {isPending ? "Applying..." : "Apply Update"}
                        </button>
                      ) : null}
                      {canCreate ? (
                        <button type="button" className="admin-btn admin-btn--primary" disabled={isBusy} onClick={() => onCreate(preview)}>
                          {isPending ? "Creating..." : "Add Draft"}
                        </button>
                      ) : null}
                      {preview.match?.status === "review_required" ? preview.match.candidates.map((candidate) => (
                        <button
                          key={candidate.resortId}
                          type="button"
                          className="admin-btn admin-btn--secondary"
                          disabled={isBusy}
                          onClick={() => onManualMatch(preview, candidate.resortId)}
                        >
                          Use Match
                        </button>
                      )) : null}
                      {!canApply && !canCreate && preview.match?.status !== "review_required" ? <span className="admin-table-subtle">No action</span> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="admin-bulk-bar">
        <span>{selectedActionableCount} selected</span>
        <div className="admin-bulk-actions">
          <button type="button" className="admin-btn admin-btn--primary" disabled={isBusy || selectedUpdateCount === 0} onClick={() => onBulkApply("update")}>
            Apply Selected Updates
          </button>
          <button type="button" className="admin-btn admin-btn--secondary" disabled={isBusy || selectedCreateCount === 0} onClick={() => onBulkApply("create")}>
            Create Selected Drafts
          </button>
          <button type="button" className="admin-btn admin-btn--secondary" disabled={isBusy || selectedActionableCount === 0} onClick={() => onBulkApply("mixed")}>
            Apply/Create Selected
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExcelSyncPanel() {
  const [propertyType, setPropertyType] = useState("resort");
  const [pending, setPending] = useState(false);
  const [pendingKey, setPendingKey] = useState("");
  const [batchId, setBatchId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ExcelSyncProgress | null>(null);
  const [selectedPreviewIds, setSelectedPreviewIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setPendingKey("");
    setMessage("");
    setError("");
    setProgress(null);
    setSelectedPreviewIds([]);

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
      setSelectedPreviewIds((current) => current.filter((previewId) => previewId !== preview.stagingId));
      setMessage(result.message);
      return true;
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Excel preview could not be applied.");
      return false;
    } finally {
      setPendingKey("");
    }
  }

  async function createDraft(preview: ExcelResortPreview) {
    return applyPreview(preview, "create_draft");
  }

  function togglePreviewSelection(previewId: string) {
    setSelectedPreviewIds((current) => (
      current.includes(previewId)
        ? current.filter((selectedPreviewId) => selectedPreviewId !== previewId)
        : [...current, previewId]
    ));
  }

  function toggleAllPreviews() {
    setSelectedPreviewIds((current) => {
      const actionableIds = progress?.previews.filter(isPreviewActionable).map((preview) => preview.stagingId) ?? [];
      const allSelected = actionableIds.length > 0 && actionableIds.every((previewId) => current.includes(previewId));
      if (allSelected) return current.filter((previewId) => !actionableIds.includes(previewId));
      return Array.from(new Set([...current, ...actionableIds]));
    });
  }

  async function bulkApply(mode: BulkMode) {
    const targets = progress ? bulkTargetPreviews(progress.previews, selectedPreviewIds, mode) : [];
    if (!targets.length) {
      setError("Select at least one applicable workbook preview.");
      return;
    }

    setMessage("");
    setError("");
    let appliedCount = 0;
    for (const preview of targets) {
      const applied = await applyPreview(preview, canCreatePreview(preview) ? "create_draft" : "update");
      if (applied) appliedCount += 1;
    }
    if (appliedCount > 0) setMessage(`${appliedCount} workbook preview${appliedCount === 1 ? "" : "s"} applied.`);
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
      setSelectedPreviewIds((current) => current.filter((previewId) => previewId !== preview.stagingId));
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
        <PreviewTable
          previews={progress.previews}
          selectedPreviewIds={selectedPreviewIds}
          pendingKey={pendingKey}
          onToggle={togglePreviewSelection}
          onToggleAll={toggleAllPreviews}
          onApply={applyPreview}
          onCreate={createDraft}
          onManualMatch={manualMatch}
          onBulkApply={bulkApply}
        />
      ) : null}
    </article>
  );
}
