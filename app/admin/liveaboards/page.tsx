import { ResortManagerListView } from "@/app/admin/resorts/forms";
import { listAdminResortCards } from "@/lib/services/resort-service";

const labels = {
  singular: "Liveaboard",
  plural: "Liveaboards",
  publicBasePath: "/liveaboards",
  adminBasePath: "/admin/liveaboards"
};

export default async function AdminLiveaboardsPage() {
  const liveaboardsResult = await listAdminResortCards("liveaboards").then(
    (liveaboards) => ({ liveaboards, error: "" }),
    (error) => ({ liveaboards: [], error: error instanceof Error ? error.message : "Failed to load liveaboards." })
  );
  const { liveaboards, error } = liveaboardsResult;

  return (
    <section className="stack">
      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}

      <ResortManagerListView resorts={liveaboards} propertyType="liveaboards" labels={labels} />
    </section>
  );
}
