"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Eye, Trash2, X } from "lucide-react";

import { deleteResourceAction } from "@/app/admin/resources/actions";
import type { ResourceRecord } from "@/lib/services/resource-service";

export function ResourceLibraryTable({ resources }: { resources: ResourceRecord[] }) {
  const [viewing, setViewing] = useState<ResourceRecord | null>(null);

  return (
    <>
      <div className="admin-table-shell admin-table-shell--top">
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
                  <button className="admin-link-button" type="button" onClick={() => setViewing(resource)}>
                    View file
                  </button>
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
                    <button className="admin-icon-button" type="button" onClick={() => setViewing(resource)} aria-label={`View ${resource.title}`}>
                      <Eye className="admin-icon" />
                    </button>
                    <Link className="admin-btn admin-btn--secondary" href={`/admin/resources/${resource.id}/edit`}>
                      Edit
                    </Link>
                    <a className="admin-icon-button" href={resource.filePath} download aria-label={`Download ${resource.title}`}>
                      <Download className="admin-icon" />
                    </a>
                    <form action={deleteResourceAction}>
                      <input type="hidden" name="id" value={resource.id} />
                      <button className="admin-icon-button admin-icon-button--danger" type="submit" aria-label={`Delete ${resource.title}`}>
                        <Trash2 className="admin-icon" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing ? (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setViewing(null)}>
          <div className="admin-modal-panel admin-modal-panel--wide" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>{viewing.title}</h3>
                <p>{viewing.resourceType || "Resource"}</p>
              </div>
              <button className="admin-icon-button" type="button" aria-label="Close resource preview" onClick={() => setViewing(null)}>
                <X className="admin-icon" />
              </button>
            </div>
            <div className="admin-resource-preview">
              {/\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i.test(viewing.filePath) ? (
                <img src={viewing.filePath} alt={viewing.title} />
              ) : /\.(mp4|webm|mov)(\?|#|$)/i.test(viewing.filePath) ? (
                <video src={viewing.filePath} controls />
              ) : (
                <iframe src={viewing.filePath} title={viewing.title} />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
