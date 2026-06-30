"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Eye, Pencil, Search, Trash2, X } from "lucide-react";

import { deleteResourceAction } from "@/app/admin/resources/actions";
import { ActionForm } from "@/components/admin/action-feedback";
import type { ResourceRecord } from "@/lib/services/resource-service";

export function ResourceLibraryTable({ resources }: { resources: ResourceRecord[] }) {
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<ResourceRecord | null>(null);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return resources.filter((resource) => !needle || [resource.title, resource.description, resource.resourceType].join(" ").toLowerCase().includes(needle));
  }, [query, resources]);

  return <div className="stack admin-list-page">
    <div className="table-toolbar">
      <div className="table-toolbar-left"><label className="tbl-search"><Search className="admin-icon" /><input type="search" aria-label="Search resources" placeholder="Search resources..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><span className="tbl-count">{filtered.length} resources</span></div>
      <Link className="tbl-add" href="/admin/resources/new">+ Upload Resource</Link>
    </div>

    <div className="admin-table-shell">
      <table className="table"><thead><tr><th>Resource Name</th><th>Type</th><th>File</th><th>Visibility</th><th>Uploaded</th><th>Actions</th></tr></thead>
        <tbody>{filtered.map((resource) => <tr key={resource.id}>
          <td><strong>{resource.title}</strong><div className="admin-table-subtle">{resource.description || "Partner resource"}</div></td>
          <td>{resource.resourceType || "Other"}</td>
          <td><button className="admin-link-button" type="button" onClick={() => setViewing(resource)}>View file</button></td>
          <td><div className="admin-chip-row"><span className={`admin-status-badge ${resource.status === "published" ? "is-approved" : resource.status === "archived" ? "is-suspended" : "is-pending"}`}>{resource.status === "published" ? "Active" : resource.status === "archived" ? "Disabled" : "Draft"}</span><span className="admin-resource-chip">{resource.audienceType === "selected_partners" ? "Selected Partners" : "All Partners"}</span></div></td>
          <td>{resource.createdAt ? new Date(resource.createdAt).toLocaleDateString("en") : "-"}</td>
          <td><div className="admin-row-actions"><button className="admin-icon-button" type="button" onClick={() => setViewing(resource)} aria-label={`View ${resource.title}`}><Eye className="admin-icon" /></button><Link className="admin-icon-button" href={`/admin/resources/${resource.id}/edit`} aria-label={`Edit ${resource.title}`}><Pencil className="admin-icon" /></Link><a className="admin-icon-button" href={resource.filePath} download aria-label={`Download ${resource.title}`}><Download className="admin-icon" /></a><ActionForm action={deleteResourceAction} hidden={{ id: resource.id }} idleLabel="" pendingLabel="" icon={<Trash2 className="admin-icon" />} variant="icon" buttonClassName="admin-icon-button--danger" ariaLabel={`Delete ${resource.title}`} confirmMessage={`Delete ${resource.title}?`} /></div></td>
        </tr>)}</tbody>
      </table>
    </div>

    {viewing ? <div className="admin-modal-backdrop" role="presentation" onClick={() => setViewing(null)}><div className="admin-modal-panel admin-modal-panel--wide" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="admin-modal-header"><div><h3>{viewing.title}</h3><p>{viewing.resourceType || "Resource"}</p></div><button className="admin-icon-button" type="button" aria-label="Close resource preview" onClick={() => setViewing(null)}><X className="admin-icon" /></button></div><div className="admin-resource-preview">{/\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i.test(viewing.filePath) ? <img src={viewing.filePath} alt={viewing.title} /> : /\.(mp4|webm|mov)(\?|#|$)/i.test(viewing.filePath) ? <video src={viewing.filePath} controls /> : <iframe src={viewing.filePath} title={viewing.title} />}</div></div></div> : null}
  </div>;
}
