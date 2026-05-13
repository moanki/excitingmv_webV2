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
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">Access and Control</p>
          <h1 className="section-title">Admin Login Page</h1>
          <p className="admin-page-lede">Manage the isolated sign-in page media and logo.</p>
        </div>
      </div>
      <AdminLoginSettingsForm settings={content} mediaLibrary={mediaLibrary} />
    </section>
  );
}
