"use client";

import { useState, type ChangeEvent } from "react";
import { FileDown, UploadCloud } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { publicEnv } from "@/lib/public-env";
import { signedBrochureTusConfig } from "@/lib/brochure-import";

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

async function uploadBrochure(resortId: string, file: File, pendingPath = "") {
  if (pendingPath) {
    return brochureRequest<{ path: string; name: string }>({ mode: "attach", resortId, path: pendingPath });
  }
  const signed = await brochureRequest<{ bucket: string; path: string; token: string }>({
    mode: "sign", resortId, filename: file.name, size: file.size
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
      onError: reject,
      onSuccess: () => resolve()
    });
    upload.start();
  });
  try {
    return await brochureRequest<{ path: string; name: string }>({ mode: "attach", resortId, path: signed.path });
  } catch (error) {
    const pending = new Error(error instanceof Error ? error.message : "Could not attach uploaded PDF.") as PendingAttachmentError;
    pending.uploadedPath = signed.path;
    throw pending;
  }
}

function brochureUrl(path: string, name: string) {
  return createSupabaseBrowserClient().storage.from("resort-brochures").getPublicUrl(path, {
    download: `${name} Brochure.pdf`
  }).data.publicUrl;
}

export function BrochureUploadControl({ resortId, resortName, initialPath }: {
  resortId: string;
  resortName: string;
  initialPath: string;
}) {
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
      const attached = await uploadBrochure(resortId, file, pendingPath);
      setPath(attached.path);
      setPendingPath("");
      setFile(null);
      setMessage("Brochure uploaded and linked to this resort.");
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
      await brochureRequest({ mode: "remove", resortId });
      setPath("");
      setMessage("Brochure removed from this resort.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove brochure.");
    } finally {
      setBusy(false);
    }
  }

  async function discardPending() {
    setBusy(true);
    try {
      await brochureRequest({ mode: "discard", resortId, path: pendingPath });
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
      <span className="field__label">Resort Brochure (PDF)</span>
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

export function BrochureImportPanel() {
  const [page, setPage] = useState(0);
  const [files, setFiles] = useState<Map<string, File>>(new Map());
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [resorts, setResorts] = useState<ResortOption[]>([]);
  const [selections, setSelections] = useState<Record<string, { resortId: string; accepted: boolean }>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const [pendingPaths, setPendingPaths] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

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
        mode: "preview", files: selected.map((file) => ({ relativePath: file.webkitRelativePath, size: file.size }))
      });
      setRows(preview.rows);
      setResorts(preview.resorts);
      setSelections(Object.fromEntries(preview.rows.map((row) => [row.relativePath, {
        resortId: row.resortId,
        accepted: Boolean(row.resortId) && !row.duplicate
      }])));
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
      setMessage("Accept one PDF per resort and resolve any duplicate resort selections.");
      return;
    }
    setBusy(true);
    setMessage("");
    let uploaded = 0;
    for (const row of accepted) {
      const file = files.get(row.relativePath);
      if (!file) continue;
      try {
        await uploadBrochure(selections[row.relativePath].resortId, file, pendingPaths[row.relativePath]);
        setPendingPaths((current) => ({ ...current, [row.relativePath]: "" }));
        setResults((current) => ({ ...current, [row.relativePath]: "Uploaded" }));
        uploaded++;
      } catch (error) {
        const uploadedPath = (error as PendingAttachmentError).uploadedPath;
        if (uploadedPath) setPendingPaths((current) => ({ ...current, [row.relativePath]: uploadedPath }));
        setResults((current) => ({ ...current, [row.relativePath]: `${error instanceof Error ? error.message : "Upload failed"}${uploadedPath || pendingPaths[row.relativePath] ? " (retry attachment)" : ""}` }));
      }
    }
    setMessage(`${uploaded} of ${accepted.length} brochures uploaded. Review row results below.`);
    setBusy(false);
  }

  async function discardPending(row: PreviewRow) {
    const path = pendingPaths[row.relativePath];
    const resortId = selections[row.relativePath]?.resortId;
    if (!path || !resortId) return;
    setBusy(true);
    try {
      await brochureRequest({ mode: "discard", resortId, path });
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
        <h3 className="admin-form-section__title">Bulk Resort Brochure Import</h3>
        <p className="admin-form-section__help">Select ResortBrochure / Resort Name / file.pdf. Exact folder names match automatically; review other matches before import.</p>
      </div>
      <label className="field"><span className="field__label">Brochure folder</span><input className="admin-file-input" type="file" accept="application/pdf,.pdf" multiple {...{ webkitdirectory: "", directory: "" }} onChange={selectFolder} disabled={busy} /></label>
      {rows.length ? (
        <div className="table-scroll">
          <table className="admin-table">
            <thead><tr><th>PDF</th><th>Folder</th><th>Resort match</th><th>Status</th><th>Accept</th></tr></thead>
            <tbody>{rows.slice(page * 50, (page + 1) * 50).map((row) => {
              const selection = selections[row.relativePath] ?? { resortId: "", accepted: false };
              const invalid = !row.folder || !row.name.toLowerCase().endsWith(".pdf") || row.size <= 0;
              return <tr key={row.relativePath}>
                <td>{row.name}</td>
                <td>{row.folder || "Invalid path"}</td>
                <td><select className="admin-select" aria-label={`Resort for ${row.name}`} value={selection.resortId} disabled={invalid || busy || Boolean(pendingPaths[row.relativePath])} onChange={(event) => setSelections((current) => ({ ...current, [row.relativePath]: { resortId: event.target.value, accepted: false } }))}>
                  <option value="">Choose resort</option>
                  {resorts.map((resort) => <option value={resort.id} key={resort.id}>{resort.name}{resort.hasBrochure ? " (replace)" : ""}</option>)}
                </select></td>
                <td>{results[row.relativePath] || (row.duplicate ? "Multiple PDFs in folder; select one" : row.status)} {pendingPaths[row.relativePath] ? <button type="button" className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => discardPending(row)}>Discard staged PDF</button> : null}</td>
                <td><input type="checkbox" aria-label={`Accept ${row.name}`} checked={selection.accepted} disabled={invalid || !selection.resortId || busy || results[row.relativePath] === "Uploaded"} onChange={(event) => setSelections((current) => ({ ...current, [row.relativePath]: { ...selection, accepted: event.target.checked } }))} /></td>
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
      {rows.length ? <div className="admin-form-actions"><button type="button" className="admin-btn admin-btn--secondary" disabled={busy || !rows.some((row) => selections[row.relativePath]?.accepted && results[row.relativePath] !== "Uploaded")} onClick={importAccepted}><UploadCloud className="admin-icon" /> {busy ? "Importing..." : "Import Accepted Brochures"}</button></div> : null}
      {message ? <p role="status" className="field__help">{message}</p> : null}
    </section>
  );
}
