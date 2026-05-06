import Link from "next/link";
import { Bell, Globe2, Home, Menu, MessageCircle, PanelBottom } from "lucide-react";

const settingsSections = [
  {
    title: "Homepage",
    href: "/admin/settings/homepage",
    icon: Home
  },
  {
    title: "Navbar",
    href: "/admin/settings/navbar",
    icon: Menu
  },
  {
    title: "Footer",
    href: "/admin/settings/footer",
    icon: PanelBottom
  },
  {
    title: "WhatsApp",
    href: "/admin/settings/whatsapp",
    icon: MessageCircle
  },
  {
    title: "Notifications",
    href: "/admin/settings/notifications",
    icon: Bell
  },
  {
    title: "Markets",
    href: "/admin/settings/markets",
    icon: Globe2
  }
];

export default function AdminSettingsIndexPage() {
  return (
    <div className="dashboard-grid admin-settings-icon-grid">
      {settingsSections.map((section) => {
        const Icon = section.icon;
        return (
          <Link key={section.href} href={section.href} className="stat-card admin-settings-icon-card" aria-label={section.title}>
            <Icon className="admin-settings-icon" />
            <span>{section.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
