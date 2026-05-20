import Link from "next/link";
import { Compass, Heart, Sparkles, Waves } from "lucide-react";

import { optimizedImageUrl } from "@/lib/image-urls";
import { listPublishedResorts } from "@/lib/services/resort-service";

const experienceThemes = [
  {
    title: "Private island escapes",
    description: "For couples and VIP travelers who want privacy, pace, and high-touch service.",
    icon: Heart
  },
  {
    title: "Family luxury",
    description: "Resorts with spacious villa inventory, practical transfers, and strong family programming.",
    icon: Sparkles
  },
  {
    title: "Diving and marine life",
    description: "Experiences built around reef access, marine encounters, and destination-led adventure.",
    icon: Waves
  },
  {
    title: "Wellness and slow travel",
    description: "Properties suited to restorative itineraries, spa-led stays, and longer luxury escapes.",
    icon: Compass
  }
];

export default async function ExperiencesPage() {
  const resorts = await listPublishedResorts();
  const featuredImage =
    resorts.find((resort) => resort.heroImageUrl)?.heroImageUrl ||
    "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1800&q=86";

  return (
    <main className="public-lux-page">
      <section className="public-lux-hero public-lux-hero--split">
        <div className="lux-container public-lux-hero__grid">
          <div className="public-lux-hero__copy">
            <p className="lux-eyebrow">Experiences</p>
            <h1>Use-case led Maldives journeys for trade conversations.</h1>
            <p>
              Match each client profile to the right island rhythm, resort product, transfer logic, and
              destination experience with a more confident B2B lens.
            </p>
            <Link href="/resorts" className="lux-button lux-button--gold">Explore Resorts</Link>
          </div>
          <div className="public-lux-hero__image">
            <img
              src={optimizedImageUrl(featuredImage, { width: 980, height: 880, quality: 80 })}
              alt="Curated Maldives luxury experience"
              width={980}
              height={880}
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="public-lux-section public-lux-section--sand">
        <div className="lux-container">
          <div className="lux-section-heading">
            <p className="lux-eyebrow">Client Intent</p>
            <h2>Position the Maldives by experience, not only by property name.</h2>
            <p>Concise experience pathways help advisors and operators frame resort recommendations around the way clients actually travel.</p>
          </div>
          <div className="public-lux-bento">
            {experienceThemes.map((theme, index) => {
              const Icon = theme.icon;
              return (
                <article className={`public-lux-card${index === 0 ? " public-lux-card--wide" : ""}`} key={theme.title}>
                  <span className="lux-icon-box"><Icon size={21} /></span>
                  <h3>{theme.title}</h3>
                  <p>{theme.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="public-lux-section">
        <div className="lux-container">
          <div className="public-lux-heading-row">
            <div className="lux-section-heading">
              <p className="lux-eyebrow">Resort Fit</p>
              <h2>Featured retreats for these journeys</h2>
              <p>Image-led resort references for faster, more premium partner conversations.</p>
            </div>
            <Link href="/resorts" className="lux-text-link">View all resorts</Link>
          </div>
          <div className="public-lux-retreat-grid">
            {resorts.slice(0, 6).map((resort) => (
              <Link href={`/resorts/${resort.slug}`} className="public-lux-retreat-card" key={resort.slug}>
                <img
                  src={optimizedImageUrl(resort.heroImageUrl, { width: 640, height: 520, quality: 76 })}
                  alt={resort.name}
                  width={640}
                  height={520}
                  loading="lazy"
                />
                <div>
                  <span>{resort.category || "Luxury Resort"}</span>
                  <h3>{resort.name}</h3>
                  <p>{resort.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
