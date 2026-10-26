"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FooterSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="stack">
    <nav className="policy-settings-nav" aria-label="Footer settings">
      {[
        ["/admin/settings/footer", "Footer content"],
        ["/admin/settings/footer/privacy-policy", "Privacy Policy"],
        ["/admin/settings/footer/cookie-policy", "Cookie Policy"]
      ].map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
    </nav>
    {children}
  </div>;
}
