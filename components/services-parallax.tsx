"use client";

import { useEffect, useRef, useState } from "react";
import type { HomepageServiceItem } from "@/lib/site-content";

type ServicesParallaxProps = {
  services: HomepageServiceItem[];
  images: string[];
  title?: string;
  description?: string;
};

const serviceIcons: Record<string, string> = {
  "badge-percent": "◈",
  "briefcase-business": "◉",
  headphones: "◎",
  plane: "◆",
  route: "◇",
  "users-round": "◈",
};

/**
 * Freeze-screen parallax: the entire section is pinned while the user scrolls
 * through each service. The image on the left crossfades to match. Once all
 * items have been shown, the section un-pins and normal scrolling resumes.
 */
export function ServicesParallax({ services, images, title, description }: ServicesParallaxProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const enabledServices = services.filter((s) => s.enabled && s.title);
  const count = enabledServices.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || count < 1) return;

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const scrolled = window.scrollY - sectionTop;
      const totalScrollRange = section.scrollHeight - window.innerHeight;

      if (scrolled < 0 || totalScrollRange <= 0) {
        setActiveIndex(0);
        return;
      }

      const progress = Math.min(scrolled / totalScrollRange, 1);
      const idx = Math.min(Math.floor(progress * count), count - 1);
      setActiveIndex(idx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [count]);

  return (
    <div
      className="svc-parallax"
      ref={sectionRef}
      style={{ height: `${Math.max(count, 1) * 100}vh` }}
    >
      <div className="svc-parallax__sticky">
        {/* Left: image panel */}
        <div className="svc-parallax__media-col">
          <div className="svc-parallax__media-sticky">
            {enabledServices.map((service, index) => (
              <div
                key={service.title}
                className={`svc-parallax__image ${activeIndex === index ? "is-active" : ""}`}
                style={{
                  backgroundImage: `url(${images[index % images.length]})`,
                }}
                aria-hidden="true"
              >
                <div className="svc-parallax__image-overlay" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: text items */}
        <div className="svc-parallax__text-col">
          {title ? (
            <div className="svc-parallax__heading">
              <p className="lux-eyebrow">{title}</p>
              {description ? <span>{description}</span> : null}
            </div>
          ) : null}
          {enabledServices.map((service, index) => (
            <div
              key={service.title}
              className={`svc-parallax__item ${activeIndex === index ? "is-active" : ""}`}
            >
              <div className="svc-parallax__item-icon">
                {serviceIcons[service.icon] ?? "◉"}
              </div>
              <div className="svc-parallax__item-body">
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
