import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_LOGIN_PATH, ADMIN_SESSION_COOKIE, bootstrapAdmin } from "@/lib/auth/bootstrap-admin";
import { AdminLoginForm } from "@/app/admin/login/login-form";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const cookieStore = await cookies();

  if (cookieStore.get(ADMIN_SESSION_COOKIE)?.value === "superadmin") {
    redirect("/admin");
  }

  const params = await searchParams;
  const next = params.next ?? "/admin";

  return (
    <main className="shell auth-shell">
      <div className="panel auth-card">
        <p className="eyebrow">Admin Center</p>
        <h1 className="section-title">Super-admin access for Exciting Maldives operations.</h1>
        <p className="lede">
          Use the bootstrap admin credentials to access partner approvals, resort management,
          imports, leads, and site configuration.
        </p>
        <div className="auth-note">
          <strong>Bootstrap login:</strong> {bootstrapAdmin.email}
          <br />
          <strong>Password:</strong> {bootstrapAdmin.password}
        </div>
        <div style={{ marginTop: "1.25rem" }}>
          <AdminLoginForm next={next} />
        </div>
        <div className="card-actions">
          <Link href="/" className="button-muted">
            Back To Website
          </Link>
          <Link href="/partner/login" className="button-muted">
            Partner Login
          </Link>
        </div>
      </div>
    </main>
  );
}
