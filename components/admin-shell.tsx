"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Gauge,
  Globe2,
  Home,
  Image,
  LayoutTemplate,
  Mail,
  Menu,
  KeyRound,
  Search,
  Settings2,
  Shield,
  Ship,
  Sparkles,
  UserCog,
  LogOut,
  Waves
} from "lucide-react";

import { logoutFromAdmin } from "@/app/admin/login/actions";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        description: "Metrics, approvals, and quick actions",
        icon: Gauge
      }
    ]
  },
  {
    title: "Sales & Relationships",
    items: [
      {
        href: "/admin/partners",
        label: "Partners",
        description: "Queue, approvals, and exports",
        icon: Building2
      },
      {
        href: "/admin/newsletters",
        label: "Newsletter",
        description: "Leads and exports",
        icon: Mail
      },
      {
        href: "/admin/email-configuration",
        label: "Email Configuration",
        description: "SMTP provider and notification routing",
        icon: Bell
      }
    ]
  },
  {
    title: "Content",
    items: [
      {
        href: "/admin/resorts",
        label: "Resorts",
        description: "Property inventory and publishing",
        icon: LayoutTemplate
      },
      {
        href: "/admin/liveaboards",
        label: "Liveaboards",
        description: "Cruise inventory and publishing",
        icon: Ship
      },
      {
        href: "/admin/hotels",
        label: "Hotels",
        description: "Hotel inventory and publishing",
        icon: Building2
      },
      {
        href: "/admin/media",
        label: "Media Library",
        description: "Upload, reuse, and delete assets",
        icon: Image
      },
      {
        href: "/admin/resources",
        label: "Resource Library",
        description: "Files, links, and statuses",
        icon: FolderKanban
      },
      {
        href: "/admin/resource-permissions",
        label: "Resource Permissions",
        description: "Partner access and assignments",
        icon: KeyRound
      },
      {
        href: "/admin/imports",
        label: "AI Import",
        description: "Import intake and review",
        icon: Sparkles
      }
    ]
  },
  {
    title: "Access Control",
    items: [
      {
        href: "/admin/user-access",
        label: "User Access",
        description: "Admins, access state, and ownership",
        icon: UserCog
      },
      {
        href: "/admin/roles",
        label: "Roles",
        description: "Permission model and role clarity",
        icon: Shield
      },
      {
        href: "/admin/settings/admin-login",
        label: "Admin Login Page",
        description: "Sign-in media and logo",
        icon: Image
      }
    ]
  }
];

const settingsGroups: Array<{
  title: string;
  icon: ComponentType<{ className?: string }>;
  items: Array<{ href: string; label: string; icon: ComponentType<{ className?: string }> }>;
}> = [
  {
    title: "Website",
    icon: Globe2,
    items: [
      { href: "/admin/settings", label: "Homepage", icon: Home },
      { href: "/admin/settings/navbar", label: "Navbar", icon: Menu },
      { href: "/admin/settings/footer", label: "Footer", icon: LayoutTemplate },
      { href: "/admin/settings/about", label: "About Us", icon: Building2 },
      { href: "/admin/settings/contact", label: "Contact Us", icon: Mail }
    ]
  },
  {
    title: "Features",
    icon: Sparkles,
    items: [
      { href: "/admin/settings/whatsapp", label: "WhatsApp widget", icon: Mail },
      { href: "/admin/settings/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/settings/markets", label: "Markets", icon: Globe2 }
    ]
  },
  {
    title: "Admin",
    icon: Shield,
    items: [
      { href: "/admin/email-configuration", label: "Email config", icon: Settings2 },
      { href: "/admin/settings/admin-login", label: "Login page", icon: Image }
    ]
  },
  {
    title: "Page sections",
    icon: LayoutTemplate,
    items: [
      { href: "/admin/settings/homepage/hero", label: "Hero", icon: LayoutTemplate },
      { href: "/admin/settings/homepage/features", label: "Feature cards", icon: LayoutTemplate },
      { href: "/admin/settings/homepage/stats", label: "Expertise stats", icon: Gauge },
      { href: "/admin/settings/homepage/ceo", label: "CEO message", icon: UserCog },
      { href: "/admin/settings/homepage/story", label: "Our story", icon: FolderKanban },
      { href: "/admin/settings/homepage/services", label: "Services", icon: Menu },
      { href: "/admin/settings/homepage/why-us", label: "Why us", icon: Sparkles },
      { href: "/admin/settings/homepage/awards", label: "Awards", icon: Shield },
      { href: "/admin/settings/homepage/guide", label: "Travel guide", icon: Globe2 },
      { href: "/admin/settings/homepage/newsletter", label: "Newsletter", icon: Mail }
    ]
  }
];

const pageMeta: Record<string, { title: string; description: string }> = {
  "/admin": {
    title: "Admin Dashboard",
    description: ""
  },
  "/admin/partners": {
    title: "Requests for Partner",
    description: ""
  },
  "/admin/resorts": {
    title: "Resort Manager",
    description: ""
  },
  "/admin/resorts/new": {
    title: "Add New Resort",
    description: "Create a focused property workspace without the rest of the resort list in view."
  },
  "/admin/liveaboards": {
    title: "Liveaboard Manager",
    description: ""
  },
  "/admin/liveaboards/new": {
    title: "Add New Liveaboard",
    description: "Create a focused liveaboard workspace without the rest of the list in view."
  },
  "/admin/hotels": {
    title: "Hotel Manager",
    description: ""
  },
  "/admin/hotels/new": {
    title: "Add New Hotel",
    description: "Create a focused hotel workspace without the rest of the list in view."
  },
  "/admin/media": {
    title: "Media Library",
    description: ""
  },
  "/admin/resources": {
    title: "Resource Library",
    description: ""
  },
  "/admin/resources/new": {
    title: "Add Resource",
    description: ""
  },
  "/admin/resource-permissions": {
    title: "Resource Permissions",
    description: ""
  },
  "/admin/resource-permissions/new": {
    title: "Create Permission",
    description: ""
  },
  "/admin/newsletters": {
    title: "Newsletter Subscriptions",
    description: ""
  },
  "/admin/email-configuration": {
    title: "Email Configuration",
    description: "Configure the SMTP service used for website notifications."
  },
  "/admin/imports": {
    title: "AI Import Center",
    description: ""
  },
  "/admin/settings": {
    title: "Site Settings",
    description: ""
  },
  "/admin/settings/admin-login": {
    title: "Admin Login Page",
    description: ""
  },
  "/admin/user-access": {
    title: "User Access",
    description: ""
  },
  "/admin/roles": {
    title: "Roles",
    description: "Define permission boundaries with clearer enterprise structure."
  },
  "/admin/login": {
    title: "Admin Login",
    description: "Secure sign-in for Exciting Maldives workspace access."
  }
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

function getCurrentPageMeta(pathname: string) {
  const exactMatch = pageMeta[pathname];
  if (exactMatch) {
    return exactMatch;
  }

  if (pathname.startsWith("/admin/resorts/") && pathname.endsWith("/edit")) {
    return {
      title: "Edit Resort",
      description: "Focused resort editing workspace for one selected property."
    };
  }

  if (pathname.startsWith("/admin/liveaboards/") && pathname.endsWith("/edit")) {
    return {
      title: "Edit Liveaboard",
      description: "Focused liveaboard editing workspace for one selected item."
    };
  }

  if (pathname.startsWith("/admin/hotels/") && pathname.endsWith("/edit")) {
    return {
      title: "Edit Hotel",
      description: "Focused hotel editing workspace for one selected property."
    };
  }

  const matchedEntry = Object.entries(pageMeta)
    .filter(([href]) => href !== "/admin" && pathname.startsWith(href))
    .sort((left, right) => right[0].length - left[0].length)[0];

  return matchedEntry?.[1] ?? pageMeta["/admin"];
}

export function AdminShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const current = getCurrentPageMeta(pathname);

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand-block">
          <div className="admin-brand-row">
            <span className="admin-brand-mark"><Waves className="admin-icon" /></span>
            <strong>Exciting Maldives</strong>
          </div>
          <p>Admin center</p>
        </div>

        <nav className="admin-nav" aria-label="Admin">
          {navGroups.map((group) => (
            <div className="admin-nav-group" key={group.title}>
              <p className="admin-nav-label">{group.title}</p>
              <div className="admin-nav-list">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={isActive(pathname, item.href) ? "admin-nav-item is-active" : "admin-nav-item"}
                    >
                      <span className="admin-nav-icon">
                        <Icon className="admin-icon" />
                      </span>
                      <span className="admin-nav-copy">
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="admin-settings-nav">
            <p className="admin-nav-label">Site Settings</p>
            {settingsGroups.map((group) => {
              const GroupIcon = group.icon;
              const groupActive = group.items.some((item) => isActive(pathname, item.href));

              return (
                <details className="admin-settings-group" key={group.title} open={groupActive || group.title === "Website"}>
                  <summary>
                    <span><GroupIcon className="admin-icon" />{group.title}</span>
                    <ChevronRight className="admin-settings-chevron" />
                  </summary>
                  <div className="admin-settings-links">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const active = pathname === item.href || (item.href !== "/admin/settings" && pathname.startsWith(item.href));
                      return (
                        <Link key={item.href} href={item.href} className={active ? "admin-settings-link is-active" : "admin-settings-link"}>
                          <ItemIcon className="admin-icon" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </nav>

        <form action={logoutFromAdmin} className="admin-logout">
          <button type="submit" className="admin-btn admin-btn--secondary admin-logout-button">
            <LogOut className="admin-icon" />
            Logout
          </button>
        </form>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-copy">
            <h2>{current.title}</h2>
          </div>
          <div className="admin-topbar-actions">
            <button type="button" className="admin-icon-button" aria-label="Notifications">
              <Bell className="admin-icon" />
            </button>
            <button type="button" className="admin-icon-button" aria-label="Search">
              <Search className="admin-icon" />
            </button>
            <div className="admin-user-chip">
              <span>SA</span>
              <strong>Super Admin</strong>
              <ChevronDown className="admin-user-chevron" />
            </div>
          </div>
        </header>
        <main className="admin-canvas">{children}</main>
      </div>
    </div>
  );
}
