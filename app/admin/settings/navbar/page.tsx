import { NavbarSettingsForm } from "@/app/admin/settings/forms";
import { getNavbarContent } from "@/lib/site-content";

export default async function AdminNavbarSettingsPage() {
  const { content: navbar } = await getNavbarContent("draft");
  return <NavbarSettingsForm navbar={navbar} />;
}
