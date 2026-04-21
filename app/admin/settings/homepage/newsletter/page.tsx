import { HomepageNewsletterContentForm } from "@/app/admin/settings/forms";
import { getHomepageNewsletterContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminHomepageNewsletterPage() {
  const [{ content: newsletter }, mediaLibrary] = await Promise.all([
    getHomepageNewsletterContent("draft"),
    listSiteAssets()
  ]);

  return <HomepageNewsletterContentForm newsletter={newsletter} mediaLibrary={mediaLibrary} />;
}
