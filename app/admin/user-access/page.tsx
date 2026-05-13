import { UserAccessManager } from "@/app/admin/user-access/user-access-manager";
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

      <UserAccessManager users={users} roles={roles} />
    </section>
  );
}
