import Link from "next/link";

import { deleteResourcePermissionAction, disableResourcePermissionAction } from "@/app/admin/resource-permissions/actions";
import { listResourcePermissions } from "@/lib/services/resource-permission-service";

export default async function AdminResourcePermissionsPage() {
  const permissions = await listResourcePermissions();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <h1 className="section-title">Resource Permissions</h1>
        </div>
        <div className="admin-page-header__actions">
          <Link className="admin-btn admin-btn--primary" href="/admin/resource-permissions/new">
            + Create Permission
          </Link>
        </div>
      </div>

      {permissions.length ? (
        <div className="admin-table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Partner Agency Name</th>
                <th>Username</th>
                <th>Password</th>
                <th>Resources</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.agentId}>
                  <td>{permission.agencyName}</td>
                  <td>{permission.username}</td>
                  <td>{permission.passwordLabel}</td>
                  <td>
                    <div className="admin-chip-row">
                      {permission.resources.slice(0, 3).map((resource) => (
                        <span key={resource.id} className="admin-resource-chip">
                          {resource.title}
                        </span>
                      ))}
                      {permission.resources.length > 3 ? (
                        <span className="admin-resource-chip">+{permission.resources.length - 3} more</span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${permission.status === "disabled" ? "is-suspended" : "is-approved"}`}>
                      {permission.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link href={`/admin/resource-permissions/${permission.agentId}/edit`} className="admin-btn admin-btn--secondary">
                        Edit
                      </Link>
                      <form action={disableResourcePermissionAction}>
                        <input type="hidden" name="agentId" value={permission.agentId} />
                        <button className="admin-btn admin-btn--ghost" type="submit">
                          Disable
                        </button>
                      </form>
                      <form action={deleteResourcePermissionAction}>
                        <input type="hidden" name="agentId" value={permission.agentId} />
                        <button className="admin-btn admin-btn--danger" type="submit">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <strong>No resource permissions created yet.</strong>
        </div>
      )}
    </section>
  );
}
