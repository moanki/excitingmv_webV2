"use client";

import { useEffect, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import "lenis/dist/lenis.css";

const copy = [
  ".lux-hero__copy > :is(h1, p, .lux-hero__actions)",
  ".mv2-hero__copy > :is(h1, p, .mv2-hero__actions)",
  ".lux-section-heading, .lux-heading-row > a",
  ".lux-editorial-copy, .lux-story-copy, .market-editorial__copy",
  ".services-editorial__heading, .services-editorial__cta, .why-trust__intro",
  ".opening-home__header, .opening-home__footer, .opening-home--empty .opening-home__link",
  ".lux-partner-cta__inner > :is(p, h2, div, button, a)",
  ".lux-contact-copy > :is(p, h2, .lux-contact-assurance), .lux-contact-card",
  ".mv2-section > :is(p, h2, .mv2-section__header, .mv2-destination-tabs, .mv2-newsletter-card)",
  ".mv2-ceo > :is(h2, p), .mv2-focus-retreats__head",
  ".mv2-partner-cta > :is(p, h2, .mv2-perks, button, a)",
].join(", ");

const cardGroups = [
  ".lux-retreat-carousel, .home-guide-preview, .lux-stat-strip__grid, .lux-awards-strip",
  ".services-editorial__list, .why-trust__reasons",
  ".mobile-featured-carousel__track, .mv2-stats, .mv2-market-list",
  ".mv2-service-grid, .mv2-why-list, .mv2-award-scroll, .mv2-insight-list",
].join(", ");

const entrance = {
  y: 30,
  opacity: 0,
  ease: "power3.out",
  immediateRender: false,
  clearProps: "transform,opacity",
};

function setupReveals(layout: HTMLElement) {
  return gsap.context(() => {
    for (const block of layout.querySelectorAll<HTMLElement>(copy)) {
      if (block.getClientRects().length === 0) continue;
      gsap.from(block, {
        ...entrance,
        duration: 1,
        scrollTrigger: { trigger: block, start: "top 85%", once: true },
      });
    }

    for (const group of layout.querySelectorAll<HTMLElement>(cardGroups)) {
      const cards = Array.from(group.children).filter(card => card.getClientRects().length > 0);
      if (!cards.length) continue;
      gsap.from(cards, {
        ...entrance,
        duration: 0.9,
        stagger: 0.12,
        scrollTrigger: { trigger: group, start: "top 80%", once: true },
      });
    }
  }, layout);
}

export function HomepageScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const home = document.querySelector<HTMLElement>(".lux-home");
    if (!home) return;

    gsap.registerPlugin(ScrollTrigger);
    const preference = gsap.matchMedia();
    preference.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({
        lerp: 0.08,
        syncTouch: false,
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
      });
      const offScroll = lenis.on("scroll", () => ScrollTrigger.update());
      const tick = (seconds: number) => lenis.raf(seconds * 1000);
      gsap.ticker.lagSmoothing(0);
      gsap.ticker.add(tick);

      const layouts = gsap.matchMedia();
      const variants = [
        ["(width > 768px)", ".lux-home__desktop"],
        ["(max-width: 768px)", ".mobile-v2-home"],
      ] as const;
      for (const [query, selector] of variants) {
        const layout = home.querySelector<HTMLElement>(selector);
        if (!layout) continue;
        layouts.add(query, () => {
          const reveals = setupReveals(layout);
          return () => reveals.revert();
        });
      }

      return () => {
        layouts.revert();
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        offScroll();
        lenis.destroy();
      };
    });

    return () => preference.revert();
  }, []);

  return children;
}
