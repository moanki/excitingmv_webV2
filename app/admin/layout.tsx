import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/resorts", label: "Resorts" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/newsletters", label: "Newsletter Leads" },
  { href: "/admin/chat", label: "Chat Inbox" },
  { href: "/admin/imports", label: "AI Import Center" },
  { href: "/admin/settings", label: "Site Settings" }
];

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="brand">Admin Center</div>
        <nav aria-label="Admin">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="dashboard">{children}</div>
    </div>
  );
}
