"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  FolderKanban,
  Gauge,
  Image,
  LayoutTemplate,
  LifeBuoy,
  Mail,
  KeyRound,
  Settings2,
  Shield,
  Ship,
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
  "/admin/chat": {
    title: "Chat Inbox",
    description: ""
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
  logoUrl,
  initialUnreadChatCount = 0
}: {
  children: React.ReactNode;
  logoUrl?: string;
  initialUnreadChatCount?: number;
}) {
  const pathname = usePathname();
  const current = getCurrentPageMeta(pathname);
  const [unreadChatCount, setUnreadChatCount] = useState(initialUnreadChatCount);

  useEffect(() => {
    let cancelled = false;

    async function refreshUnreadCount() {
      const response = await fetch("/api/admin/chat/unread", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { count?: number } | null;

      if (!cancelled && response.ok) {
        setUnreadChatCount(Number(payload?.count ?? 0));
      }
    }

    void refreshUnreadCount();
    const timer = window.setInterval(refreshUnreadCount, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand-block">
          {logoUrl ? <img src={logoUrl} alt="Exciting Maldives" className="admin-brand-logo" /> : null}
          <div>
            <h1>Admin Center</h1>
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
                        <strong>
                          {item.href === "/admin/chat" && unreadChatCount > 0
                            ? `${item.label} (${unreadChatCount})`
                            : item.label}
                        </strong>
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
              {unreadChatCount > 0 ? <span className="admin-notification-count">{unreadChatCount}</span> : null}
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
