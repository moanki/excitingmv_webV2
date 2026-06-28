import { AdminLoginSettingsForm } from "@/app/admin/settings/forms";
import { getAdminLoginContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminLoginSettingsPage() {
  const [{ content }, mediaLibrary] = await Promise.all([
    getAdminLoginContent("draft"),
    listSiteAssets()
  ]);

  return (
    <section className="stack">
      <AdminLoginSettingsForm settings={content} mediaLibrary={mediaLibrary} />
    </section>
  );
}
