import { ResourceLibraryTable } from "@/app/admin/resources/resource-library-table";
import { listAdminResources } from "@/lib/services/resource-service";

export default async function AdminResourcesPage() {
  let resources;
  try {
    resources = await listAdminResources();
  } catch (error) {
    return <p className="admin-alert admin-alert--error">{error instanceof Error ? error.message : "Failed to load resources."}</p>;
  }

  return (
    <section className="stack">
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
