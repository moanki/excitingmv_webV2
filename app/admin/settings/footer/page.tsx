import { FooterSettingsForm } from "@/app/admin/settings/forms";
import { getFooterContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminFooterSettingsPage() {
  const [{ content: footer }, mediaLibrary] = await Promise.all([
    getFooterContent("draft"),
    listSiteAssets()
  ]);

  return <FooterSettingsForm footer={footer} mediaLibrary={mediaLibrary} />;
}
