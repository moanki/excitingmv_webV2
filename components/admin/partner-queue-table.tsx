"use client";

import { useMemo, useState } from "react";
import { Check, Eye, Search, X } from "lucide-react";

import type { PartnerRequestRecord } from "@/lib/services/partner-service";
import type { PartnerStatus } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function PartnerQueueTable({ partners }: { partners: PartnerRequestRecord[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return partners.filter((partner) =>
      (filter === "all" || partner.status === filter) &&
      (!needle || [partner.contactName, partner.agencyName, partner.email, partner.market].join(" ").toLowerCase().includes(needle))
    );
  }, [filter, partners, query]);

  async function updateStatus(id: string, status: PartnerStatus) {
    setPendingId(id);
    const response = await fetch("/api/admin/partners/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id], status })
    });
    setPendingId("");
    if (response.ok) window.location.reload();
  }

  const counts = {
    total: partners.length,
    approved: partners.filter((partner) => partner.status === "approved").length,
    pending: partners.filter((partner) => partner.status === "pending").length,
    rejected: partners.filter((partner) => partner.status === "rejected").length
  };

  return (
    <div className="stack admin-list-page">
      <div className="stat-grid partner-stat-grid">
        {[["Total Requests", counts.total], ["Approved", counts.approved], ["Pending Review", counts.pending], ["Declined", counts.rejected]].map(([label, value]) => (
          <div className="stat-card cms-stat-card" key={label}><p className="stat-label">{label}</p><strong className="stat-num">{value}</strong></div>
        ))}
      </div>

      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <label className="tbl-search">
            <Search className="admin-icon" />
            <input type="search" aria-label="Search partners" placeholder="Search by name, company or market..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="resort-filter-pills" aria-label="Partner filters">
            {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Declined"]].map(([value, label]) => (
              <button key={value} type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value as typeof filter)}>{label}</button>
            ))}
          </div>
          <span className="tbl-count">Showing {filtered.length} of {partners.length}</span>
        </div>
      </div>

      <div className="data-list partner-data-list">
        <div className="list-head partner-list-grid" aria-hidden="true"><span>Applicant</span><span>Company / Market</span><span>Submitted</span><span>Status</span><span>Actions</span></div>
        {filtered.map((partner) => (
          <div key={partner.id}>
            <article className="list-row partner-list-grid partner-list-row">
              <div className="lr-info"><div className="lr-name">{partner.contactName}</div><div className="lr-cat">{partner.email}</div></div>
              <div><strong>{partner.agencyName}</strong><div className="admin-table-subtle">{partner.market || "Not provided"}</div></div>
              <div className="lr-updated">{formatDate(partner.createdAt)}</div>
              <div><span className={`admin-status-badge is-${partner.status}`}>{partner.status === "rejected" ? "declined" : partner.status}</span></div>
              <div className="lr-actions">
                <button className="act-btn" type="button" aria-label={`View ${partner.agencyName}`} onClick={() => setOpenId(openId === partner.id ? null : partner.id)}><Eye className="admin-icon" /></button>
                {partner.status === "pending" ? <>
                  <button className="act-btn" type="button" aria-label={`Approve ${partner.agencyName}`} disabled={pendingId === partner.id} onClick={() => updateStatus(partner.id, "approved")}><Check className="admin-icon" /></button>
                  <button className="act-btn act-btn-danger" type="button" aria-label={`Decline ${partner.agencyName}`} disabled={pendingId === partner.id} onClick={() => updateStatus(partner.id, "rejected")}><X className="admin-icon" /></button>
                </> : null}
              </div>
            </article>
            {openId === partner.id ? <div className="partner-inline-details"><strong>{partner.agencyName}</strong><span>{partner.email}</span><span>{partner.notes || "No notes provided."}</span></div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
