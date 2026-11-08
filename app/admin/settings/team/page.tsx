import { ContactSettingsForm } from "@/app/admin/settings/team/contact-settings-form";
import "@/app/admin/settings/team/team-settings.css";
import { getCatalogueContent, getContactPageContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminContactSettingsPage() {
  const [{ content }, { content: catalogue }, mediaLibrary] = await Promise.all([
    getContactPageContent("draft"),
    getCatalogueContent("contact"),
    listSiteAssets()
  ]);

  return <ContactSettingsForm contact={{ ...content, heroImageUrl: content.heroImageUrl ?? catalogue.heroImageUrl }} mediaLibrary={mediaLibrary} />;
}
