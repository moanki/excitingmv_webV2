import { NavbarSettingsForm } from "@/app/admin/settings/forms";
import { getNavbarContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminNavbarSettingsPage() {
  const [{ content: navbar }, mediaLibrary] = await Promise.all([
    getNavbarContent("draft"),
    listSiteAssets()
  ]);

  return <NavbarSettingsForm navbar={navbar} mediaLibrary={mediaLibrary} />;
}
