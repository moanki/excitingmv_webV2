"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { InlineSpinner } from "@/components/admin/action-feedback";
import { useAdminActionFeedback } from "@/components/admin/admin-action-feedback";
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
  const router = useRouter();
  const { finishAction, notifySuccess, startAction } = useAdminActionFeedback();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "acknowledged">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return submissions.filter((submission) => {
      const normalizedStatus = (submission.status || "new").toLowerCase();
      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && ["new", "pending"].includes(normalizedStatus)) ||
        (filter === "acknowledged" && ["general", "approved"].includes(normalizedStatus));
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
    notifySuccess("Newsletter export started.");
    const suffix = ids?.length ? `?ids=${encodeURIComponent(ids.join(","))}` : "";
    window.location.href = `/api/admin/newsletters/export${suffix}`;
  }

  async function acknowledge(ids: string[]) {
    if (!ids.length) {
      return;
    }

    const pendingKey = ids.join(",");
    const actionId = startAction({ title: "Acknowledging newsletter leads..." });
    setPendingAction(pendingKey);
    try {
      const response = await fetch("/api/admin/newsletters/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: "general" })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Failed to acknowledge newsletter leads.");
      finishAction(actionId, { title: "Newsletter leads acknowledged.", status: "success" });
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      finishAction(actionId, { title: error instanceof Error ? error.message : "Failed to acknowledge newsletter leads.", status: "error" });
    } finally {
      setPendingAction("");
    }
  }

  return (
    <div className="stack admin-list-page">
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <label className="tbl-search">
            <input
              type="search"
              aria-label="Search newsletter leads"
              placeholder="Search subscribers..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="resort-filter-pills" role="tablist" aria-label="Newsletter filters">
            {[
              ["all", "All"],
              ["pending", "Pending"],
              ["acknowledged", "Acknowledged"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? "is-active" : ""}
                onClick={() => setFilter(value as typeof filter)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="tbl-count">{filtered.length} subscribers</span>
        </div>
        <div className="table-toolbar-right">
          <button type="button" className="admin-btn admin-btn--secondary" onClick={() => acknowledge(filtered.map((item) => item.id))} disabled={!filtered.length || Boolean(pendingAction)}>
            {pendingAction === filtered.map((item) => item.id).join(",") ? <InlineSpinner /> : null}Acknowledge All
          </button>
          <button type="button" className="admin-btn admin-btn--primary" onClick={() => download()}>
            Export CSV
          </button>
        </div>
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
              {pendingAction === selectedIds.join(",") ? <InlineSpinner /> : null}Acknowledge Selected
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
              <th>Agency</th>
              <th>Source</th>
              <th>Date</th>
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
                </td>
                <td>{submission.fullName || "-"}</td>
                <td>{submission.agencyName || "-"}</td>
                <td>{submission.source || "-"}</td>
                <td>{formatDate(submission.createdAt)}</td>
                <td>
                  <span className={`admin-status-badge ${["general", "approved"].includes((submission.status || "new").toLowerCase()) ? "is-approved" : "is-pending"}`}>
                    {["general", "approved"].includes((submission.status || "new").toLowerCase()) ? "Acknowledged" : "New"}
                  </span>
                </td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      disabled={Boolean(pendingAction) || submission.status === "general"}
                      onClick={() => acknowledge([submission.id])}
                    >
                      {pendingAction === submission.id ? <InlineSpinner /> : null}Acknowledge
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      onClick={() => download([submission.id])}
                    >
                          CSV
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
