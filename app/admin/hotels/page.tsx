import { ResortManagerListView } from "@/app/admin/resorts/forms";
import { listAdminResortCards } from "@/lib/services/resort-service";

const labels = {
  singular: "Hotel",
  plural: "Hotels",
  publicBasePath: "/hotels",
  adminBasePath: "/admin/hotels"
};

export default async function AdminHotelsPage() {
  const hotelsResult = await listAdminResortCards("hotels").then(
    (hotels) => ({ hotels, error: "" }),
    (error) => ({ hotels: [], error: error instanceof Error ? error.message : "Failed to load hotels." })
  );
  const { hotels, error } = hotelsResult;

  return (
    <section className="stack">
      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}

      <ResortManagerListView resorts={hotels} propertyType="hotels" labels={labels} />
    </section>
  );
}
