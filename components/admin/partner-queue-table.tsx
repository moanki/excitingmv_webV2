"use client";

import { Fragment, useMemo, useState } from "react";

import { createPartnerAction } from "@/app/admin/partners/actions";
import type { PartnerRequestRecord } from "@/lib/services/partner-service";
import type { PartnerStatus } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function PartnerQueueTable({ partners }: { partners: PartnerRequestRecord[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return partners.filter((partner) =>
      (filter === "all" || partner.status === filter) &&
      (!needle || [partner.contactName, partner.agencyName, partner.email, partner.market].join(" ").toLowerCase().includes(needle))
    );
  }, [filter, partners, query]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((partner) => selectedIds.includes(partner.id));

  async function updateStatus(ids: string[], status: PartnerStatus) {
    if (!ids.length) return;
    setPending(true);
    const response = await fetch("/api/admin/partners/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status })
    });
    setPending(false);
    if (response.ok) window.location.reload();
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function toggleAllVisible() {
    setSelectedIds((current) => allVisibleSelected
      ? current.filter((id) => !filtered.some((partner) => partner.id === id))
      : Array.from(new Set([...current, ...filtered.map((partner) => partner.id)])));
  }

  function download(ids?: string[]) {
    const suffix = ids?.length ? `?ids=${encodeURIComponent(ids.join(","))}` : "";
    window.location.href = `/api/admin/partners/export${suffix}`;
  }

  return (
    <div className="stack admin-list-page">
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <label className="tbl-search">
            <input type="search" aria-label="Search partners" placeholder="Search partners..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="resort-filter-pills" role="tablist" aria-label="Partner filters">
            {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([value, label]) => (
              <button key={value} type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value as typeof filter)}>{label}</button>
            ))}
          </div>
          <span className="tbl-count">{filtered.length} partners</span>
        </div>
        <div className="table-toolbar-right">
          <button type="button" className="admin-btn admin-btn--secondary" onClick={() => download()}>Export CSV</button>
          <button type="button" className="tbl-add" onClick={() => setShowAddPartner(true)}>+ Add Partner</button>
        </div>
      </div>

      {selectedIds.length ? (
        <div className="admin-bulk-bar">
          <strong>Selected: {selectedIds.length}</strong>
          <div className="admin-row-actions">
            <button type="button" className="admin-btn admin-btn--primary admin-btn--small" disabled={pending} onClick={() => updateStatus(selectedIds, "approved")}>Approve Selected</button>
            <button type="button" className="admin-btn admin-btn--danger admin-btn--small" disabled={pending} onClick={() => updateStatus(selectedIds, "rejected")}>Reject Selected</button>
          </div>
        </div>
      ) : null}

      <div className="admin-table-shell">
        <table className="table">
          <thead><tr><th className="admin-checkbox-cell"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all visible partners" /></th><th>Contact</th><th>Agency</th><th>Market</th><th>Status</th><th>Requested</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((partner) => {
              const isOpen = openId === partner.id;
              return <Fragment key={partner.id}>
                <tr>
                  <td className="admin-checkbox-cell"><input type="checkbox" checked={selectedIds.includes(partner.id)} onChange={() => toggleSelected(partner.id)} aria-label={`Select ${partner.agencyName}`} /></td>
                  <td><strong>{partner.contactName}</strong><div className="admin-table-subtle">{partner.email}</div></td>
                  <td>{partner.agencyName}</td><td>{partner.market || "-"}</td>
                  <td><span className={`admin-status-badge is-${partner.status}`}>{partner.status}</span></td>
                  <td>{formatDate(partner.createdAt)}</td>
                  <td><div className="admin-row-actions">
                    <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setOpenId(isOpen ? null : partner.id)}>Details</button>
                    {partner.status === "pending" ? <><button type="button" className="admin-btn admin-btn--primary" disabled={pending} onClick={() => updateStatus([partner.id], "approved")}>Approve</button><button type="button" className="admin-btn admin-btn--danger" disabled={pending} onClick={() => updateStatus([partner.id], "rejected")}>Reject</button></> : null}
                  </div></td>
                </tr>
                {isOpen ? <tr className="admin-detail-row"><td /><td colSpan={6}><div className="admin-inline-details"><strong>{partner.agencyName}</strong><p>{partner.notes || "No notes provided."}</p></div></td></tr> : null}
              </Fragment>;
            })}
          </tbody>
        </table>
      </div>

      {showAddPartner ? (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setShowAddPartner(false)}>
          <div className="admin-modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-partner-title" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header"><div><h3 id="add-partner-title">Add Partner</h3><p>Create a partner request for review.</p></div><button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowAddPartner(false)}>Close</button></div>
            <form action={createPartnerAction} className="form-grid">
              <label className="field"><span className="field__label">Contact Name</span><input className="admin-input" name="contactName" minLength={2} required /></label>
              <label className="field"><span className="field__label">Agency Name</span><input className="admin-input" name="agencyName" minLength={2} required /></label>
              <label className="field"><span className="field__label">Email</span><input className="admin-input" name="email" type="email" required /></label>
              <label className="field"><span className="field__label">Market</span><input className="admin-input" name="market" minLength={2} required /></label>
              <label className="field field--full"><span className="field__label">Notes</span><textarea className="admin-textarea" name="notes" /></label>
              <div className="admin-form-actions field--full"><button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowAddPartner(false)}>Cancel</button><button type="submit" className="admin-btn admin-btn--primary">Save Partner</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
