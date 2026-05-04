"use client";

import { useActionState } from "react";

import { createAdminUserAction } from "@/app/admin/user-access/actions";
import type { AdminRoleRecord } from "@/lib/services/admin-user-service";

function StatusMessage({ message, error }: { message?: string; error?: string }) {
  if (error) {
    return <p className="admin-alert admin-alert--error">{error}</p>;
  }

  if (message) {
    return <p className="admin-alert admin-alert--success">{message}</p>;
  }

  return null;
}

export function CreateAdminUserForm({ roles }: { roles: AdminRoleRecord[] }) {
  const [state, action, pending] = useActionState(createAdminUserAction, undefined);
  const hasRoles = roles.length > 0;

  return (
    <form action={action} className="stack">
      <div className="form-grid">
        <label className="field">
          <span className="field__label">Full Name</span>
          <input className="admin-input" name="fullName" />
        </label>
        <label className="field">
          <span className="field__label">Email</span>
          <input className="admin-input" name="email" type="email" required />
        </label>
        <label className="field">
          <span className="field__label">Password</span>
          <input className="admin-input" name="password" type="password" required minLength={8} />
        </label>
        <label className="field">
          <span className="field__label">Role</span>
          <select className="admin-select" name="roleId" disabled={!hasRoles} required>
            {hasRoles ? (
              roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name.replace(/_/g, " ")}
                </option>
              ))
            ) : (
              <option value="">No roles available</option>
            )}
          </select>
        </label>
      </div>
      {!hasRoles ? (
        <p className="admin-alert admin-alert--error">
          No admin roles are available. Refresh this page to initialize default roles, then try again.
        </p>
      ) : null}
      <div className="admin-form-actions">
        <button className="admin-btn admin-btn--primary" type="submit" disabled={pending || !hasRoles}>
          {pending ? "Creating..." : "Create Admin User"}
        </button>
      </div>
      <StatusMessage message={state?.message} error={state?.error} />
    </form>
  );
}
