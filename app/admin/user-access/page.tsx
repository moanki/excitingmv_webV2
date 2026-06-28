import { UserAccessManager } from "@/app/admin/user-access/user-access-manager";
import { listAdminUsers, listRoles } from "@/lib/services/admin-user-service";

export default async function AdminUserAccessPage() {
  const [users, roles] = await Promise.all([listAdminUsers(), listRoles()]);

  return (
    <section>
      <UserAccessManager users={users} roles={roles} />
    </section>
  );
}
