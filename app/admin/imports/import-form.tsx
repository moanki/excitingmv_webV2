"use client";

import { useState, type FormEvent } from "react";
import { ArchiveRestore, X } from "lucide-react";

import {
  type ImportActionState
} from "@/app/admin/imports/actions";
import type { ImportCheckpointRecord, ImportExecutionResult, ImportLogEntry } from "@/lib/services/import-service";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type UploadStage = "idle" | "uploading" | "processing" | "complete" | "error";

type DriveImportProgress = {
  totalSources: number;
  processedSources: number;
  importedResorts: number;
  skippedSources: number;
  warningCount: number;
  errorCount: number;
  providerUsages: string[];
  logs: ImportLogEntry[];
};

const categoryOptions = [
  { value: "resort", label: "Resort" },
  { value: "liveaboards", label: "Liveaboard" },
  { value: "hotels", label: "Hotel" }
] as const;

function CategorySelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span className="field__label">Import Category</span>
      <select className="admin-select" name="propertyType" value={value} onChange={(event) => onChange(event.target.value)}>
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="field__help">Imported content is saved only under this selected content type.</p>
    </label>
  );
}

function formatCheckpointDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function CheckpointModal({
  checkpoints
}: {
  checkpoints: ImportCheckpointRecord[];
}) {
  const [open, setOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function publishCheckpoint(checkpointId: string, resortIndex: number) {
    setPendingKey(`${checkpointId}:${resortIndex}`);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/imports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "publish-checkpoint",
          checkpointId,
          resortIndex
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error || "Checkpoint publish failed.");
        return;
      }

      setMessage(payload.message || "Checkpoint published.");
      window.location.reload();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Checkpoint publish failed.");
    } finally {
      setPendingKey("");
    }
  }

  return (
    <>
      <button type="button" className="admin-icon-button" aria-label="Open import checkpoints" onClick={() => setOpen(true)}>
        <ArchiveRestore className="admin-icon" />
      </button>

      {open ? (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div className="admin-modal-panel" role="dialog" aria-modal="true" aria-label="Import checkpoints" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Import Checkpoints</h3>
                <p>Resume from saved extraction results without re-importing.</p>
              </div>
              <button type="button" className="admin-icon-button" aria-label="Close import checkpoints" onClick={() => setOpen(false)}>
                <X className="admin-icon" />
              </button>
            </div>

            {message ? <p className="admin-alert admin-alert--success">{message}</p> : null}
            {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}

            <div className="admin-checkpoint-list">
              {checkpoints.length ? (
                checkpoints.map((checkpoint) => (
                  <article key={checkpoint.id} className="admin-checkpoint-card">
                    <div className="admin-checkpoint-card__header">
                      <div>
                        <strong>{checkpoint.filename}</strong>
                        <p>{checkpoint.batchName}</p>
                      </div>
                      <span className={`admin-status-badge is-${checkpoint.reviewStatus === "published" ? "approved" : checkpoint.reviewStatus === "ready" ? "pending" : "neutral"}`}>
                        {checkpoint.reviewStatus}
                      </span>
                    </div>

                    <div className="admin-checkpoint-meta">
                      <span>{formatCheckpointDate(checkpoint.createdAt)}</span>
                      <span>{checkpoint.sourceType}</span>
                    </div>

                    {checkpoint.notes ? <p className="admin-checkpoint-notes">{checkpoint.notes}</p> : null}

                    {checkpoint.resorts.length ? (
                      <div className="admin-checkpoint-resorts">
                        {checkpoint.resorts.map((resort, resortIndex) => (
                          <div key={`${checkpoint.id}-${resortIndex}`} className="admin-checkpoint-resort">
                            <div>
                              <strong>{resort.name}</strong>
                              <p>{resort.location || "Maldives"} · {resort.category || "Resort"}</p>
                            </div>
                            <button
                              type="button"
                              className="admin-btn admin-btn--primary"
                              disabled={!checkpoint.canPublish || pendingKey === `${checkpoint.id}:${resortIndex}`}
                              onClick={() => publishCheckpoint(checkpoint.id, resortIndex)}
                            >
                              {pendingKey === `${checkpoint.id}:${resortIndex}` ? "Adding..." : "Add to Production"}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="field__help">Legacy checkpoint summary only. Re-import once if you need a publishable checkpoint.</p>
                    )}
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <strong>No checkpoints saved yet.</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ImportProgress({
  pending,
  state,
  pendingLabel,
  liveProgress
}: {
  pending: boolean;
  state: ImportActionState;
  pendingLabel: string;
  liveProgress?: DriveImportProgress | null;
}) {
  const processedSources = pending ? liveProgress?.processedSources ?? 0 : state?.ok ? state.result.processedSources : 0;
  const totalSources = pending ? liveProgress?.totalSources ?? 0 : state?.ok ? state.result.totalSources : 0;
  const progressValue =
    pending && totalSources > 0 ? Math.max(8, Math.min(96, Math.round((processedSources / totalSources) * 100))) : state?.ok ? 100 : 0;
  const progressLabel = pending
    ? totalSources > 0
      ? `${pendingLabel} (${processedSources}/${totalSources})`
      : pendingLabel
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
          ? "Reading input files, extracting resort details, skipping duplicates, and preparing publish-ready content."
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
                Provider: {entry.provider}
                {entry.model ? ` | Model: ${entry.model}` : ""}
                {" | "}Source: {entry.sourceUrl}
              </small>
            </article>
          ))}
        </div>
      </article>
    </div>
  );
}

function UploadPipeline({ stage, filename }: { stage: UploadStage; filename: string }) {
  if (stage === "idle") return null;
  const complete = stage === "complete";
  const failed = stage === "error";
  const steps = [
    { label: "Upload", status: stage === "uploading" ? "In progress" : "100%" },
    { label: "Microsoft MarkItDown", status: complete ? "100%" : stage === "processing" ? "In progress" : "Waiting" },
    { label: "AI processing", status: complete ? "100%" : "Waiting" }
  ];

  return (
    <section className="admin-import-run stack" aria-live="polite" aria-label="PDF processing timeline">
      <strong>📄 {filename}</strong>
      {steps.map((step) => {
        const done = step.status === "100%";
        return (
        <div className="admin-import-progress" key={step.label}>
          <div className="admin-import-progress__header">
            <strong>{done ? "✓" : failed ? "✕" : "⏳"} {step.label}</strong>
            <span>{failed && !done ? "Stopped" : step.status}</span>
          </div>
          <div className="admin-import-progress__track" aria-hidden="true">
            <div className={`admin-import-progress__bar${done ? "" : " is-pending"}`} style={{ width: done ? "100%" : "0%" }} />
          </div>
        </div>
        );
      })}
      <p className={failed ? "admin-alert admin-alert--error" : "admin-import-progress__meta"}>
        {stage === "uploading" && "Uploading and validating the PDF. Please keep this window open."}
        {stage === "processing" && "Microsoft MarkItDown is converting the PDF to Markdown before AI analysis."}
        {complete && "Microsoft MarkItDown conversion, Markdown validation, and AI analysis completed successfully."}
        {failed && "Processing stopped. Review the error below and retry when ready."}
      </p>
    </section>
  );
}

function ConversionDetails({ result }: { result: ImportExecutionResult }) {
  const conversion = result.conversion;
  if (!conversion) return null;
  const { stats } = conversion;
  const download = () => {
    const url = URL.createObjectURL(new Blob([conversion.markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = conversion.filename.replace(/\.pdf$/i, "") + ".md";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <article className="panel admin-form-card stack">
      <div className="admin-form-section__header">
        <h3 className="admin-form-section__title">Conversion Details</h3>
        <p className="admin-form-section__help">Processed by Microsoft MarkItDown in {(stats.conversionDurationMs / 1000).toFixed(1)} seconds. AI analysis took {((stats.aiProcessingDurationMs ?? 0) / 1000).toFixed(1)} seconds.</p>
      </div>
      <div className="dashboard-grid dashboard-grid-quad">
        <div className="stat-card"><p className="eyebrow">Pages / Markdown</p><strong>{stats.pageCount} / {(stats.markdownSize / 1024).toFixed(1)} KB</strong></div>
        <div className="stat-card"><p className="eyebrow">Characters</p><strong>{stats.markdownCharacters.toLocaleString()}</strong></div>
        <div className="stat-card"><p className="eyebrow">Headings / Tables</p><strong>{stats.headingsDetected} / {stats.tablesDetected}</strong></div>
        <div className="stat-card"><p className="eyebrow">Lists / Images</p><strong>{stats.listsDetected} / {stats.imagesReferenced}</strong></div>
      </div>
      <details>
        <summary>Technical Details</summary>
        <p className="field__help">UTF-8 · GitHub Flavored Markdown · OCR: {stats.ocrUsed ? "Yes" : "No"} · Fallback: {stats.fallbackUsed ? "Yes" : "No"} · {stats.chunkStrategy}</p>
      </details>
      <details>
        <summary>Markdown Preview</summary>
        <pre className="admin-import-markdown-preview">{conversion.markdown}</pre>
      </details>
      <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn--secondary" onClick={() => navigator.clipboard.writeText(conversion.markdown)}>Copy Markdown</button>
        <button type="button" className="admin-btn admin-btn--secondary" onClick={download}>Download Markdown</button>
      </div>
    </article>
  );
}

function ImportDrivePanel() {
  const [state, setState] = useState<ImportActionState>(undefined);
  const [pending, setPending] = useState(false);
  const [liveProgress, setLiveProgress] = useState<DriveImportProgress | null>(null);
  const [propertyType, setPropertyType] = useState("resort");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState(undefined);
    setLiveProgress(null);

    try {
      const formData = new FormData(event.currentTarget);
      const selectedPropertyType = String(formData.get("propertyType") ?? "resort");
      const startResponse = await fetch("/api/admin/imports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "start",
          googleDriveUrl: String(formData.get("googleDriveUrl") ?? ""),
          propertyType: selectedPropertyType
        })
      });

      const startPayload = (await startResponse.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            message?: string;
            data?: { batchId: string; sourceFiles: string[]; message: string };
          }
        | null;

      if (!startResponse.ok || !startPayload?.ok || !startPayload.data || !startPayload.message) {
        setState({
          ok: false,
          error: startPayload?.error || "Google Drive import failed."
        });
        return;
      }

      const progress: DriveImportProgress = {
        totalSources: startPayload.data.sourceFiles.length,
        processedSources: 0,
        importedResorts: 0,
        skippedSources: 0,
        warningCount: 0,
        errorCount: 0,
        providerUsages: [],
        logs: []
      };
      setLiveProgress(progress);

      for (let index = 0; index < startPayload.data.sourceFiles.length; index += 1) {
        const processResponse = await fetch("/api/admin/imports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mode: "process",
            batchId: startPayload.data.batchId,
            sourceUrl: startPayload.data.sourceFiles[index],
            sourceIndex: index,
            propertyType: selectedPropertyType
          })
        });

        const processPayload = (await processResponse.json().catch(() => null)) as
          | {
              ok?: boolean;
              error?: string;
              data?: {
                processedSources: number;
                importedResorts: number;
                skippedSources: number;
                warningCount: number;
                errorCount: number;
                providerUsage: string | null;
                logs: ImportLogEntry[];
              };
            }
          | null;

        if (!processResponse.ok || !processPayload?.ok || !processPayload.data) {
          setState({
            ok: false,
            error: processPayload?.error || "Google Drive import failed while processing a resort PDF."
          });
          setPending(false);
          return;
        }

        progress.processedSources += processPayload.data.processedSources;
        progress.importedResorts += processPayload.data.importedResorts;
        progress.skippedSources += processPayload.data.skippedSources;
        progress.warningCount += processPayload.data.warningCount;
        progress.errorCount += processPayload.data.errorCount;
        if (processPayload.data.providerUsage) {
          progress.providerUsages.push(processPayload.data.providerUsage);
        }
        progress.logs = [...progress.logs, ...processPayload.data.logs];
        setLiveProgress({ ...progress, logs: [...progress.logs] });
      }

      const finalizeResponse = await fetch("/api/admin/imports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "finalize",
          batchId: startPayload.data.batchId,
          totalSources: progress.totalSources,
          importedResorts: progress.importedResorts,
          skippedSources: progress.skippedSources,
          warningCount: progress.warningCount,
          errorCount: progress.errorCount,
          providerUsages: progress.providerUsages,
          logs: progress.logs,
          propertyType: selectedPropertyType
        })
      });

      const finalizePayload = (await finalizeResponse.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string; data?: ImportExecutionResult }
        | null;

      if (!finalizeResponse.ok || !finalizePayload?.ok || !finalizePayload.data || !finalizePayload.message) {
        setState({
          ok: false,
          error: finalizePayload?.error || "Google Drive import could not be finalized."
        });
        return;
      }

      setState({
        ok: true,
        message: finalizePayload.message,
        result: finalizePayload.data
      });
    } catch (error) {
      setState({
        ok: false,
        error: error instanceof Error ? error.message : "Google Drive import failed."
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="panel admin-form-card">
      <div className="admin-form-section__header">
        <h3 className="admin-form-section__title">Import From Google Drive</h3>
        <p className="admin-form-section__help">
          Paste a Google Drive file or folder URL. Each PDF is treated as one resort fact sheet, and existing resorts
          are skipped automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="stack">
        <div className="form-grid">
          <CategorySelector value={propertyType} onChange={setPropertyType} />
          <label className="field field--full">
            <span className="field__label">Google Drive URL</span>
            <input
              className="admin-input"
              name="googleDriveUrl"
              placeholder="https://drive.google.com/file/d/... or https://drive.google.com/drive/folders/..."
              required
            />
            <p className="field__help">
              Use a shareable Google Drive file or folder URL. The importer reads PDF fact sheets and skips resorts
              that already exist.
            </p>
          </label>
        </div>

        <ImportProgress
          pending={pending}
          state={state}
          pendingLabel="Importing Google Drive PDFs"
          liveProgress={liveProgress}
        />

        <div className="admin-form-actions">
          <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
            {pending ? "Importing..." : "Import From Drive"}
          </button>
        </div>

        {state?.ok ? <p className="admin-alert admin-alert--success">{state.message}</p> : null}
        {state?.ok === false ? <p className="admin-alert admin-alert--error">{state.error}</p> : null}

        <ImportRunSummary state={state} />
      </form>
    </article>
  );
}

function ImportUploadPanel() {
  const [state, setState] = useState<ImportActionState>(undefined);
  const [pending, setPending] = useState(false);
  const [propertyType, setPropertyType] = useState("resort");
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [filename, setFilename] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState(undefined);
    setUploadStage("uploading");

    try {
      const formData = new FormData(event.currentTarget);
      const upload = formData.get("factSheetFile");
      const selectedPropertyType = String(formData.get("propertyType") ?? "resort");

      if (!(upload instanceof File) || upload.size === 0) {
        setUploadStage("error");
        setState({
          ok: false,
          error: "Upload a PDF fact sheet to start the import."
        });
        return;
      }
      setFilename(upload.name);

      const supabase = createSupabaseBrowserClient();
      const signedUploadResponse = await fetch("/api/admin/imports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "create-upload-url",
          filename: upload.name,
          contentType: upload.type || "application/pdf",
          propertyType: selectedPropertyType
        })
      });

      const signedUploadPayload = (await signedUploadResponse.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            data?: {
              bucket: string;
              path: string;
              token: string;
              publicUrl: string;
              contentType: string;
            };
          }
        | null;

      if (!signedUploadResponse.ok || !signedUploadPayload?.ok || !signedUploadPayload.data) {
        setUploadStage("error");
        setState({
          ok: false,
          error: signedUploadPayload?.error || "Could not prepare PDF upload."
        });
        return;
      }

      const uploadResult = await supabase.storage
        .from(signedUploadPayload.data.bucket)
        .uploadToSignedUrl(signedUploadPayload.data.path, signedUploadPayload.data.token, upload, {
          cacheControl: "3600",
          contentType: signedUploadPayload.data.contentType,
          upsert: true
        });

      if (uploadResult.error) {
        setUploadStage("error");
        setState({
          ok: false,
          error: uploadResult.error.message
        });
        return;
      }

      setUploadStage("processing");

      const response = await fetch("/api/admin/imports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "upload-url",
          sourceUrl: signedUploadPayload.data.publicUrl,
          filename: upload.name,
          propertyType: selectedPropertyType
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string; data?: ImportExecutionResult }
        | null;

      if (!response.ok || !payload?.ok || !payload.data || !payload.message) {
        setUploadStage("error");
        setState({
          ok: false,
          error: payload?.error || "Uploaded PDF import failed."
        });
        return;
      }

      setState({
        ok: true,
        message: payload.message,
        result: payload.data
      });
      setUploadStage("complete");
    } catch (error) {
      setUploadStage("error");
      setState({
        ok: false,
        error: error instanceof Error ? error.message : "Uploaded PDF import failed."
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="panel admin-form-card">
      <div className="admin-form-section__header">
        <h3 className="admin-form-section__title">Smart Upload</h3>
        <p className="admin-form-section__help">
          Upload a single PDF fact sheet directly. This is useful when the Google Drive source is unreliable or when
          you want to test one resort before running a full folder import.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="stack">
        <div className="form-grid">
          <CategorySelector value={propertyType} onChange={setPropertyType} />
          <label className="field field--full">
            <span className="field__label">Fact Sheet PDF</span>
            <input className="admin-file-input" name="factSheetFile" type="file" accept="application/pdf,.pdf" required />
            <p className="field__help">
              Upload one resort fact sheet PDF. The importer will extract details, create SEO content, and skip the
              resort if it already exists.
            </p>
          </label>
        </div>

        <UploadPipeline stage={uploadStage} filename={filename || "PDF document"} />

        <div className="admin-form-actions">
          <button className="admin-btn admin-btn--secondary" type="submit" disabled={pending}>
            {pending ? "Uploading..." : "Upload And Import"}
          </button>
        </div>

        {state?.ok ? <p className="admin-alert admin-alert--success">{state.message}</p> : null}
        {state?.ok === false ? <p className="admin-alert admin-alert--error">{state.error}</p> : null}

        <ImportRunSummary state={state} />
        {state?.ok ? <ConversionDetails result={state.result} /> : null}
      </form>
    </article>
  );
}

export function ImportCenterForms({ checkpoints }: { checkpoints: ImportCheckpointRecord[] }) {
  return (
    <div className="stack">
      <div className="admin-page-actions admin-page-actions--end">
        <CheckpointModal checkpoints={checkpoints} />
      </div>
      <ImportDrivePanel />
      <ImportUploadPanel />
    </div>
  );
}
