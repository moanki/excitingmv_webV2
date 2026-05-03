"use client";

import { useEffect, useRef, useState } from "react";
import type { HomepageWhyUsItem } from "@/lib/site-content";

type WhyUsParallaxProps = {
  items: HomepageWhyUsItem[];
  images: string[];
  title?: string;
  description?: string;
};

/**
 * Freeze-screen parallax for "Why Us" — identical to ServicesParallax but
 * with text on the LEFT and image on the RIGHT.
 */
export function WhyUsParallax({ items, images, title, description }: WhyUsParallaxProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const enabledItems = items.filter((s) => s.title);
  const count = enabledItems.length;

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
      className="svc-parallax svc-parallax--reverse"
      ref={sectionRef}
      style={{ height: `${Math.max(count, 1) * 100}vh` }}
    >
      <div className="svc-parallax__sticky">
        {/* Left: text column */}
        <div className="svc-parallax__text-col">
          {title ? (
            <div className="svc-parallax__heading">
              <p className="lux-eyebrow">{title}</p>
              {description ? <span>{description}</span> : null}
            </div>
          ) : null}
          {enabledItems.map((item, index) => (
            <div
              key={item.title}
              className={`svc-parallax__item ${activeIndex === index ? "is-active" : ""}`}
            >
              <div className="svc-parallax__item-icon">◉</div>
              <div className="svc-parallax__item-body">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right: image panel */}
        <div className="svc-parallax__media-col">
          <div className="svc-parallax__media-sticky">
            {enabledItems.map((item, index) => (
              <div
                key={item.title}
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
      </div>
    </div>
  );
}
