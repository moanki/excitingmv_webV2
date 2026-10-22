import { HomepageWhyUsForm } from "@/app/admin/settings/forms";
import { getHomepageWhyUsContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminHomepageWhyUsPage() {
  const [{ content }, mediaLibrary] = await Promise.all([
    getHomepageWhyUsContent("draft"),
    listSiteAssets()
  ]);
  return <HomepageWhyUsForm items={content.items} imageUrl={content.imageUrl} mediaLibrary={mediaLibrary} />;
}
