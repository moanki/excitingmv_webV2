import { HomepageCeoForm } from "@/app/admin/settings/forms";
import { getHomepageCeoContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminHomepageCeoPage() {
  const [{ content: ceo }, mediaLibrary] = await Promise.all([
    getHomepageCeoContent("draft"),
    listSiteAssets()
  ]);

  return <HomepageCeoForm ceo={ceo} mediaLibrary={mediaLibrary} />;
}
