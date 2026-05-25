"use client";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { HomepageServiceItem } from "@/lib/site-content";

type ServicesParallaxProps = {
  services: HomepageServiceItem[];
  images: string[];
  title?: string;
  description?: string;
};

export function ServicesParallax({ services, images, title, description }: ServicesParallaxProps) {
  const enabledServices = services.filter((service) => service.enabled && service.title);
  const heroImage = enabledServices.find((service) => service.imageUrl)?.imageUrl || images[0];
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
            <span aria-hidden="true">→</span>
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
            <span aria-hidden="true">*</span>
            Maldives-based support
          </div>
        </div>
      </div>

      <div className="services-editorial__strip" aria-label="Destination management services">
        {visibleServices.map((service, index) => (
          <a className="services-editorial__item" href="/services" key={`${service.title}-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{service.title}</strong>
          </a>
        ))}
      </div>
    </div>
  );
}
