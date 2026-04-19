import Link from "next/link";

const navItems = [
  { href: "/partner", label: "Dashboard" },
  { href: "/partner/resorts", label: "Resorts" },
  { href: "/partner/resources", label: "Resources" },
  { href: "/partner/chat", label: "Live Chat" }
];

export default function PartnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="partner-layout">
      <aside className="sidebar">
        <div className="brand">Partner Portal</div>
        <nav aria-label="Partner">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <a href={process.env.SAMOA_EXTERNAL_URL ?? "#"} target="_blank" rel="noreferrer">
            Samoa
          </a>
        </nav>
      </aside>
      <div className="dashboard">{children}</div>
    </div>
  );
}
