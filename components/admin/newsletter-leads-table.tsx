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
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return submissions.filter((submission) => {
      const normalizedStatus = (submission.status || "new").toLowerCase();
      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && ["new", "pending"].includes(normalizedStatus)) ||
        (filter === "approved" && ["general", "approved"].includes(normalizedStatus)) ||
        (filter === "rejected" && normalizedStatus === "rejected");
      const haystack = [
        submission.email,
        submission.fullName,
        submission.agencyName,
        submission.primaryMarket,
        submission.source
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [filter, query, submissions]);

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

  async function acknowledge(ids: string[]) {
    if (!ids.length) {
      return;
    }

    setPendingAction(ids.join(","));
    const response = await fetch("/api/admin/newsletters/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status: "general" })
    });
    setPendingAction("");

    if (response.ok) {
      window.location.reload();
    }
  }

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <label className="admin-search admin-search--large">
          <input
            className="admin-input"
            type="search"
            aria-label="Search newsletter leads"
            placeholder="Search Subscriber"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="admin-filter-pills admin-filter-pills--below">
        {[
          ["all", "All"],
          ["pending", "Pending"],
          ["approved", "Approved"],
          ["rejected", "Rejected"]
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "admin-filter-pill is-active" : "admin-filter-pill"}
            onClick={() => setFilter(value as typeof filter)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="admin-page-actions admin-page-actions--compact">
        <button type="button" className="admin-btn admin-btn--secondary admin-btn--small" onClick={toggleAllVisible}>
          {allVisibleSelected ? "Clear Visible" : "Select All Subscribers"}
        </button>
        <button type="button" className="admin-btn admin-btn--secondary admin-btn--small" onClick={() => download(selectedIds)} disabled={!selectedIds.length}>
          Download Selected
        </button>
        <button type="button" className="admin-btn admin-btn--secondary admin-btn--small" onClick={() => download()}>
          Download All
        </button>
        <button type="button" className="admin-btn admin-btn--primary admin-btn--small" onClick={() => acknowledge(filtered.map((item) => item.id))} disabled={!filtered.length || Boolean(pendingAction)}>
          Acknowledge All
        </button>
      </div>

      {selectedIds.length ? (
        <div className="admin-bulk-bar">
          <strong>Selected: {selectedIds.length}</strong>
          <div className="admin-bulk-actions">
            <button
              type="button"
              className="admin-btn admin-btn--primary admin-btn--small"
              disabled={Boolean(pendingAction)}
              onClick={() => acknowledge(selectedIds)}
            >
              Acknowledge Selected
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelectedIds([])}>
              Clear Selection
            </button>
          </div>
        </div>
      ) : null}

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
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      disabled={Boolean(pendingAction) || submission.status === "general"}
                      onClick={() => acknowledge([submission.id])}
                    >
                      Acknowledge
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      onClick={() => download([submission.id])}
                    >
                      Download CSV
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
