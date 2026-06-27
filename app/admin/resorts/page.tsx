import { ResortManagerListView } from "@/app/admin/resorts/forms";
import { listAdminResortCards } from "@/lib/services/resort-service";

export default async function AdminResortsPage() {
  const resortsResult = await listAdminResortCards().then(
    (resorts) => ({ resorts, error: "" }),
    (error) => ({ resorts: [], error: error instanceof Error ? error.message : "Failed to load resorts." })
  );
  const { resorts, error } = resortsResult;

  return (
    <section className="stack">
      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}

      <ResortManagerListView resorts={resorts} />
    </section>
  );
}
