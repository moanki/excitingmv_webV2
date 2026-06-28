"use client";

import { Bell, Building2, Contact, Globe2, Home, KeyRound, Menu, MessageCircle, PanelBottom } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { label: "Homepage", href: "/admin/settings/homepage", icon: Home },
  { label: "About", href: "/admin/settings/about", icon: Building2 },
  { label: "Navbar", href: "/admin/settings/navbar", icon: Menu },
  { label: "Footer", href: "/admin/settings/footer", icon: PanelBottom },
  { label: "WhatsApp", href: "/admin/settings/whatsapp", icon: MessageCircle },
  { label: "Contact", href: "/admin/settings/contact", icon: Contact },
  { label: "Markets", href: "/admin/settings/markets", icon: Globe2 },
  { label: "Notifications", href: "/admin/settings/notifications", icon: Bell },
  { label: "Admin Login", href: "/admin/settings/admin-login", icon: KeyRound }
];

export default function AdminSettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="admin-settings-v3">
      <nav className="admin-settings-v3__nav" aria-label="Site settings">
        {sections.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={pathname.startsWith(href) ? "is-active" : ""}>
            <Icon className="admin-icon" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="admin-settings-v3__content">{children}</div>
    </div>
  );
}
