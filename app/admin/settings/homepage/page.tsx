import Link from "next/link";
import { Award, BarChart3, BookOpen, GripVertical, Home, Image, Mail, MessageSquareText, Pencil, ShieldCheck, Sparkles, Star } from "lucide-react";

const homepageSections = [
  { title: "Hero Banner", description: "Main headline, subtext, media and CTA", href: "/admin/settings/homepage/hero", icon: Image },
  { title: "Feature Cards", description: "Homepage feature highlights", href: "/admin/settings/homepage/features", icon: Sparkles },
  { title: "Featured Resorts", description: "Curated resort selection and order", href: "/admin/settings/homepage/featured-resorts", icon: Star },
  { title: "Stats Bar", description: "Key expertise numbers", href: "/admin/settings/homepage/stats", icon: BarChart3 },
  { title: "CEO Message", description: "Personal note from leadership", href: "/admin/settings/homepage/ceo", icon: MessageSquareText },
  { title: "Our Story", description: "Company introduction", href: "/admin/settings/homepage/story", icon: Home },
  { title: "Services", description: "DMC service highlights", href: "/admin/settings/homepage/services", icon: ShieldCheck },
  { title: "Why Us", description: "Reasons to choose Exciting Maldives", href: "/admin/settings/homepage/why-us", icon: Sparkles },
  { title: "Awards", description: "Industry recognition", href: "/admin/settings/homepage/awards", icon: Award },
  { title: "Travel Guide", description: "Curated guide preview", href: "/admin/settings/homepage/guide", icon: BookOpen },
  { title: "Newsletter", description: "Email signup section", href: "/admin/settings/homepage/newsletter", icon: Mail }
];

export default function AdminHomepageSettingsIndexPage() {
  return (
    <section className="settings-panel-v3">
      <header className="settings-panel-v3__header"><h1>Homepage</h1><p>Manage each homepage section</p></header>
      <div className="hp-sections-v3">
        {homepageSections.map(({ title, description, href, icon: Icon }) => (
          <div className="hp-section-row-v3" key={href}>
            <GripVertical className="hp-drag-v3" />
            <span className="hp-section-icon-v3"><Icon /></span>
            <div className="hp-section-info-v3"><strong>{title}</strong><span>{description}</span></div>
            <Link href={href} className="act-btn" aria-label={`Edit ${title}`}><Pencil className="admin-icon" /></Link>
          </div>
        ))}
      </div>
    </section>
  );
}
