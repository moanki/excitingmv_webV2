import { ResortManagerListView } from "@/app/admin/resorts/forms";
import { getResortCounts, listAdminResortCards } from "@/lib/services/resort-service";

const labels = {
  singular: "Hotel",
  plural: "Hotels",
  publicBasePath: "/hotels",
  adminBasePath: "/admin/hotels"
};

export default async function AdminHotelsPage() {
  const [hotels, counts] = await Promise.all([listAdminResortCards("hotels"), getResortCounts("hotels")]);

  return (
    <section className="stack">
      <div className="dashboard-grid">
        <article className="stat-card">
          <p className="eyebrow">Total Hotels</p>
          <strong>{counts.total}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Published</p>
          <strong>{counts.published}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Featured On Homepage</p>
          <strong>{counts.featured}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Draft</p>
          <strong>{counts.draft}</strong>
        </article>
      </div>

      <ResortManagerListView resorts={hotels} propertyType="hotels" labels={labels} />
    </section>
  );
}
