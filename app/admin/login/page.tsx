import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE } from "@/lib/auth/bootstrap-admin";
import { AdminLoginForm } from "@/app/admin/login/login-form";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const cookieStore = await cookies();

  if (cookieStore.get(ADMIN_SESSION_COOKIE)?.value) {
    redirect("/admin");
  }

  const params = await searchParams;
  const next = params.next ?? "/admin";

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-hero">
        <div className="admin-auth-hero-copy">
          <p className="eyebrow">Exciting Maldives</p>
          <h1>Admin workspace for content, approvals, and operational control.</h1>
          <p>
            Access the internal control center for partner reviews, resort publishing, AI imports,
            site settings, lead monitoring, and user permissions.
          </p>
        </div>
        <div className="admin-auth-points">
          <article className="admin-auth-feature">
            <strong>Structured operations</strong>
            <span>One quiet workspace for teams managing resorts, resources, imports, and requests.</span>
          </article>
          <article className="admin-auth-feature">
            <strong>Safer by default</strong>
            <span>No public-site navigation, no exposed login hints, and no marketing distractions.</span>
          </article>
          <article className="admin-auth-feature">
            <strong>Built for daily use</strong>
            <span>Designed around queues, approvals, and operational visibility instead of public CTAs.</span>
          </article>
        </div>
      </section>

      <section className="admin-auth-panel">
        <div className="admin-auth-card">
          <div className="admin-auth-header">
            <p className="eyebrow">Admin Sign In</p>
            <h2>Secure workspace access</h2>
            <p>Use your assigned admin credentials to continue.</p>
          </div>

          <AdminLoginForm next={next} />

          <div className="admin-auth-meta">
            <p>Need a new admin account or role update? Contact the platform owner.</p>
            <div className="admin-form-actions">
              <Link href="/" className="admin-btn admin-btn--ghost">
                Back To Website
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
