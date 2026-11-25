"use client";

import { useState, type ChangeEvent } from "react";
import { FileDown, UploadCloud } from "lucide-react";
import { useAdminActionFeedback } from "@/components/admin/admin-action-feedback";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { publicEnv } from "@/lib/public-env";
import { selectBrochure, signedBrochureTusConfig, type BrochureSelection } from "@/lib/brochure-import";
import type { PropertyType } from "@/lib/services/resort-service";

type ResortOption = { id: string; name: string; hasBrochure: boolean };
type PreviewRow = {
  relativePath: string;
  folder: string;
  name: string;
  size: number;
  resortId: string;
  status: string;
  duplicate: boolean;
};

async function brochureRequest<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/admin/brochures", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Brochure request failed.");
  return payload.data as T;
}

type PendingAttachmentError = Error & { uploadedPath?: string };

async function uploadBrochure(
  resortId: string,
  file: File,
  propertyType: PropertyType,
  pendingPath = "",
  onProgress?: (message: string, percent: number) => void
) {
  if (pendingPath) {
    onProgress?.("Linking uploaded PDF to the property…", 95);
    return brochureRequest<{ path: string; name: string }>({ mode: "attach", resortId, propertyType, path: pendingPath });
  }
  onProgress?.("Preparing PDF upload…", 0);
  const signed = await brochureRequest<{ bucket: string; path: string; token: string }>({
    mode: "sign", resortId, propertyType, filename: file.name, size: file.size
  });
  const { Upload } = await import("tus-js-client");
  const tusConfig = signedBrochureTusConfig(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    signed.token
  );
  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      ...tusConfig,
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: signed.bucket, objectName: signed.path, contentType: "application/pdf" },
      onProgress: (uploaded, total) => {
        const percent = total > 0 ? Math.round(uploaded / total * 100) : 0;
        onProgress?.(`Uploading PDF — ${percent}%`, percent * 0.95);
      },
      onError: reject,
      onSuccess: () => resolve()
    });
    upload.start();
  });
  try {
    onProgress?.("Linking uploaded PDF to the property…", 95);
    return await brochureRequest<{ path: string; name: string }>({ mode: "attach", resortId, propertyType, path: signed.path });
  } catch (error) {
    const pending = new Error(error instanceof Error ? error.message : "Could not attach uploaded PDF.") as PendingAttachmentError;
    pending.uploadedPath = signed.path;
    throw pending;
  }
}

function brochureUrl(path: string, name: string) {
  return createSupabaseBrowserClient().storage.from("resort-brochures").getPublicUrl(path, {
    download: `${name} Factsheet.pdf`
  }).data.publicUrl;
}

export function BrochureUploadControl({ resortId, resortName, initialPath, propertyType }: {
  resortId: string;
  resortName: string;
  initialPath: string;
  propertyType: PropertyType;
}) {
  const singular = propertyType === "resort" ? "resort" : propertyType === "hotels" ? "hotel" : "liveaboard";
  const [file, setFile] = useState<File | null>(null);
  const [path, setPath] = useState(initialPath);
  const [pendingPath, setPendingPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const attached = await uploadBrochure(resortId, file, propertyType, pendingPath);
      setPath(attached.path);
      setPendingPath("");
      setFile(null);
      setMessage(`Brochure uploaded and linked to this ${singular}.`);
    } catch (error) {
      const uploadedPath = (error as PendingAttachmentError).uploadedPath;
      if (uploadedPath) setPendingPath(uploadedPath);
      setMessage(`${error instanceof Error ? error.message : "Upload failed."}${uploadedPath || pendingPath ? " The PDF is in Storage; retry to attach it without re-uploading." : ""}`);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setMessage("");
    try {
      await brochureRequest({ mode: "remove", resortId, propertyType });
      setPath("");
      setMessage(`Brochure removed from this ${singular}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove brochure.");
    } finally {
      setBusy(false);
    }
  }

  async function discardPending() {
    setBusy(true);
    try {
      await brochureRequest({ mode: "discard", resortId, propertyType, path: pendingPath });
      setPendingPath("");
      setMessage("Unattached PDF discarded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not discard PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field field--full">
      <span className="field__label">{singular[0].toUpperCase() + singular.slice(1)} Brochure (PDF)</span>
      {path ? <a href={brochureUrl(path, resortName)} className="admin-btn admin-btn--ghost"><FileDown className="admin-icon" /> Download current brochure</a> : <p className="field__help">No brochure uploaded.</p>}
      <label className="field"><span className="field__label">Choose PDF</span><input className="admin-file-input" type="file" accept="application/pdf,.pdf" disabled={Boolean(pendingPath)} onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
      <div className="admin-form-actions admin-form-actions--start">
        <button type="button" className="admin-btn admin-btn--secondary" disabled={!file || busy} onClick={save}>
          <UploadCloud className="admin-icon" /> {busy ? "Working..." : pendingPath ? "Retry Attachment" : path ? "Replace Brochure" : "Upload Brochure"}
        </button>
        {path ? <button type="button" className="admin-btn admin-btn--ghost" disabled={busy} onClick={remove}>Remove Brochure</button> : null}
        {pendingPath ? <button type="button" className="admin-btn admin-btn--ghost" disabled={busy} onClick={discardPending}>Discard Unattached PDF</button> : null}
      </div>
      {message ? <p role="status" className="field__help">{message}</p> : null}
    </div>
  );
}

export function BrochureImportPanel({ propertyType = "resort" }: { propertyType?: PropertyType }) {
  const { startAction, updateAction, finishAction, notifyError } = useAdminActionFeedback();
  const singular = propertyType === "resort" ? "Resort" : propertyType === "hotels" ? "Hotel" : "Liveaboard";
  const [page, setPage] = useState(0);
  const [files, setFiles] = useState<Map<string, File>>(new Map());
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [resorts, setResorts] = useState<ResortOption[]>([]);
  const [selections, setSelections] = useState<Record<string, BrochureSelection>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const [pendingPaths, setPendingPaths] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const acceptedCount = rows.filter((row) => selections[row.relativePath]?.accepted && results[row.relativePath] !== "Uploaded").length;

  async function selectFolder(event: ChangeEvent<HTMLInputElement>) {
    const selected = [...(event.target.files ?? [])].filter((file) => /\.pdf$/i.test(file.name));
    const byPath = new Map(selected.map((file) => [file.webkitRelativePath || file.name, file]));
    setFiles(byPath);
    setRows([]);
    setPage(0);
    setResults({});
    setPendingPaths({});
    setMessage("");
    if (!selected.length) {
      setMessage("Choose a folder containing PDFs.");
      return;
    }
    setBusy(true);
    try {
      const preview = await brochureRequest<{ rows: PreviewRow[]; resorts: ResortOption[] }>({
        mode: "preview", propertyType, files: selected.map((file) => ({ relativePath: file.webkitRelativePath, size: file.size }))
      });
      setRows(preview.rows);
      setResorts(preview.resorts);
      setSelections(preview.rows.reduce<Record<string, BrochureSelection>>((current, row) =>
        selectBrochure(current, row.relativePath, row.resortId, Boolean(row.resortId) && !row.duplicate), {}));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preview failed.");
    } finally {
      setBusy(false);
    }
  }

  async function importAccepted() {
    const accepted = rows.filter((row) => selections[row.relativePath]?.accepted && results[row.relativePath] !== "Uploaded");
    const ids = accepted.map((row) => selections[row.relativePath].resortId);
    if (!accepted.length || ids.some((id) => !id) || new Set(ids).size !== ids.length) {
      const error = !accepted.length ? "Select at least one PDF to import."
        : ids.some((id) => !id) ? `Choose a ${singular.toLowerCase()} for each selected PDF.`
        : `Several selected PDFs point to the same ${singular.toLowerCase()}. Choose the PDF you want to use for that property.`;
      setMessage(error);
      notifyError("Brochure import needs attention", error);
      return;
    }
    setBusy(true);
    setMessage(`Starting import of ${accepted.length} brochures…`);
    const actionId = startAction({ title: "Importing brochures…", type: "upload", progress: 0 });
    let uploaded = 0;
    let completed = 0;
    for (const row of accepted) {
      const file = files.get(row.relativePath);
      try {
        if (!file) throw new Error("This PDF is no longer available. Select the folder again.");
        await uploadBrochure(selections[row.relativePath].resortId, file, propertyType, pendingPaths[row.relativePath], (status, percent) => {
          setResults((current) => ({ ...current, [row.relativePath]: status }));
          setMessage(`Brochure ${completed + 1} of ${accepted.length} — ${row.folder}: ${status}`);
          updateAction(actionId, {
            message: `${row.folder} / ${row.name} — ${status}`,
            progress: (completed + percent / 100) / accepted.length * 100
          });
        });
        setPendingPaths((current) => ({ ...current, [row.relativePath]: "" }));
        setResults((current) => ({ ...current, [row.relativePath]: "Uploaded" }));
        uploaded++;
      } catch (error) {
        const uploadedPath = (error as PendingAttachmentError).uploadedPath;
        if (uploadedPath) setPendingPaths((current) => ({ ...current, [row.relativePath]: uploadedPath }));
        setResults((current) => ({ ...current, [row.relativePath]: `${error instanceof Error ? error.message : "Upload failed"}${uploadedPath || pendingPaths[row.relativePath] ? " (retry attachment)" : ""}` }));
      }
      completed++;
      updateAction(actionId, { progress: completed / accepted.length * 100 });
    }
    const summary = `${uploaded} of ${accepted.length} brochures uploaded. Review row results below.`;
    setMessage(summary);
    finishAction(actionId, {
      title: uploaded === accepted.length ? "Brochure import completed" : "Some brochures could not be imported",
      message: summary,
      status: uploaded === accepted.length ? "success" : "error"
    });
    setBusy(false);
  }

  async function discardPending(row: PreviewRow) {
    const path = pendingPaths[row.relativePath];
    const resortId = selections[row.relativePath]?.resortId;
    if (!path || !resortId) return;
    setBusy(true);
    try {
      await brochureRequest({ mode: "discard", resortId, propertyType, path });
      setPendingPaths((current) => ({ ...current, [row.relativePath]: "" }));
      setResults((current) => ({ ...current, [row.relativePath]: "Unattached PDF discarded" }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not discard PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-form-card stack" aria-label="Bulk brochure import">
      <div className="admin-form-section__header">
        <h3 className="admin-form-section__title">Bulk {singular} Brochure Import</h3>
        <p className="admin-form-section__help">Select the parent folder containing {singular} Name / one file.pdf per subfolder. Exact names match automatically; review other matches before import.</p>
      </div>
      <label className="field"><span className="field__label">Brochure folder</span><input className="admin-file-input" type="file" accept="application/pdf,.pdf" multiple {...{ webkitdirectory: "", directory: "" }} onChange={selectFolder} disabled={busy} /></label>
      {rows.length ? (
        <div className="table-scroll">
          <table className="admin-table">
            <thead><tr><th>PDF</th><th>Folder</th><th>{singular} match</th><th>Status</th><th>Accept</th></tr></thead>
            <tbody>{rows.slice(page * 50, (page + 1) * 50).map((row) => {
              const selection = selections[row.relativePath] ?? { resortId: "", accepted: false };
              const invalid = !row.folder || !row.name.toLowerCase().endsWith(".pdf") || row.size <= 0;
              return <tr key={row.relativePath}>
                <td>{row.name}</td>
                <td>{row.folder || "Invalid path"}</td>
                <td><select className="admin-select" aria-label={`${singular} for ${row.name}`} value={selection.resortId} disabled={invalid || busy || Boolean(pendingPaths[row.relativePath]) || results[row.relativePath] === "Uploaded"} onChange={(event) => setSelections((current) => selectBrochure(current, row.relativePath, event.target.value, Boolean(event.target.value)))}>
                  <option value="">Choose {singular.toLowerCase()}</option>
                  {resorts.map((resort) => <option value={resort.id} key={resort.id}>{resort.name}{resort.hasBrochure ? " (replace)" : ""}</option>)}
                </select></td>
                <td>{results[row.relativePath] || (selection.accepted && resorts.find((resort) => resort.id === selection.resortId)?.hasBrochure
                  ? "Selected — replaces the existing brochure"
                  : !selection.accepted && selection.resortId && Object.values(selections).some((item) => item.accepted && item.resortId === selection.resortId)
                    ? "Skipped — another PDF is selected for this property"
                    : row.duplicate ? "Multiple PDFs in this folder — accept the one you want to use" : row.status)} {pendingPaths[row.relativePath] ? <button type="button" className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => discardPending(row)}>Discard staged PDF</button> : null}</td>
                <td><input type="checkbox" aria-label={`Accept ${row.name}`} checked={selection.accepted} disabled={invalid || !selection.resortId || busy || results[row.relativePath] === "Uploaded"} onChange={(event) => setSelections((current) => selectBrochure(current, row.relativePath, selection.resortId, event.target.checked))} /></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      ) : null}
      {rows.length > 50 ? <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn--ghost" disabled={page === 0 || busy} onClick={() => setPage((current) => current - 1)}>Previous</button>
        <span>Page {page + 1} of {Math.ceil(rows.length / 50)}</span>
        <button type="button" className="admin-btn admin-btn--ghost" disabled={(page + 1) * 50 >= rows.length || busy} onClick={() => setPage((current) => current + 1)}>Next</button>
      </div> : null}
      {rows.length ? <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn--secondary" disabled={busy || !acceptedCount} onClick={importAccepted}><UploadCloud className="admin-icon" /> {busy ? "Importing..." : "Import Accepted Brochures"}</button>
        <span className="field__help">{acceptedCount} brochures ready to import. Accepted PDFs replace existing brochures. Accepting another PDF for the same property deselects the previous choice.</span>
      </div> : null}
      {message ? <p role="status" className="field__help">{message}</p> : null}
    </section>
  );
}
