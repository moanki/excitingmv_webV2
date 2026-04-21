import { HomepageAwardsForm } from "@/app/admin/settings/forms";
import { getHomepageAwardsContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminHomepageAwardsPage() {
  const [{ content: awards }, mediaLibrary] = await Promise.all([
    getHomepageAwardsContent("draft"),
    listSiteAssets()
  ]);

  return <HomepageAwardsForm awards={awards} mediaLibrary={mediaLibrary} />;
}
