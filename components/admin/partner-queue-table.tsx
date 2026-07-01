"use client";

import { Fragment, useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createPartnerAction } from "@/app/admin/partners/actions";
import { ActionMessage, InlineSpinner, SubmitButton } from "@/components/admin/action-feedback";
import { useAdminActionFeedback } from "@/components/admin/admin-action-feedback";
import type { PartnerRequestRecord } from "@/lib/services/partner-service";
import type { PartnerStatus } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function PartnerQueueTable({ partners }: { partners: PartnerRequestRecord[] }) {
  const router = useRouter();
  const { notifySuccess, startAction } = useAdminActionFeedback();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PartnerStatus>();
  const [feedback, setFeedback] = useState<{ message?: string; error?: string }>();
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [createState, createAction] = useActionState(createPartnerAction, undefined);

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
    startAction({ title: status === "approved" ? "Approving partner request..." : "Rejecting partner request..." });
    setPendingAction(status);
    setFeedback(undefined);
    try {
      const response = await fetch("/api/admin/partners/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? `Failed to ${status} partner request.`);
      setFeedback({ message: `${ids.length} partner request${ids.length === 1 ? "" : "s"} ${status}.` });
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Failed to update partner request." });
    } finally {
      setPendingAction(undefined);
    }
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
    notifySuccess("Partner export started.");
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

      <ActionMessage state={feedback} />

      {selectedIds.length ? (
        <div className="admin-bulk-bar">
          <strong>Selected: {selectedIds.length}</strong>
          <div className="admin-row-actions">
            <button type="button" className="admin-btn admin-btn--primary admin-btn--small" disabled={Boolean(pendingAction)} onClick={() => updateStatus(selectedIds, "approved")}>{pendingAction === "approved" ? <><InlineSpinner />Approving...</> : "Approve Selected"}</button>
            <button type="button" className="admin-btn admin-btn--danger admin-btn--small" disabled={Boolean(pendingAction)} onClick={() => updateStatus(selectedIds, "rejected")}>{pendingAction === "rejected" ? <><InlineSpinner />Rejecting...</> : "Reject Selected"}</button>
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
                    {partner.status === "pending" ? <><button type="button" className="admin-btn admin-btn--primary" disabled={Boolean(pendingAction)} onClick={() => updateStatus([partner.id], "approved")}>{pendingAction === "approved" ? <><InlineSpinner />Approving...</> : "Approve"}</button><button type="button" className="admin-btn admin-btn--danger" disabled={Boolean(pendingAction)} onClick={() => updateStatus([partner.id], "rejected")}>{pendingAction === "rejected" ? <><InlineSpinner />Rejecting...</> : "Reject"}</button></> : null}
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
            <form action={createAction} className="form-grid">
              <label className="field"><span className="field__label">Contact Name</span><input className="admin-input" name="contactName" minLength={2} required /></label>
              <label className="field"><span className="field__label">Agency Name</span><input className="admin-input" name="agencyName" minLength={2} required /></label>
              <label className="field"><span className="field__label">Email</span><input className="admin-input" name="email" type="email" required /></label>
              <label className="field"><span className="field__label">Market</span><input className="admin-input" name="market" minLength={2} required /></label>
              <label className="field field--full"><span className="field__label">Notes</span><textarea className="admin-textarea" name="notes" /></label>
              <div className="admin-form-actions field--full"><button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowAddPartner(false)}>Cancel</button><SubmitButton idleLabel="Save Partner" pendingLabel="Saving Partner..." /></div>
              <div className="field--full"><ActionMessage state={createState} /></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
