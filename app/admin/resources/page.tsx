import { ResourceLibraryTable } from "@/app/admin/resources/resource-library-table";
import { listResources } from "@/lib/services/resource-service";

export default async function AdminResourcesPage() {
  const resources = await listResources();

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
