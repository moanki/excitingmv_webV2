"use client";

import { Fragment, useMemo, useState } from "react";

import type { PartnerRequestRecord } from "@/lib/services/partner-service";
import type { PartnerStatus } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

type Props = {
  partners: PartnerRequestRecord[];
};

export function PartnerQueueTable({ partners }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string>("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return partners.filter((partner) => {
      const matchesFilter = filter === "all" ? true : partner.status === filter;
      const haystack = [partner.agencyName, partner.contactName, partner.email, partner.market].join(" ").toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [filter, partners, query]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((partner) => selectedIds.includes(partner.id));

  async function updateStatus(ids: string[], status: PartnerStatus) {
    if (!ids.length) {
      return;
    }

    setPendingAction(`${status}:${ids.join(",")}`);
    const response = await fetch("/api/admin/partners/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status })
    });

    setPendingAction("");
    if (response.ok) {
      window.location.reload();
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !filtered.some((partner) => partner.id === id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...filtered.map((partner) => partner.id)])));
  }

  function download(ids?: string[]) {
    const suffix = ids?.length ? `?ids=${encodeURIComponent(ids.join(","))}` : "";
    window.location.href = `/api/admin/partners/export${suffix}`;
  }

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <label className="admin-search">
          <span className="sr-only">Search partners</span>
          <input
            className="admin-input"
            type="search"
            placeholder="Search partners..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="admin-filter-pills">
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
      </div>

      {selectedIds.length ? (
        <div className="admin-bulk-bar">
          <strong>Selected: {selectedIds.length}</strong>
          <div className="admin-bulk-actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => download(selectedIds)}>
              Download Selected
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={Boolean(pendingAction)}
              onClick={() => updateStatus(selectedIds, "approved")}
            >
              Approve Selected
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              disabled={Boolean(pendingAction)}
              onClick={() => updateStatus(selectedIds, "rejected")}
            >
              Reject Selected
            </button>
          </div>
        </div>
      ) : null}

      <div className="admin-page-actions">
        <button type="button" className="admin-btn admin-btn--secondary" onClick={toggleAllVisible}>
          {allVisibleSelected ? "Clear Visible" : "Select All Partners"}
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
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all visible partners" />
              </th>
              <th>Name</th>
              <th>Company / Agency</th>
              <th>Status</th>
              <th>Requested Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((partner) => {
              const isSelected = selectedIds.includes(partner.id);
              const isOpen = openId === partner.id;
              return (
                <Fragment key={partner.id}>
                  <tr>
                    <td className="admin-checkbox-cell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(partner.id)}
                        aria-label={`Select ${partner.agencyName}`}
                      />
                    </td>
                    <td>
                      <strong>{partner.contactName}</strong>
                      <div className="admin-table-subtle">{partner.email}</div>
                    </td>
                    <td>{partner.agencyName}</td>
                    <td>
                      <span className={`admin-status-badge is-${partner.status}`}>{partner.status}</span>
                    </td>
                    <td>{formatDate(partner.createdAt)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() => setOpenId(isOpen ? null : partner.id)}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--primary"
                          disabled={Boolean(pendingAction)}
                          onClick={() => updateStatus([partner.id], "approved")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          disabled={Boolean(pendingAction)}
                          onClick={() => updateStatus([partner.id], "rejected")}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary"
                          onClick={() => download([partner.id])}
                        >
                          Download Details CSV
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="admin-detail-row">
                      <td />
                      <td colSpan={5}>
                        <div className="admin-inline-details">
                          <div className="admin-detail-grid">
                            <div>
                              <span>Agency</span>
                              <strong>{partner.agencyName}</strong>
                            </div>
                            <div>
                              <span>Contact</span>
                              <strong>{partner.contactName}</strong>
                            </div>
                            <div>
                              <span>Email</span>
                              <strong>{partner.email}</strong>
                            </div>
                            <div>
                              <span>Market</span>
                              <strong>{partner.market || "Not provided"}</strong>
                            </div>
                          </div>
                          {partner.notes ? <p className="admin-detail-notes">{partner.notes}</p> : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
