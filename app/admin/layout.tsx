import { AdminShell } from "@/components/admin-shell";
import { ADMIN_LOGIN_PATH } from "@/lib/auth/bootstrap-admin";
import { getCurrentAdminUser } from "@/lib/auth/require-admin";
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

  return <AdminShell>{children}</AdminShell>;
}
