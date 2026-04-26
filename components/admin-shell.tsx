"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  FolderKanban,
  Gauge,
  LayoutTemplate,
  LifeBuoy,
  Mail,
  KeyRound,
  Settings2,
  Shield,
  Sparkles,
  UserCog,
  LogOut
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
        href: "/admin/chat",
        label: "Chat Inbox",
        description: "Unread conversations and replies",
        icon: LifeBuoy
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
        label: "AI Import Center",
        description: "Import intake and review",
        icon: Sparkles
      },
      {
        href: "/admin/settings",
        label: "Site Settings",
        description: "Front-end content configuration",
        icon: Settings2
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
      }
    ]
  }
];

const pageMeta: Record<string, { title: string; description: string }> = {
  "/admin": {
    title: "Admin Dashboard",
    description: ""
  },
  "/admin/partners": {
    title: "Partner Queue",
    description: ""
  },
  "/admin/resorts": {
    title: "Resort Manager",
    description: "Maintain listings, editorial data, and publish readiness."
  },
  "/admin/resorts/new": {
    title: "Add New Resort",
    description: "Create a focused property workspace without the rest of the resort list in view."
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
    title: "Newsletter Leads",
    description: ""
  },
  "/admin/chat": {
    title: "Chat Inbox",
    description: "Triage active conversations and respond with context."
  },
  "/admin/imports": {
    title: "AI Import Center",
    description: ""
  },
  "/admin/settings": {
    title: "Site Settings",
    description: "Adjust the live site configuration from a structured control center."
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

  const matchedEntry = Object.entries(pageMeta)
    .filter(([href]) => href !== "/admin" && pathname.startsWith(href))
    .sort((left, right) => right[0].length - left[0].length)[0];

  return matchedEntry?.[1] ?? pageMeta["/admin"];
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = getCurrentPageMeta(pathname);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand-block">
          <p className="admin-kicker">Exciting Maldives</p>
          <div>
            <h1>Admin Center</h1>
            <p>Operations workspace</p>
          </div>
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
            <p className="admin-breadcrumb">Admin Center / {current.title}</p>
            <h2>{current.title}</h2>
            {current.description ? <p>{current.description}</p> : null}
          </div>
          <div className="admin-topbar-actions">
            <button type="button" className="admin-icon-button" aria-label="Notifications">
              <Bell className="admin-icon" />
            </button>
            <div className="admin-user-chip">
              <span>SA</span>
              <div>
                <strong>Super Admin</strong>
                <small>Workspace access</small>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-canvas">{children}</main>
      </div>
    </div>
  );
}
