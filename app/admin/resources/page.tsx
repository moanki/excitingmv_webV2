import Link from "next/link";

import { deleteResourceAction } from "@/app/admin/resources/actions";
import { listResources } from "@/lib/services/resource-service";

export default async function AdminResourcesPage() {
  const resources = await listResources();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <h1 className="section-title">Resource Library</h1>
        </div>
        <div className="admin-page-header__actions">
          <Link className="admin-btn admin-btn--primary" href="/admin/resources/new">
            + Add Resource
          </Link>
        </div>
      </div>

      {resources.length ? (
        <div className="admin-table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Type</th>
                <th>File / URL</th>
                <th>Visibility / Status</th>
                <th>Uploaded Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>{resource.title}</td>
                  <td>{resource.resourceType || "Other"}</td>
                  <td>
                    <a href={resource.filePath} target="_blank" rel="noreferrer">
                      View file
                    </a>
                  </td>
                  <td>
                    <div className="admin-chip-row">
                      <span className={`admin-status-badge ${resource.status === "published" ? "is-approved" : resource.status === "archived" ? "is-suspended" : "is-pending"}`}>
                        {resource.status === "published" ? "Active" : resource.status === "archived" ? "Disabled" : "Draft"}
                      </span>
                      <span className="admin-resource-chip">
                        {resource.audienceType === "selected_partners" ? "Selected Partners" : "All Partners"}
                      </span>
                    </div>
                  </td>
                  <td>{resource.createdAt ? new Date(resource.createdAt).toLocaleDateString("en") : "-"}</td>
                  <td>
                    <div className="admin-row-actions">
                      <a className="admin-btn admin-btn--ghost" href={resource.filePath} target="_blank" rel="noreferrer">
                        View
                      </a>
                      <Link className="admin-btn admin-btn--secondary" href={`/admin/resources/${resource.id}/edit`}>
                        Edit
                      </Link>
                      <a className="admin-btn admin-btn--secondary" href={resource.filePath} download>
                        Download
                      </a>
                      <form action={deleteResourceAction}>
                        <input type="hidden" name="id" value={resource.id} />
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
          <strong>No resources uploaded yet.</strong>
        </div>
      )}
    </section>
  );
}
