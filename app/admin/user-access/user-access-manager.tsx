"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { KeyRound, Pencil, Trash2, X } from "lucide-react";

import {
  createAdminUserAction,
  deleteAdminUserAction,
  resetAdminUserPasswordAction,
  updateAdminUserEmailAction
} from "@/app/admin/user-access/actions";
import type { AdminRoleRecord, AdminUserRecord } from "@/lib/services/admin-user-service";

type ModalMode = "create" | "edit-email" | "reset-password" | null;

function StatusMessage({ message, error }: { message?: string; error?: string }) {
  if (error) return <p className="admin-alert admin-alert--error">{error}</p>;
  if (message) return <p className="admin-alert admin-alert--success">{message}</p>;
  return null;
}

function CreateUserForm({ roles, onClose }: { roles: AdminRoleRecord[]; onClose: () => void }) {
  const [state, action, pending] = useActionState(createAdminUserAction, undefined);
  const formRef = useRef<HTMLFormElement | null>(null);
  const hasRoles = roles.length > 0;

  useEffect(() => {
    if (state?.message) {
      formRef.current?.reset();
    }
  }, [state?.message]);

  if (state?.message) {
    return (
      <div className="admin-modal-success">
        <h3>Admin user created</h3>
        <p>{state.message}</p>
        <button type="button" className="admin-btn admin-btn--primary" onClick={onClose}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="stack">
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
      <div className="admin-form-actions">
        <button className="admin-btn admin-btn--primary" type="submit" disabled={pending || !hasRoles}>
          {pending ? "Creating..." : "Create User"}
        </button>
      </div>
      <StatusMessage error={state?.error} />
    </form>
  );
}

function EmailForm({ user }: { user: AdminUserRecord }) {
  const [state, action, pending] = useActionState(updateAdminUserEmailAction, undefined);
  return (
    <form action={action} className="stack">
      <input type="hidden" name="id" value={user.id} />
      <label className="field">
        <span className="field__label">Email Address</span>
        <input className="admin-input" name="email" type="email" defaultValue={user.email} required />
      </label>
      <div className="admin-form-actions">
        <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Change User"}
        </button>
      </div>
      <StatusMessage message={state?.message} error={state?.error} />
    </form>
  );
}

function ResetPasswordForm({ user }: { user: AdminUserRecord }) {
  const [state, action, pending] = useActionState(resetAdminUserPasswordAction, undefined);
  return (
    <form action={action} className="stack">
      <input type="hidden" name="id" value={user.id} />
      <label className="field">
        <span className="field__label">New Password</span>
        <input className="admin-input" name="password" type="password" minLength={8} required />
      </label>
      <div className="admin-form-actions">
        <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
          {pending ? "Resetting..." : "Reset Password"}
        </button>
      </div>
      <StatusMessage message={state?.message} error={state?.error} />
    </form>
  );
}

export function UserAccessManager({ users, roles }: { users: AdminUserRecord[]; roles: AdminRoleRecord[] }) {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  function openUserModal(mode: Exclude<ModalMode, null>, user?: AdminUserRecord) {
    setSelectedUser(user ?? null);
    setModalMode(mode);
  }

  return (
    <div className="stack admin-list-page">
      <div className="table-toolbar">
        <div className="table-toolbar-left"><span className="tbl-count">{users.length} users</span></div>
        <button className="tbl-add" type="button" onClick={() => openUserModal("create")}>+ Create User</button>
      </div>

      <div className="admin-table-shell">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName || "-"}</td>
                <td>{user.email}</td>
                <td>{user.roles.join(", ") || "-"}</td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      className="admin-icon-button"
                      type="button"
                      aria-label={`Change ${user.email}`}
                      onClick={() => openUserModal("edit-email", user)}
                    >
                      <Pencil className="admin-icon" />
                    </button>
                    <button
                      className="admin-icon-button"
                      type="button"
                      aria-label={`Reset password for ${user.email}`}
                      onClick={() => openUserModal("reset-password", user)}
                    >
                      <KeyRound className="admin-icon" />
                    </button>
                    <form action={deleteAdminUserAction}>
                      <input type="hidden" name="id" value={user.id} />
                      <button className="admin-icon-button admin-icon-button--danger" type="submit" aria-label={`Delete ${user.email}`}>
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

      {modalMode ? (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setModalMode(null)}>
          <div className="admin-modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>
                  {modalMode === "create"
                    ? "Create User"
                    : modalMode === "edit-email"
                      ? "Change User"
                      : "Reset Password"}
                </h3>
                <p>{selectedUser?.email ?? "Add a new admin portal user."}</p>
              </div>
              <button className="admin-icon-button" type="button" aria-label="Close" onClick={() => setModalMode(null)}>
                <X className="admin-icon" />
              </button>
            </div>
            {modalMode === "create" ? <CreateUserForm roles={roles} onClose={() => setModalMode(null)} /> : null}
            {modalMode === "edit-email" && selectedUser ? <EmailForm user={selectedUser} /> : null}
            {modalMode === "reset-password" && selectedUser ? <ResetPasswordForm user={selectedUser} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
