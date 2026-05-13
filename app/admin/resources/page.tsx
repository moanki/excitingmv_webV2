import Link from "next/link";

import { ResourceLibraryTable } from "@/app/admin/resources/resource-library-table";
import { listResources } from "@/lib/services/resource-service";

export default async function AdminResourcesPage() {
  const resources = await listResources();

  return (
    <section className="stack">
      <div className="admin-page-header admin-page-header--actions-only">
        <div className="admin-page-header__actions">
          <Link className="admin-btn admin-btn--primary" href="/admin/resources/new">
            + Add Resource
          </Link>
        </div>
      </div>

      {resources.length ? (
        <ResourceLibraryTable resources={resources} />
      ) : (
        <div className="empty-state">
          <strong>No resources uploaded yet.</strong>
        </div>
      )}
    </section>
  );
}
