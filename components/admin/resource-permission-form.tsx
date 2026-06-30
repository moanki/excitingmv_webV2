"use client";

import { useActionState } from "react";
import type { ResourceRecord } from "@/lib/services/resource-service";
import type { ResourcePermissionRecord } from "@/lib/services/resource-permission-service";

import { saveResourcePermissionAction } from "@/app/admin/resource-permissions/actions";
import { ActionMessage, SubmitButton } from "@/components/admin/action-feedback";

type Props = {
  permission?: ResourcePermissionRecord | null;
  resources: ResourceRecord[];
};

export function ResourcePermissionForm({ permission, resources }: Props) {
  const selected = new Set(permission?.resources.map((resource) => resource.id) ?? []);
  const [state, action] = useActionState(saveResourcePermissionAction, undefined);

  return (
    <form action={action} className="stack admin-form-card">
      {permission ? <input type="hidden" name="agentId" value={permission.agentId} /> : null}

      <section className="admin-form-section">
        <div className="admin-form-section__header">
          <h3 className="admin-form-section__title">Partner Access</h3>
          <p className="admin-form-section__help">Assign published resources to a partner login identity.</p>
        </div>
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Partner Agency Name</span>
            <input className="admin-input" name="agencyName" defaultValue={permission?.agencyName ?? ""} required />
          </label>
          <label className="field">
            <span className="field__label">Username</span>
            <input className="admin-input" name="username" type="email" defaultValue={permission?.username ?? ""} required />
          </label>
          <label className="field">
            <span className="field__label">Resource Password</span>
            <input
              className="admin-input"
              name="password"
              type="password"
              placeholder={permission ? "Leave blank to keep existing password" : "Set resource password"}
              required={!permission}
            />
            <p className="field__help">Saved as a secure hash. Leave blank when editing to keep the current password.</p>
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
        <SubmitButton
          idleLabel={permission ? "Save Permission" : "Create Permission"}
          pendingLabel={permission ? "Saving Permission..." : "Creating Permission..."}
        />
      </div>
      <ActionMessage state={state} />
    </form>
  );
}
