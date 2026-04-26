import type { ResourceRecord } from "@/lib/services/resource-service";
import type { ResourcePermissionRecord } from "@/lib/services/resource-permission-service";

import { saveResourcePermissionAction } from "@/app/admin/resource-permissions/actions";

type Props = {
  permission?: ResourcePermissionRecord | null;
  resources: ResourceRecord[];
};

export function ResourcePermissionForm({ permission, resources }: Props) {
  const selected = new Set(permission?.resources.map((resource) => resource.id) ?? []);

  return (
    <form action={saveResourcePermissionAction} className="stack admin-form-card">
      {permission ? <input type="hidden" name="agentId" value={permission.agentId} /> : null}

      <section className="admin-form-section">
        <div className="admin-form-section__header">
          <h3 className="admin-form-section__title">Partner Access</h3>
          <p className="admin-form-section__help">Assign published resources to a partner login identity.</p>
        </div>
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Partner Agency Name</span>
            <input className="admin-input" name="agencyName" defaultValue={permission?.agencyName ?? ""} />
          </label>
          <label className="field">
            <span className="field__label">Username</span>
            <input className="admin-input" name="username" type="email" defaultValue={permission?.username ?? ""} />
          </label>
          <label className="field">
            <span className="field__label">Password</span>
            <input className="admin-input" name="password" type="text" placeholder="Managed separately" />
            <p className="field__help">Partner passwords are not exposed here. This workspace manages resource access only.</p>
          </label>
          <label className="field">
            <span className="field__label">Status</span>
            <select className="admin-select" name="status" defaultValue={permission?.status ?? "active"}>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-section__header">
          <h3 className="admin-form-section__title">Resources</h3>
        </div>
        <div className="admin-multiselect-grid">
          {resources.map((resource) => (
            <label key={resource.id} className="admin-multiselect-item">
              <input
                type="checkbox"
                name="resourceIds"
                value={resource.id}
                defaultChecked={selected.has(resource.id)}
              />
              <span>
                <strong>{resource.title}</strong>
                <small>{resource.resourceType || "Resource"}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <div className="admin-form-actions">
        <button className="admin-btn admin-btn--primary" type="submit">
          {permission ? "Save Permission" : "Create Permission"}
        </button>
      </div>
    </form>
  );
}
