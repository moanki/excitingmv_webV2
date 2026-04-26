import Link from "next/link";

import { ResourcePermissionForm } from "@/components/admin/resource-permission-form";
import { listResources } from "@/lib/services/resource-service";

export default async function AdminResourcePermissionNewPage() {
  const resources = await listResources();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <Link href="/admin/resource-permissions" className="admin-back-link">
            Back to Resource Permissions
          </Link>
          <h1 className="section-title">Create Permission</h1>
        </div>
      </div>
      <article className="panel">
        <ResourcePermissionForm resources={resources} />
      </article>
    </section>
  );
}
