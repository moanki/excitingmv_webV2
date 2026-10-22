import { HomepagePartnerForm } from "@/app/admin/settings/forms";
import { getHomepagePartnerContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminHomepagePartnerPage() {
  const [{ content }, mediaLibrary] = await Promise.all([
    getHomepagePartnerContent("draft"),
    listSiteAssets()
  ]);
  return <HomepagePartnerForm partner={content} mediaLibrary={mediaLibrary} />;
}
