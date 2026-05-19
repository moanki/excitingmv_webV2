import { AboutSettingsForm } from "@/app/admin/settings/forms";
import { getAboutPageContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminAboutSettingsPage() {
  const [{ content: about }, mediaLibrary] = await Promise.all([
    getAboutPageContent("draft"),
    listSiteAssets()
  ]);

  return <AboutSettingsForm about={about} mediaLibrary={mediaLibrary} />;
}
