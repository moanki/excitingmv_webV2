"use client";

import { ArrowRight, BadgeCheck, Handshake, Headphones, Plane, Sparkles } from "lucide-react";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { HomepageServiceItem } from "@/lib/site-content";

type ServicesParallaxProps = {
  services: HomepageServiceItem[];
  images: string[];
  title?: string;
  description?: string;
};

const servicesFallbackImage =
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1600&q=92";

const dmcServices = [
  {
    title: "Resort Contracting",
    description: "Preferred resort access, commercial clarity, and product-fit guidance.",
    Icon: Handshake,
  },
  {
    title: "Itinerary & Transfer Planning",
    description: "Seaplane, domestic flight, and speedboat coordination across islands.",
    Icon: Plane,
  },
  {
    title: "VIP / CIP Arrival",
    description: "Airport handling, lounge support, meet-and-greet, and arrival flow.",
    Icon: BadgeCheck,
  },
  {
    title: "Concierge & Experiences",
    description: "Private dining, celebrations, wellness, family, and special requests.",
    Icon: Sparkles,
  },
  {
    title: "Partner Operations",
    description: "Live booking support, urgent requests, updates, and tactical offers.",
    Icon: Headphones,
  },
];

export function ServicesParallax({ services, images, title, description }: ServicesParallaxProps) {
  const enabledServices = services.filter((service) => service.enabled && service.title);
  const heroImage = enabledServices.find((service) => service.imageUrl)?.imageUrl || images[0] || servicesFallbackImage;

  return (
    <div className="lux-container services-editorial">
      <div className="services-editorial__media">
        <img
          src={optimizedImageUrl(heroImage, { width: 980, height: 1320, quality: 92 })}
          alt="Maldives destination management services"
          width={980}
          height={1320}
          loading="lazy"
        />
        <div className="services-editorial__overlay" aria-hidden="true" />
      </div>

      <div className="services-editorial__content">
        <div className="services-editorial__heading">
          <p className="lux-eyebrow">Destination Management</p>
          <h2>{title || "Built around every Maldives booking."}</h2>
          <p>
            {description ||
              "We support travel professionals with resort intelligence, transfer planning, arrival handling, and in-destination support — all managed with local precision."}
          </p>
        </div>

        <div className="services-editorial__list" aria-label="Destination management services">
          {dmcServices.map(({ title: serviceTitle, description: serviceDescription, Icon }) => (
            <div className="services-editorial__row" key={serviceTitle}>
              <span className="services-editorial__icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="services-editorial__text">
                <strong>{serviceTitle}</strong>
                <span>{serviceDescription}</span>
              </span>
            </div>
          ))}
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
