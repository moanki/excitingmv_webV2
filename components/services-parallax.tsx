"use client";

import { ArrowRight, Sparkle } from "lucide-react";

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

export function ServicesParallax({ services, images, title, description }: ServicesParallaxProps) {
  const enabledServices = services.filter((service) => service.enabled && service.title);
  const heroImage = enabledServices.find((service) => service.imageUrl)?.imageUrl || images[0] || servicesFallbackImage;
  const visibleServices = enabledServices.slice(0, 6);

  return (
    <div className="services-editorial">
      <div className="services-editorial__hero">
        <div className="services-editorial__heading">
          <p className="lux-eyebrow">Destination Management</p>
          <h2>{title || "Your Maldives DMC, behind every seamless journey"}</h2>
          {description ? <p>{description}</p> : null}
          <a href="/services" className="services-editorial__link">
            Explore DMC Services
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>

        <div className="services-editorial__media">
          <img
            src={optimizedImageUrl(heroImage, { width: 1300, height: 920, quality: 92 })}
            alt="Maldives destination management services"
            width={1300}
            height={920}
            loading="lazy"
          />
          <div className="services-editorial__badge">
            <Sparkle size={20} aria-hidden="true" />
            Maldives-based support
          </div>
        </div>
      </div>

      {visibleServices.length ? (
        <div className="services-editorial__strip" aria-label="Destination management services">
          {visibleServices.map((service, index) => (
            <a className="services-editorial__item" href="/services" key={`${service.title}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{service.title}</strong>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
