import { AdminShell } from "@/components/admin-shell";
import { getNavbarContent } from "@/lib/site-content";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { content: navbar } = await getNavbarContent("published");

  return <AdminShell logoUrl={navbar.blackLogoUrl || navbar.primaryLogoUrl || navbar.whiteLogoUrl}>{children}</AdminShell>;
}
