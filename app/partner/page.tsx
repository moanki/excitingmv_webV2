import { listPublishedResources } from "@/lib/services/resource-service";
import { getResortCounts } from "@/lib/services/resort-service";

export default async function PartnerDashboardPage() {
  const [resources, resortCounts] = await Promise.all([listPublishedResources(), getResortCounts()]);

  return (
    <section>
      <p className="eyebrow">Approved Partners</p>
      <h1 className="section-title">A private workspace for resort sales support.</h1>
      <div className="dashboard-grid">
        <article className="stat-card">
          <p className="eyebrow">Published Resorts</p>
          <strong>{resortCounts.published}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Protected Resources</p>
          <strong>{resources.length}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Chat Now</p>
          <strong>Chat Enabled</strong>
        </article>
      </div>
    </section>
  );
}
