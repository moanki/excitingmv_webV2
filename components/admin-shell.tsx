"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  FolderKanban,
  Gauge,
  Image,
  LayoutTemplate,
  Mail,
  KeyRound,
  Search,
  Settings2,
  Shield,
  Ship,
  Sparkles,
  UserCog,
  LogOut
} from "lucide-react";
import { SubmitButton } from "@/components/admin/action-feedback";

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
    title: "Content",
    items: [
      {
        href: "/admin/resorts",
        label: "Resorts",
        description: "Property inventory and publishing",
        icon: LayoutTemplate
      },
      {
        href: "/admin/hotels",
        label: "Hotels",
        description: "Hotel inventory and publishing",
        icon: Building2
      },
      {
        href: "/admin/liveaboards",
        label: "Liveaboards",
        description: "Cruise inventory and publishing",
        icon: Ship
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
    title: "Assets & Comms",
    items: [
      {
        href: "/admin/media",
        label: "Media Library",
        description: "Upload, reuse, and delete assets",
        icon: Image
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
    title: "Partners",
    items: [
      {
        href: "/admin/partners",
        label: "Partners",
        description: "Queue, approvals, and exports",
        icon: Building2
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
      }
    ]
  },
  {
    title: "Admin",
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
        href: "/admin/settings",
        label: "Site Settings",
        description: "Website content and global settings",
        icon: Settings2
      }
    ]
  }
];

const pageMeta: Record<string, { title: string; description: string }> = {
  "/admin": {
    title: "Dashboard",
    description: ""
  },
  "/admin/partners": {
    title: "Partners",
    description: ""
  },
  "/admin/resorts": {
    title: "Resorts",
    description: ""
  },
  "/admin/resorts/new": {
    title: "Add New Resort",
    description: "Create a focused property workspace without the rest of the resort list in view."
  },
  "/admin/liveaboards": {
    title: "Liveaboards",
    description: ""
  },
  "/admin/liveaboards/new": {
    title: "Add New Liveaboard",
    description: "Create a focused liveaboard workspace without the rest of the list in view."
  },
  "/admin/hotels": {
    title: "Hotels",
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
  children,
  logoUrl
}: {
  children: React.ReactNode;
  logoUrl: string;
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
          <Link href="/" className="admin-brand-row" aria-label="Go to Exciting Maldives website">
            <img src={logoUrl} alt="Exciting Maldives" className="admin-brand-logo" />
          </Link>
          <p>Admin Portal</p>
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
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

        </nav>

        <form action={logoutFromAdmin} className="admin-logout">
          <div className="admin-sidebar-user">
            <span className="admin-sidebar-avatar" aria-hidden="true">SA</span>
            <span className="admin-sidebar-user-copy">
              <strong>Super Admin</strong>
              <small>CMS workspace</small>
            </span>
          </div>
          <SubmitButton idleLabel="Logout" pendingLabel="Logging out..." icon={<LogOut className="admin-icon" />} variant="secondary" className="admin-logout-button" />
        </form>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-copy">
            <h2>{current.title}</h2>
          </div>
          <div className="admin-topbar-actions">
            <label className="admin-topbar-search">
              <Search className="admin-icon" />
              <input type="search" placeholder="Search CMS" />
            </label>
            <Link href="/admin/resorts/new" className="admin-topbar-primary">
              <Sparkles className="admin-icon" />
              New Content
            </Link>
            <button type="button" className="admin-icon-button" aria-label="Notifications">
              <Bell className="admin-icon" />
              <span className="admin-notification-dot" aria-hidden="true" />
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
