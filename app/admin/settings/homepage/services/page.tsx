import { HomepageServicesForm } from "@/app/admin/settings/forms";
import { getHomepageServices } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminHomepageServicesPage() {
  const [{ content: services }, mediaLibrary] = await Promise.all([
    getHomepageServices("draft"),
    listSiteAssets()
  ]);

  return <HomepageServicesForm services={services} mediaLibrary={mediaLibrary} />;
}
