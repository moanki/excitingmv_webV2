import { FeaturedRetreatsManager } from "@/components/admin/featured-retreats-manager";

export default function AdminHomepageFeaturedResortsPage() {
  return (
    <div className="stack">
      <section>
        <p className="eyebrow">Homepage</p>
        <h1 className="section-title">Featured Retreats</h1>
        <p className="admin-page-lede">Manage the selected resorts and their homepage order.</p>
      </section>
      <FeaturedRetreatsManager />
    </div>
  );
}
