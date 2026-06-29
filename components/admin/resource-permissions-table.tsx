"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  deleteResourcePermissionAction,
  disableResourcePermissionAction,
  enableResourcePermissionAction
} from "@/app/admin/resource-permissions/actions";
import type { ResourcePermissionRecord } from "@/lib/services/resource-permission-service";

export function ResourcePermissionsTable({ permissions }: { permissions: ResourcePermissionRecord[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return permissions.filter((permission) => !needle || [permission.agencyName, permission.username, ...permission.resources.map((resource) => resource.title)].join(" ").toLowerCase().includes(needle));
  }, [permissions, query]);

  return <section className="stack admin-list-page">
    <div className="table-toolbar">
      <div className="table-toolbar-left"><label className="tbl-search"><Search className="admin-icon" /><input type="search" aria-label="Search resource permissions" placeholder="Search permissions..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><span className="tbl-count">{filtered.length} agents</span></div>
      <Link className="tbl-add" href="/admin/resource-permissions/new">+ Create Permission</Link>
    </div>

    {filtered.length ? <div className="admin-table-shell"><table className="table">
      <thead><tr><th>Agency</th><th>Username</th><th>Password</th><th>Resources</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{filtered.map((permission) => <tr key={permission.agentId}>
        <td><strong>{permission.agencyName}</strong></td>
        <td><code>{permission.username}</code></td>
        <td><code>{permission.passwordLabel}</code></td>
        <td><div className="admin-chip-row">{permission.resources.slice(0, 3).map((resource) => <span key={resource.id} className="admin-resource-chip">{resource.title}</span>)}{permission.resources.length > 3 ? <span className="admin-resource-chip">+{permission.resources.length - 3} more</span> : null}</div></td>
        <td><span className={`admin-status-badge ${permission.status === "disabled" ? "is-suspended" : "is-approved"}`}>{permission.status}</span></td>
        <td><div className="admin-row-actions">
          <Link href={`/admin/resource-permissions/${permission.agentId}/edit`} className="admin-btn admin-btn--secondary">Edit</Link>
          <form action={permission.status === "disabled" ? enableResourcePermissionAction : disableResourcePermissionAction}><input type="hidden" name="agentId" value={permission.agentId} /><button className="admin-btn admin-btn--ghost" type="submit">{permission.status === "disabled" ? "Enable" : "Disable"}</button></form>
          <form action={deleteResourcePermissionAction}><input type="hidden" name="agentId" value={permission.agentId} /><button className="admin-btn admin-btn--danger" type="submit">Delete</button></form>
        </div></td>
      </tr>)}</tbody>
    </table></div> : <div className="empty-state"><strong>No resource permissions found.</strong></div>}
  </section>;
}
