import Link from "next/link";
import { KeyRound, Pencil, Trash2 } from "lucide-react";

import { deleteResourcePermissionAction, disableResourcePermissionAction } from "@/app/admin/resource-permissions/actions";
import { listResourcePermissions } from "@/lib/services/resource-permission-service";

export default async function AdminResourcePermissionsPage() {
  const permissions = await listResourcePermissions();

  return (
    <section className="stack">
      <div className="table-toolbar">
        <div className="table-toolbar-left"><span className="tbl-count">{permissions.length} partners with access</span></div>
        <Link className="tbl-add" href="/admin/resource-permissions/new">+ Grant Access</Link>
      </div>

      {permissions.length ? (
        <div className="data-list permission-data-list">
          <div className="list-head permission-list-grid" aria-hidden="true"><span>Partner</span><span>Documents accessible</span><span>Password</span><span>Status</span><span>Actions</span></div>
          {permissions.map((permission) => (
            <article className="list-row permission-list-grid permission-list-row" key={permission.agentId}>
              <div className="lr-info"><div className="lr-name">{permission.agencyName}</div><div className="lr-cat">{permission.username}</div></div>
              <div className="admin-chip-row">
                {permission.resources.slice(0, 2).map((resource) => <span key={resource.id} className="lr-tag">{resource.title}</span>)}
                {permission.resources.length > 2 ? <span className="lr-tag lr-tag-featured">+{permission.resources.length - 2} more</span> : null}
                {!permission.resources.length ? <span className="lr-updated">No documents</span> : null}
              </div>
              <div className="permission-password"><KeyRound className="admin-icon" /> Managed securely</div>
              <div><span className={`admin-status-badge ${permission.status === "disabled" ? "is-suspended" : "is-approved"}`}>{permission.status}</span></div>
              <div className="lr-actions">
                <Link href={`/admin/resource-permissions/${permission.agentId}/edit`} className="act-btn" aria-label={`Edit ${permission.agencyName}`}><Pencil className="admin-icon" /></Link>
                <form action={disableResourcePermissionAction}><input type="hidden" name="agentId" value={permission.agentId} /><button className="act-btn" type="submit" aria-label={`Disable ${permission.agencyName}`}><KeyRound className="admin-icon" /></button></form>
                <form action={deleteResourcePermissionAction}><input type="hidden" name="agentId" value={permission.agentId} /><button className="act-btn act-btn-danger" type="submit" aria-label={`Revoke ${permission.agencyName}`}><Trash2 className="admin-icon" /></button></form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No resource permissions created yet.</strong>
        </div>
      )}
    </section>
  );
}
