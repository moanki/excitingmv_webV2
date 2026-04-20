import Link from "next/link";

const settingsSections = [
  {
    title: "Homepage Content",
    description: "Hero, stats, CEO message, story, services, awards, travel guide, and newsletter.",
    href: "/admin/settings/homepage"
  },
  {
    title: "Navbar & Logos",
    description: "Primary logo, white logo, black logo, navigation items, and CTA.",
    href: "/admin/settings/navbar"
  },
  {
    title: "Footer & Contact",
    description: "Address, contact details, footer groups, memberships, awards, and resource links.",
    href: "/admin/settings/footer"
  },
  {
    title: "WhatsApp",
    description: "Floating WhatsApp CTA label, number, link, and message.",
    href: "/admin/settings/whatsapp"
  },
  {
    title: "Notification Emails",
    description: "Partner request and newsletter notification recipients.",
    href: "/admin/settings/notifications"
  },
  {
    title: "Primary Markets",
    description: "Dropdown options used across homepage forms and lead capture flows.",
    href: "/admin/settings/markets"
  }
];

export default function AdminSettingsIndexPage() {
  return (
    <div className="stack">
      <section>
        <p className="eyebrow">Site Settings</p>
        <h1 className="section-title">Manage each front-end area from its own admin screen.</h1>
        <p className="muted">
          Homepage sections, logos, footer details, WhatsApp, markets, and notification routing are now split into separate screens.
        </p>
      </section>

      <div className="dashboard-grid">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href} className="stat-card">
            <p className="eyebrow">{section.title}</p>
            <p>{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
