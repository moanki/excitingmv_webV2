import Link from "next/link";

const homepageSections = [
  { title: "Hero", href: "/admin/settings/homepage/hero" },
  { title: "Feature Cards", href: "/admin/settings/homepage/features" },
  { title: "Expertise Stats", href: "/admin/settings/homepage/stats" },
  { title: "CEO Message", href: "/admin/settings/homepage/ceo" },
  { title: "Our Story", href: "/admin/settings/homepage/story" },
  { title: "Services", href: "/admin/settings/homepage/services" },
  { title: "Why Us", href: "/admin/settings/homepage/why-us" },
  { title: "Awards", href: "/admin/settings/homepage/awards" },
  { title: "Travel Guide", href: "/admin/settings/homepage/guide" },
  { title: "Newsletter", href: "/admin/settings/homepage/newsletter" }
];

export default function AdminHomepageSettingsIndexPage() {
  return (
    <div className="stack">
      <section>
        <p className="eyebrow">Homepage</p>
        <h1 className="section-title">Manage each homepage block individually.</h1>
      </section>
      <div className="dashboard-grid">
        {homepageSections.map((section) => (
          <Link key={section.href} href={section.href} className="stat-card">
            <p className="eyebrow">{section.title}</p>
            <p>Open the dedicated admin screen for this homepage section.</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
