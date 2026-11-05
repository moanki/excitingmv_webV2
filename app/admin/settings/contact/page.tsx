import { ContactSettingsForm } from "@/app/admin/settings/contact/contact-settings-form";
import "@/app/admin/settings/contact/team-settings.css";
import { getContactPageContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminContactSettingsPage() {
  const [{ content }, mediaLibrary] = await Promise.all([
    getContactPageContent("draft"),
    listSiteAssets()
  ]);

  return <ContactSettingsForm contact={content} mediaLibrary={mediaLibrary} />;
}
