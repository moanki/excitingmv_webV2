import { createAdminUserAction, deleteAdminUserAction } from "@/app/admin/user-access/actions";
import { listAdminUsers, listRoles } from "@/lib/services/admin-user-service";

export default async function AdminUserAccessPage() {
  const [users, roles] = await Promise.all([listAdminUsers(), listRoles()]);

  return (
    <section className="stack">
      <div>
        <p className="eyebrow">User Access</p>
        <h1 className="section-title">Create and manage admin portal users.</h1>
      </div>
      <article className="panel">
        <p className="eyebrow">Create Admin User</p>
        <form action={createAdminUserAction} className="stack">
          <div className="form-grid">
            <label className="field">
              Full Name
              <input name="fullName" />
            </label>
            <label className="field">
              Email
              <input name="email" type="email" />
            </label>
            <label className="field">
              Password
              <input name="password" type="password" />
            </label>
            <label className="field">
              Role
              <select name="roleId">
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="button" type="submit">
            Create Admin User
          </button>
        </form>
      </article>

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
                  <button className="button-muted" type="submit">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
