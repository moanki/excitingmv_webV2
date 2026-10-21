"use client";

import { useState, type ChangeEvent } from "react";
import { Download, UploadCloud } from "lucide-react";

import type { ResortMapPreviewRow } from "@/lib/resort-map-csv";

type RowResult = { index: number; status: "updated" | "failed"; detail: string };

export function ResortMapImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ResortMapPreviewRow[]>([]);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<Record<number, RowResult>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setRows([]);
    setPage(0);
    setSelected(new Set());
    setResults({});
    setError("");
    setMessage("");
  }

  async function requestImport(mode: "preview" | "apply", indexes: number[] = []) {
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.set("mode", mode);
      form.set("file", file);
      if (mode === "apply") form.set("selected", JSON.stringify(indexes));
      const response = await fetch("/api/admin/resort-locations", { method: "POST", body: form });
      const payload = await response.json() as {
        ok?: boolean;
        error?: string;
        rows?: ResortMapPreviewRow[];
        results?: RowResult[];
      };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Resort map import failed.");

      if (mode === "preview") {
        setRows(payload.rows ?? []);
        setPage(0);
        setSelected(new Set());
        setResults({});
        setMessage(payload.rows?.length ? `${payload.rows.length} location rows reviewed. Blank template rows were skipped.` : "No locations found in this CSV.");
      } else {
        const nextResults = Object.fromEntries((payload.results ?? []).map((result) => [result.index, result]));
        setResults((current) => ({ ...current, ...nextResults }));
        setSelected(new Set());
        const updated = (payload.results ?? []).filter((result) => result.status === "updated").length;
        const failed = (payload.results ?? []).length - updated;
        setMessage(`${updated} resort maps updated${failed ? `, ${failed} failed` : ""}. Review the row results below.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Resort map import failed.");
    } finally {
      setBusy(false);
    }
  }

  const ready = rows.filter((row) => row.status === "ready" && results[row.index]?.status !== "updated");
  const selectedReady = ready.filter((row) => selected.has(row.index));

  return (
    <section className="admin-form-card stack" aria-label="Bulk resort map import">
      <div className="admin-form-section__header">
        <h3 className="admin-form-section__title">Bulk Resort Map Import</h3>
        <p className="admin-form-section__help">Match by exact resort slug. For Google Maps, use Share &gt; Embed a map &gt; Copy HTML; otherwise enter latitude and longitude.</p>
      </div>
      <div className="admin-form-actions">
        <a className="admin-btn admin-btn--secondary" href="/api/admin/resort-locations">
          <Download className="admin-icon" /> Download Resort CSV
        </a>
      </div>
      <label className="field">
        <span className="field__label">Completed Resort CSV</span>
        <input className="admin-file-input" type="file" accept=".csv,text/csv" onChange={selectFile} disabled={busy} />
      </label>
      <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn--secondary" disabled={!file || busy} onClick={() => requestImport("preview")}>Preview Locations</button>
        {rows.length ? (
          <button type="button" className="admin-btn admin-btn--primary" disabled={busy || !selectedReady.length} onClick={() => requestImport("apply", selectedReady.map((row) => row.index))}>
            <UploadCloud className="admin-icon" /> {busy ? "Updating..." : `Apply Selected (${selectedReady.length})`}
          </button>
        ) : null}
      </div>
      {error ? <p className="admin-alert admin-alert--error" role="alert">{error}</p> : null}
      {message ? <p className="admin-alert admin-alert--success" role="status">{message}</p> : null}
      {rows.length ? (
        <p className="field__help" role="status">{ready.length} ready to select; {rows.filter((row) => row.status === "unchanged").length} unchanged; {rows.filter((row) => !["ready", "unchanged"].includes(row.status)).length} need correction.</p>
      ) : null}
      {rows.length ? (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all ready resort maps"
                    checked={ready.length > 0 && ready.every((row) => selected.has(row.index))}
                    disabled={!ready.length || busy}
                    onChange={(event) => setSelected(event.target.checked ? new Set(ready.map((row) => row.index)) : new Set())}
                  />
                </th>
                <th>CSV row</th>
                <th>Resort match</th>
                <th>Current</th>
                <th>New location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(page * 50, (page + 1) * 50).map((row) => {
                const result = results[row.index];
                const selectable = row.status === "ready" && result?.status !== "updated";
                return (
                  <tr key={row.index}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Accept map for ${row.slug || `CSV row ${row.index}`}`}
                        checked={selected.has(row.index)}
                        disabled={!selectable || busy}
                        onChange={(event) => setSelected((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(row.index);
                          else next.delete(row.index);
                          return next;
                        })}
                      />
                    </td>
                    <td>{row.index}</td>
                    <td><strong>{row.resortName || "No match"}</strong><br /><span>{row.slug || "Missing slug"}</span></td>
                    <td>{row.current}</td>
                    <td>{row.mapEmbedUrl ? "Google Maps embed" : row.latitude !== null && row.longitude !== null ? `${row.latitude}, ${row.longitude}` : "Invalid location"}</td>
                    <td>{result ? `${result.status}: ${result.detail}` : `${row.status}: ${row.detail}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      {rows.length > 50 ? (
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn--ghost" disabled={page === 0 || busy} onClick={() => setPage((current) => current - 1)}>Previous</button>
          <span>Page {page + 1} of {Math.ceil(rows.length / 50)}</span>
          <button type="button" className="admin-btn admin-btn--ghost" disabled={(page + 1) * 50 >= rows.length || busy} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      ) : null}
    </section>
  );
}
