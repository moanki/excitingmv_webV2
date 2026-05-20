import Link from "next/link";
import { BadgePercent, BriefcaseBusiness, Headphones, Plane, Route, UsersRound } from "lucide-react";

import { optimizedImageUrl } from "@/lib/image-urls";
import { getHomepageFeatures, getHomepageServices, getHomepageWhyUs } from "@/lib/site-content";

const iconMap = {
  "badge-percent": BadgePercent,
  "briefcase-business": BriefcaseBusiness,
  headphones: Headphones,
  plane: Plane,
  route: Route,
  "users-round": UsersRound
};

function getIcon(name: string) {
  return iconMap[name as keyof typeof iconMap] ?? BriefcaseBusiness;
}

export default async function ServicesPage() {
  const [{ content: services }, { content: highlights }, { content: whyUs }] = await Promise.all([
    getHomepageServices("published"),
    getHomepageFeatures("published"),
    getHomepageWhyUs("published")
  ]);
  const enabledServices = services.filter((service) => service.enabled && service.title);
  const heroImage =
    enabledServices.find((service) => service.imageUrl)?.imageUrl ||
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1800&q=86";

  return (
    <main className="public-lux-page">
      <section className="public-lux-hero public-lux-hero--dark">
        <div className="public-lux-hero__background">
          <img src={optimizedImageUrl(heroImage, { width: 1800, height: 1000, quality: 80 })} alt="" width={1800} height={1000} fetchPriority="high" />
        </div>
        <div className="lux-container public-lux-hero__overlay-copy">
          <p className="lux-eyebrow">DMC Services</p>
          <h1>Operational support, contracting, and premium sales enablement.</h1>
          <p>
            Exciting Maldives supports travel partners with destination knowledge, luxury resort access,
            and on-ground coordination designed for commercially active B2B teams.
          </p>
          <Link href="/partner/register" className="lux-button lux-button--gold">Start a Partnership</Link>
        </div>
      </section>

      <section className="public-lux-section">
        <div className="lux-container services-index">
          <div className="services-index__image">
            <img
              src={optimizedImageUrl(heroImage, { width: 840, height: 1040, quality: 78 })}
              alt="Maldives destination management services"
              width={840}
              height={1040}
              loading="lazy"
            />
          </div>
          <div className="services-index__list">
            <p className="lux-eyebrow">Service Index</p>
            <h2>DMC support shaped for luxury travel partners.</h2>
            {enabledServices.map((service, index) => {
              const Icon = getIcon(service.icon);
              return (
                <article className="services-index__row" key={service.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={20} />
                  <div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="public-lux-section public-lux-section--sand">
        <div className="lux-container">
          <div className="public-lux-bento">
            {[...highlights, ...whyUs].slice(0, 6).map((item, index) => (
              <article className={`public-lux-card${index === 0 ? " public-lux-card--wide" : ""}`} key={item.title}>
                <p className="lux-eyebrow">Partner Value</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
