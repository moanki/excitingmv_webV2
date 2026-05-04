import { deleteAdminUserAction } from "@/app/admin/user-access/actions";
import { CreateAdminUserForm } from "@/app/admin/user-access/create-admin-user-form";
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
        <CreateAdminUserForm roles={roles} />
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
