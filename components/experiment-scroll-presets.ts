import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const motion = {
  home: { y: 12, opacity: 0.91, duration: 0.62 },
  card: { y: 6, opacity: 0.91, duration: 0.38 },
  detail: { y: 9, opacity: 0.91, duration: 0.52 },
  quiet: { y: 5, opacity: 0.94, duration: 0.34 },
  image: { scale: 1.022, yPercent: -0.75, opacity: 0.96, duration: 0.46 },
  hero: { scale: 1.085, yPercent: 3.5, rotationX: -2, copyY: -17, copyOpacity: 0.76, scrub: 0.35 },
  parallax: { scale: 1.04, yPercent: 1.15, scrub: 0.4 },
  stagger: 0.038,
  mobileDistance: 0.5,
} as const;

const targets = {
  home: ".lux-home :is(.lux-section-heading, .lux-stat-strip__grid, .lux-portrait-card, .market-editorial__visual), .mobile-v2-home :is(.mv2-section > h2, .mv2-ceo, .mv2-story-image, .mv2-editorial-visual, .mv2-stat)",
  card: ".portfolio-card:not(.portfolio-card--skeleton), .mobile-explore-v8__card",
  detail: ".resort-story-page :is(.property-detail-overview, .property-detail-curated__heading, .resort-story-room-card__body, section > .site-container > h2), .guide-article :is(h2, figure)",
  quiet: ":is(main, .partner-layout .dashboard) :is(h1, h2)",
} as const;

const detailMedia = ".resort-story-room-card__media > img, .resort-story-similar-card__image > img";
const cardImage = ".portfolio-card__media > img, .mobile-explore-v8__photo > img";
const cardKind = /^\/(resorts|hotels|liveaboards)\/?$/;
const detailKind = /^\/(resorts|hotels|liveaboards|travel-guide)\/[^/]+\/?$/;

function hasBox(element: HTMLElement) {
  return element.getClientRects().length > 0 && element.getBoundingClientRect().height > 0;
}

export function startScrollMotion(pathname: string, desktop: boolean) {
  gsap.registerPlugin(ScrollTrigger);

  const home = pathname === "/";
  const kind = home ? "home" : cardKind.test(pathname) ? "card" : detailKind.test(pathname) ? "detail" : "quiet";
  const preset = motion[kind];
  const selector = kind === "quiet" ? targets.quiet : `${targets[kind]}, main h1`;
  const seen = new WeakSet<HTMLElement>();
  const tracked = new Set<HTMLElement>();
  const triggers = new Map<HTMLElement, ScrollTrigger>();
  const pending = new Set<HTMLElement>();
  let frame = 0;
  let flushTimer = 0;

  const context = gsap.context(() => {
    if (!home) {
      if ((kind === "quiet" || kind === "detail") && window.scrollY < 10 && !window.location.hash) {
        const title = Array.from(document.querySelectorAll<HTMLElement>("main h1, .partner-layout .dashboard h1")).find(hasBox);
        if (title && title.getBoundingClientRect().top < window.innerHeight) {
          gsap.from(title, {
            y: desktop ? motion.quiet.y : motion.quiet.y * motion.mobileDistance,
            opacity: motion.quiet.opacity, duration: motion.quiet.duration,
            ease: "power2.out", clearProps: "transform,opacity",
          });
        }
      }
      return;
    }
    const hero = Array.from(document.querySelectorAll<HTMLElement>(".lux-hero, .mv2-hero")).find(hasBox);
    if (!hero) return;

    const copy = hero.querySelector<HTMLElement>(".lux-hero__copy, .mv2-hero__copy");
    if (copy && window.scrollY < 10 && !window.location.hash) {
      gsap.from(copy, {
        y: desktop ? 9 : 4, opacity: 0.93, duration: desktop ? 0.7 : 0.4,
        ease: "power3.out", clearProps: "transform,opacity",
      });
    }

    if (!desktop) return;
    const media = hero.querySelector<HTMLElement>(".lux-hero__media, .mv2-hero__bg");
    const exit = hero.querySelector<HTMLElement>(".lux-hero__inner");
    const scrub = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: hero, start: "top top", end: "bottom top", scrub: motion.hero.scrub,
      },
    });
    if (media) {
      scrub.to(media, {
        scale: motion.hero.scale, yPercent: motion.hero.yPercent,
        transformPerspective: 950, rotationX: motion.hero.rotationX, duration: 1,
      }, 0);
    }
    if (exit) {
      scrub.to(exit, {
        y: motion.hero.copyY, opacity: motion.hero.copyOpacity, duration: 0.7,
      }, 0.22);
    }
  });

  function flush() {
    flushTimer = 0;
    const batch = Array.from(pending).filter((node) => node.isConnected && hasBox(node) && !node.contains(document.activeElement));
    pending.clear();
    if (!batch.length) return;

    context.add(() => {
      const delay = kind === "card" && desktop ? motion.stagger : 0;
      batch.forEach((node, index) => {
        const start = Math.min(index, 3) * delay;
        // Cards keep their existing CSS hover transform. Only the image and card opacity animate.
        gsap.from(node, {
          ...(kind !== "card" && { y: preset.y * (desktop ? 1 : motion.mobileDistance) }),
          opacity: preset.opacity, duration: preset.duration, delay: start, ease: "power2.out",
          immediateRender: false, clearProps: kind === "card" ? "opacity" : "transform,opacity",
        });
        const image = kind === "card" ? node.querySelector<HTMLElement>(cardImage) : null;
        if (image && desktop && !node.matches(":hover")) {
          gsap.from(image, {
            ...motion.image, delay: start, ease: "power2.out", immediateRender: false,
            clearProps: "transform,opacity",
          });
        }
      });
    });
  }

  // Only nearby elements get a ScrollTrigger; catalogues can render hundreds of cards.
  const nearby = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      const node = target as HTMLElement;
      if (!node.isConnected || !hasBox(node)) continue;
      nearby.unobserve(node);
      tracked.delete(node);
      seen.add(node);

      if (kind === "detail" && desktop && node.matches(detailMedia)) {
        context.add(() => {
          gsap.fromTo(node, { scale: motion.parallax.scale, yPercent: -motion.parallax.yPercent }, {
            scale: motion.parallax.scale, yPercent: motion.parallax.yPercent, ease: "none",
            scrollTrigger: {
              trigger: node.parentElement, start: "top bottom", end: "bottom top", scrub: motion.parallax.scrub,
            },
          });
        });
        continue;
      }

      const box = node.getBoundingClientRect();
      if (box.top < window.innerHeight - 36) continue;
      const trigger = ScrollTrigger.create({
        trigger: node,
        start: "top bottom-=18",
        once: true,
        onEnter: (self) => {
          self.kill();
          triggers.delete(node);
          pending.add(node);
          if (!flushTimer) flushTimer = window.setTimeout(flush, 24);
        },
      });
      if (!pending.has(node)) triggers.set(node, trigger);
    }
  }, { rootMargin: "220px 0px" });

  function scan() {
    frame = 0;
    for (const node of tracked) {
      if (node.isConnected) continue;
      nearby.unobserve(node);
      tracked.delete(node);
    }
    for (const [node, trigger] of triggers) {
      if (node.isConnected && hasBox(node)) continue;
      trigger.kill();
      triggers.delete(node);
      if (node.isConnected) seen.delete(node);
    }
    document.querySelectorAll<HTMLElement>(kind === "detail" && desktop ? `${selector}, ${detailMedia}` : selector)
      .forEach((node) => {
        if (seen.has(node) || tracked.has(node) || !hasBox(node)) return;
        if (node.closest(".lux-hero, .mv2-hero, [role='dialog'], [aria-hidden='true']")) return;
        tracked.add(node);
        nearby.observe(node);
      });
  }

  function queueScan() {
    if (!frame) frame = requestAnimationFrame(scan);
  }

  // Filters, pagination and streamed navigation can replace targets after the initial scan.
  const updates = new MutationObserver(queueScan);
  updates.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", queueScan, { passive: true });
  scan();

  return () => {
    cancelAnimationFrame(frame);
    clearTimeout(flushTimer);
    window.removeEventListener("resize", queueScan);
    updates.disconnect();
    nearby.disconnect();
    triggers.forEach((trigger) => trigger.kill());
    context.revert();
  };
}
