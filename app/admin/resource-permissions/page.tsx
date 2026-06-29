import { ResourcePermissionsTable } from "@/components/admin/resource-permissions-table";
import { listResourcePermissions } from "@/lib/services/resource-permission-service";

export default async function AdminResourcePermissionsPage() {
  return <ResourcePermissionsTable permissions={await listResourcePermissions()} />;
}
