"use client";

import { ArrowRight, BadgeCheck, BadgePercent, BriefcaseBusiness, Handshake, Headphones, Plane, Route, Sparkles, UsersRound } from "lucide-react";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { HomepageServicesContent } from "@/lib/site-content";

type ServicesParallaxProps = {
  services: HomepageServicesContent;
  imageUrl: string;
};

const serviceIcons = {
  "badge-check": BadgeCheck,
  "badge-percent": BadgePercent,
  "briefcase-business": BriefcaseBusiness,
  handshake: Handshake,
  headphones: Headphones,
  plane: Plane,
  route: Route,
  sparkles: Sparkles,
  "users-round": UsersRound
};

export function ServicesParallax({ services, imageUrl }: ServicesParallaxProps) {
  const enabledServices = services.items.filter((service) => service.enabled && service.title);

  return (
    <div className="lux-container services-editorial">
      <div className="services-editorial__media">
        <img
          src={optimizedImageUrl(imageUrl, { width: 980, height: 1320, quality: 92 })}
          alt="Maldives destination management services"
          width={980}
          height={1320}
          loading="lazy"
        />
        <div className="services-editorial__overlay" aria-hidden="true" />
      </div>

      <div className="services-editorial__content">
        <div className="services-editorial__heading">
          <p className="lux-eyebrow">{services.sectionLabel}</p>
          <h2>{services.title}</h2>
          <p>{services.description}</p>
        </div>

        <div className="services-editorial__list" aria-label={`${services.sectionLabel} services`}>
          {enabledServices.map((service) => {
            const Icon = serviceIcons[service.icon as keyof typeof serviceIcons] ?? Handshake;
            return <div className="services-editorial__row" key={service.title}>
              <span className="services-editorial__icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="services-editorial__text">
                <strong>{service.title}</strong>
                <span>{service.description}</span>
              </span>
            </div>;
          })}
        </div>

        <div className="services-editorial__cta">
          <span>Need support for a Maldives booking?</span>
          <a href="/contact">
            Speak to our team
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
