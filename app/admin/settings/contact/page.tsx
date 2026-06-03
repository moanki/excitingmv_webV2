import { ContactSettingsForm } from "@/app/admin/settings/forms";
import { getContactPageContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminContactSettingsPage() {
  const [{ content }, mediaLibrary] = await Promise.all([
    getContactPageContent("draft"),
    listSiteAssets()
  ]);

  return <ContactSettingsForm contact={content} mediaLibrary={mediaLibrary} />;
}
