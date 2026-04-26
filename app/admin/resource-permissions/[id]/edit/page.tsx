import Link from "next/link";
import { notFound } from "next/navigation";

import { ResourcePermissionForm } from "@/components/admin/resource-permission-form";
import { listResources } from "@/lib/services/resource-service";
import { getResourcePermission } from "@/lib/services/resource-permission-service";

export default async function AdminResourcePermissionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [permission, resources] = await Promise.all([getResourcePermission(id), listResources()]);

  if (!permission) {
    notFound();
  }

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <Link href="/admin/resource-permissions" className="admin-back-link">
            Back to Resource Permissions
          </Link>
          <h1 className="section-title">Edit Permission</h1>
        </div>
      </div>
      <article className="panel">
        <ResourcePermissionForm permission={permission} resources={resources} />
      </article>
    </section>
  );
}
