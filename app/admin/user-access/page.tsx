import { createAdminUserAction, deleteAdminUserAction } from "@/app/admin/user-access/actions";
import { listAdminUsers, listRoles } from "@/lib/services/admin-user-service";

export default async function AdminUserAccessPage() {
  const [users, roles] = await Promise.all([listAdminUsers(), listRoles()]);

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">User Access</p>
          <h1 className="section-title">Create and manage admin portal users.</h1>
          <p className="admin-page-lede">Add internal users, assign roles, and keep workspace access controlled.</p>
        </div>
      </div>

      <article className="panel admin-form-card">
        <div className="admin-form-section__header">
          <h3 className="admin-form-section__title">Create Admin User</h3>
          <p className="admin-form-section__help">Add a new internal user and assign the correct workspace role.</p>
        </div>
        <form action={createAdminUserAction} className="stack">
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Full Name</span>
              <input className="admin-input" name="fullName" />
            </label>
            <label className="field">
              <span className="field__label">Email</span>
              <input className="admin-input" name="email" type="email" />
            </label>
            <label className="field">
              <span className="field__label">Password</span>
              <input className="admin-input" name="password" type="password" />
            </label>
            <label className="field">
              <span className="field__label">Role</span>
              <select className="admin-select" name="roleId">
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="admin-form-actions">
            <button className="admin-btn admin-btn--primary" type="submit">
              Create Admin User
            </button>
          </div>
        </form>
      </article>

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
                  <form action={deleteAdminUserAction}>
                    <input type="hidden" name="id" value={user.id} />
                    <button className="admin-btn admin-btn--danger" type="submit">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
