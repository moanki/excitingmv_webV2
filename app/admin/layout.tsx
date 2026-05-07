import { AdminShell } from "@/components/admin-shell";
import { getUnreadChatCount } from "@/lib/services/chat-service";
import { getNavbarContent } from "@/lib/site-content";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{ content: navbar }, unreadChatCount] = await Promise.all([
    getNavbarContent("published"),
    getUnreadChatCount()
  ]);

  return (
    <AdminShell
      logoUrl={navbar.blackLogoUrl || navbar.primaryLogoUrl || navbar.whiteLogoUrl}
      initialUnreadChatCount={unreadChatCount}
    >
      {children}
    </AdminShell>
  );
}
