import { HomepageGuideForm } from "@/app/admin/settings/forms";
import { getHomepageGuide } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminHomepageGuidePage() {
  const [{ content: items }, mediaLibrary] = await Promise.all([
    getHomepageGuide("draft"),
    listSiteAssets()
  ]);

  return <HomepageGuideForm items={items} mediaLibrary={mediaLibrary} />;
}
