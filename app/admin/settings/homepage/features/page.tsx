import { FeaturesSettingsForm } from "@/app/admin/settings/forms";
import { FeaturedRetreatsManager } from "@/components/admin/featured-retreats-manager";
import { getHomepageFeatures } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminHomepageFeaturesPage() {
  const [{ content: features }, mediaLibrary] = await Promise.all([
    getHomepageFeatures("draft"),
    listSiteAssets()
  ]);

  return (
    <div className="stack">
      <section>
        <p className="eyebrow">Homepage</p>
        <h1 className="section-title">Featured Retreats</h1>
        <p className="admin-page-lede">Manage the section copy, selected resorts, and display order together.</p>
      </section>
      <FeaturesSettingsForm features={features} mediaLibrary={mediaLibrary} />
      <FeaturedRetreatsManager />
    </div>
  );
}
