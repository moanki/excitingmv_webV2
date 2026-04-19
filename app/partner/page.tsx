import { samplePartnerResources } from "@/lib/sample-data";

export default function PartnerDashboardPage() {
  return (
    <section>
      <p className="eyebrow">Approved Partners</p>
      <h1 className="section-title">A private workspace for resort sales support.</h1>
      <div className="dashboard-grid">
        <article className="stat-card">
          <p className="eyebrow">Published Resorts</p>
          <strong>42</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Protected Resources</p>
          <strong>{samplePartnerResources.length}</strong>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Live Support</p>
          <strong>Chat Enabled</strong>
        </article>
      </div>
    </section>
  );
}
