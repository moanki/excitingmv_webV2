import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Globe2, MapPin, ShieldCheck } from "lucide-react";

import { ADMIN_SESSION_COOKIE } from "@/lib/auth/bootstrap-admin";
import { AdminLoginForm } from "@/app/admin/login/login-form";
import { getAdminLoginContent } from "@/lib/site-content";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const cookieStore = await cookies();

  if (cookieStore.get(ADMIN_SESSION_COOKIE)?.value) {
    redirect("/admin");
  }

  const { content: loginContent } = await getAdminLoginContent("published");
  const params = await searchParams;
  const next = params.next ?? "/admin";

  return (
    <main className="admin-auth-page">
      <section
        className="admin-auth-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(9, 116, 139, 0.08), rgba(9, 116, 139, 0.18)), url(${loginContent.backgroundImageUrl})`
        }}
      >
        <div className="admin-auth-brand">
          {loginContent.logoImageUrl ? (
            <img className="admin-auth-brand-logo" src={loginContent.logoImageUrl} alt="Exciting Maldives" />
          ) : (
            <>
              <div className="admin-auth-brand-mark" aria-hidden="true">
                <span />
              </div>
              <h1>Exciting<br />Maldives</h1>
              <p>The Maldives Experts</p>
              <i aria-hidden="true" />
            </>
          )}
        </div>

        <div className="admin-auth-hero-note">
          <MapPin size={20} strokeWidth={2} />
          <div>
            <strong>Paradise found. Experiences crafted.</strong>
            <span>We connect travelers with the best resorts in the Maldives.</span>
          </div>
        </div>
      </section>

      <section className="admin-auth-panel">
        <div className="admin-auth-card">
          <div className="admin-auth-header">
            <span className="admin-auth-pill">
              <ShieldCheck size={16} strokeWidth={2} />
              Private Workspace
            </span>
            <p className="eyebrow">Admin Center</p>
            <h2>Welcome Back</h2>
            <p>Sign in to manage partners, resorts, imports, leads, and site settings.</p>
          </div>

          <AdminLoginForm next={next} />

          <div className="admin-auth-meta">
            <div className="admin-form-actions">
              <Link href="/" className="admin-btn admin-btn--ghost">
                <Globe2 size={18} strokeWidth={2} />
                Back to Website
              </Link>
            </div>
            <p>
              <ShieldCheck size={16} strokeWidth={2} />
              Secure admin access
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
