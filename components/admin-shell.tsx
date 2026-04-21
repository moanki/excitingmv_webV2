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
  Search,
  Settings2,
  Shield,
  Sparkles,
  Users,
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
        description: "Review registrations and status changes",
        icon: Building2
      },
      {
        href: "/admin/newsletters",
        label: "Newsletter Leads",
        description: "Lead capture and export queue",
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
        label: "Resources",
        description: "Partner documents and access",
        icon: FolderKanban
      },
      {
        href: "/admin/imports",
        label: "AI Import Center",
        description: "Batch intake and extraction review",
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
    description: "Operational pulse across approvals, content, and access control."
  },
  "/admin/partners": {
    title: "Partner Queue",
    description: "Review registrations, decisions, and follow-up context."
  },
  "/admin/resorts": {
    title: "Resort Manager",
    description: "Maintain listings, editorial data, and publish readiness."
  },
  "/admin/resources": {
    title: "Resource Library",
    description: "Organize protected files and public resource inventory."
  },
  "/admin/newsletters": {
    title: "Newsletter Leads",
    description: "Monitor new leads and export lists for outreach."
  },
  "/admin/chat": {
    title: "Chat Inbox",
    description: "Triage active conversations and respond with context."
  },
  "/admin/imports": {
    title: "AI Import Center",
    description: "Track batch intake, extraction status, and review flow."
  },
  "/admin/settings": {
    title: "Site Settings",
    description: "Adjust the live site configuration from a structured control center."
  },
  "/admin/user-access": {
    title: "User Access",
    description: "Create admins, assign access, and manage active users."
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

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = pageMeta[pathname] ?? pageMeta["/admin"];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand-block">
          <p className="admin-kicker">Exciting Maldives</p>
          <div>
            <h1>Admin Center</h1>
            <p>Quiet, structured workspace for operations, content, and approvals.</p>
          </div>
        </div>

        <label className="admin-sidebar-search" aria-label="Search navigation">
          <Search className="admin-search-icon" />
          <input type="search" placeholder="Search modules" />
        </label>

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
                      <span>
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
          <button type="submit" className="button-muted admin-logout-button">
            <LogOut className="admin-icon" />
            Logout
          </button>
        </form>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-breadcrumb">Admin Center / {current.title}</p>
            <h2>{current.title}</h2>
            <p>{current.description}</p>
          </div>
          <div className="admin-topbar-actions">
            <label className="admin-commandbar" aria-label="Search workspace">
              <Search className="admin-search-icon" />
              <input type="search" placeholder="Search records, settings, or modules" />
            </label>
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
