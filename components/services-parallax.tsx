"use client";

import { useEffect, useRef, useState } from "react";

import type { HomepageServiceItem } from "@/lib/site-content";

type ServicesParallaxProps = {
  services: HomepageServiceItem[];
  images: string[];
  title?: string;
  description?: string;
};

export function ServicesParallax({ services, images, title, description }: ServicesParallaxProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const enabledServices = services.filter((service) => service.enabled && service.title);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visible?.target instanceof HTMLElement) {
          const index = Number(visible.target.dataset.index);
          if (Number.isFinite(index)) {
            setActiveIndex(index);
          }
        }
      },
      {
        rootMargin: "-30% 0px -45% 0px",
        threshold: [0.25, 0.5, 0.75]
      }
    );

    itemRefs.current.filter(Boolean).forEach((item) => observer.observe(item as Element));

    return () => observer.disconnect();
  }, [enabledServices.length]);

  return (
    <div className="services-editorial">
      <div className="services-editorial__media" aria-hidden="true">
        {enabledServices.map((service, index) => (
          <div
            key={service.title}
            className={`services-editorial__image ${activeIndex === index ? "is-active" : ""}`}
            style={{ backgroundImage: `url(${images[index % images.length]})` }}
          />
        ))}
      </div>

      <div className="services-editorial__content">
        <div className="services-editorial__heading">
          <p className="lux-eyebrow">Destination Management</p>
          <h2>{title || "DMC Services"}</h2>
          {description ? <p>{description}</p> : null}
        </div>

        <div className="services-editorial__list">
          {enabledServices.map((service, index) => (
            <div
              className={`services-editorial__item ${activeIndex === index ? "is-active" : ""}`}
              key={service.title}
              data-index={index}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
