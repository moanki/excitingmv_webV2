"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Eye, FileText, Pencil, Search, Trash2, X } from "lucide-react";

import { deleteResourceAction } from "@/app/admin/resources/actions";
import type { ResourceRecord } from "@/lib/services/resource-service";

export function ResourceLibraryTable({ resources }: { resources: ResourceRecord[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [viewing, setViewing] = useState<ResourceRecord | null>(null);
  const types = Array.from(new Set(resources.map((resource) => resource.resourceType).filter(Boolean))).sort();
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return resources.filter((resource) =>
      (type === "all" || resource.resourceType === type) &&
      (!needle || [resource.title, resource.description, resource.resourceType].join(" ").toLowerCase().includes(needle))
    );
  }, [query, resources, type]);

  return (
    <div className="stack admin-list-page">
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <label className="tbl-search"><Search className="admin-icon" /><input type="search" placeholder="Search documents..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <select className="admin-select compact-filter" aria-label="Resource type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">All Types</option>
            {types.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
          <span className="tbl-count">{filtered.length} documents</span>
        </div>
        <Link className="tbl-add" href="/admin/resources/new">+ Upload Document</Link>
      </div>

      <div className="data-list resource-data-list">
        <div className="list-head resource-list-grid" aria-hidden="true"><span>Document</span><span>Type</span><span>Access</span><span>Uploaded</span><span>Actions</span></div>
        {filtered.map((resource) => (
          <article className="list-row resource-list-grid resource-list-row" key={resource.id}>
            <div className="resource-document"><span className="resource-file-icon"><FileText className="admin-icon" /></span><div className="lr-info"><div className="lr-name">{resource.title}</div><div className="lr-cat">{resource.description || "Partner resource"}</div></div></div>
            <strong className="resource-type">{resource.resourceType || "Other"}</strong>
            <div className="admin-chip-row"><span className={`admin-status-badge ${resource.status === "published" ? "is-approved" : resource.status === "archived" ? "is-suspended" : "is-pending"}`}>{resource.status === "published" ? "Active" : resource.status}</span><span className="lr-tag">{resource.audienceType === "selected_partners" ? "Selected" : "All Partners"}</span></div>
            <div className="lr-updated">{resource.createdAt ? new Date(resource.createdAt).toLocaleDateString("en") : "-"}</div>
            <div className="lr-actions">
              <button className="act-btn" type="button" onClick={() => setViewing(resource)} aria-label={`View ${resource.title}`}><Eye className="admin-icon" /></button>
              <Link className="act-btn" href={`/admin/resources/${resource.id}/edit`} aria-label={`Edit ${resource.title}`}><Pencil className="admin-icon" /></Link>
              <a className="act-btn" href={resource.filePath} download aria-label={`Download ${resource.title}`}><Download className="admin-icon" /></a>
              <form action={deleteResourceAction}><input type="hidden" name="id" value={resource.id} /><button className="act-btn act-btn-danger" type="submit" aria-label={`Delete ${resource.title}`}><Trash2 className="admin-icon" /></button></form>
            </div>
          </article>
        ))}
      </div>

      {viewing ? <div className="admin-modal-backdrop" role="presentation" onClick={() => setViewing(null)}><div className="admin-modal-panel admin-modal-panel--wide" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="admin-modal-header"><div><h3>{viewing.title}</h3><p>{viewing.resourceType || "Resource"}</p></div><button className="admin-icon-button" type="button" aria-label="Close resource preview" onClick={() => setViewing(null)}><X className="admin-icon" /></button></div><div className="admin-resource-preview">{/\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i.test(viewing.filePath) ? <img src={viewing.filePath} alt={viewing.title} /> : /\.(mp4|webm|mov)(\?|#|$)/i.test(viewing.filePath) ? <video src={viewing.filePath} controls /> : <iframe src={viewing.filePath} title={viewing.title} />}</div></div></div> : null}
    </div>
  );
}
