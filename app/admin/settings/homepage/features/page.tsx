import { FeaturesSettingsForm } from "@/app/admin/settings/forms";
import { getHomepageFeatures } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminHomepageFeaturesPage() {
  const [{ content: features }, mediaLibrary] = await Promise.all([
    getHomepageFeatures("draft"),
    listSiteAssets()
  ]);

  return <FeaturesSettingsForm features={features} mediaLibrary={mediaLibrary} />;
}
