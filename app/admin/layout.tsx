import { AdminShell } from "@/components/admin-shell";
import { AdminActionFeedbackProvider } from "@/components/admin/admin-action-feedback";
import { ADMIN_LOGIN_PATH } from "@/lib/auth/bootstrap-admin";
import { getCurrentAdminUser } from "@/lib/auth/require-admin";
import { defaultNavbarContent, getNavbarContent } from "@/lib/site-content";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") || "";

  if (pathname !== ADMIN_LOGIN_PATH) {
    const admin = await getCurrentAdminUser();

    if (!admin) {
      redirect(ADMIN_LOGIN_PATH);
    }
  }

  const { content: navbar } = await getNavbarContent("published");
  const logoUrl = navbar.whiteLogoUrl || navbar.primaryLogoUrl || navbar.blackLogoUrl || defaultNavbarContent.whiteLogoUrl;

  return <AdminActionFeedbackProvider><AdminShell logoUrl={logoUrl}>{children}</AdminShell></AdminActionFeedbackProvider>;
}
