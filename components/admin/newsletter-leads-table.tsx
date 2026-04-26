"use client";

import { useMemo, useState } from "react";

import type { NewsletterRecord } from "@/lib/services/newsletter-service";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

type Props = {
  submissions: NewsletterRecord[];
};

export function NewsletterLeadsTable({ submissions }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return submissions.filter((submission) => {
      const haystack = [
        submission.email,
        submission.fullName,
        submission.agencyName,
        submission.primaryMarket,
        submission.source
      ]
        .join(" ")
        .toLowerCase();

      return !normalized || haystack.includes(normalized);
    });
  }, [query, submissions]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((submission) => selectedIds.includes(submission.id));

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !filtered.some((submission) => submission.id === id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...filtered.map((submission) => submission.id)])));
  }

  function download(ids?: string[]) {
    const suffix = ids?.length ? `?ids=${encodeURIComponent(ids.join(","))}` : "";
    window.location.href = `/api/admin/newsletters/export${suffix}`;
  }

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <label className="admin-search">
          <span className="sr-only">Search newsletter leads</span>
          <input
            className="admin-input"
            type="search"
            placeholder="Search leads..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {selectedIds.length ? (
        <div className="admin-bulk-bar">
          <strong>Selected: {selectedIds.length}</strong>
          <div className="admin-bulk-actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => download(selectedIds)}>
              Download Selected
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelectedIds([])}>
              Clear Selection
            </button>
          </div>
        </div>
      ) : null}

      <div className="admin-page-actions">
        <button type="button" className="admin-btn admin-btn--secondary" onClick={toggleAllVisible}>
          {allVisibleSelected ? "Clear Visible" : "Select All"}
        </button>
        <button type="button" className="admin-btn admin-btn--secondary" onClick={() => download()}>
          Download All
        </button>
      </div>

      <div className="admin-table-shell">
        <table className="table">
          <thead>
            <tr>
              <th className="admin-checkbox-cell">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all visible leads" />
              </th>
              <th>Email</th>
              <th>Name</th>
              <th>Source</th>
              <th>Subscription Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((submission) => (
              <tr key={submission.id}>
                <td className="admin-checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(submission.id)}
                    onChange={() => toggleSelected(submission.id)}
                    aria-label={`Select ${submission.email}`}
                  />
                </td>
                <td>
                  <strong>{submission.email}</strong>
                  {submission.agencyName ? <div className="admin-table-subtle">{submission.agencyName}</div> : null}
                </td>
                <td>{submission.fullName || "-"}</td>
                <td>{submission.source || "-"}</td>
                <td>{formatDate(submission.createdAt)}</td>
                <td>
                  <span className={`admin-status-badge is-neutral`}>{submission.status || "new"}</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary"
                    onClick={() => download([submission.id])}
                  >
                    Download CSV
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
