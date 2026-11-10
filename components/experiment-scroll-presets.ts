import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const motion = {
  perspective: 1050,
  catalogue: { y: 12, z: 24, scale: 0.983, tilt: 0.8, opacity: 0.89, stagger: 0.035 },
  detail: { y: 23, z: 46, scale: 0.969, tilt: 1.2, opacity: 0.79 },
  quiet: { y: 12, z: 22, scale: 0.988, tilt: 0.65, opacity: 0.9 },
} as const;

type Depth = { y: number; z: number; scale: number; tilt: number; opacity: number; stagger?: number };

function visible(element: Element): element is HTMLElement {
  return element instanceof HTMLElement && element.offsetHeight > 0;
}

function first(selector: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find(visible);
}

function children(element: Element | undefined, selector: string) {
  return Array.from(element?.querySelectorAll<HTMLElement>(selector) ?? []).filter(visible);
}

function depth(origin: string) {
  return { transformOrigin: origin, transformPerspective: motion.perspective, transformStyle: "preserve-3d" };
}

function handoff(
  outgoing: HTMLElement | HTMLElement[] | undefined,
  incoming: HTMLElement | HTMLElement[] | undefined,
  anchor: HTMLElement | undefined,
  preset: Depth,
) {
  if (!outgoing || !incoming || !anchor) return;
  if (!gsap.utils.toArray(outgoing).length || !gsap.utils.toArray(incoming).length) return;

  return gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: anchor,
      start: "clamp(top 92%)",
      end: "top 37%",
      scrub: true,
    },
  })
    .fromTo(outgoing, { y: 0, z: 0, scale: 1, rotationX: 0, opacity: 1, ...depth("50% 60%") }, {
      y: -preset.y, z: -preset.z, scale: preset.scale, rotationX: preset.tilt,
      opacity: preset.opacity, duration: 0.92, immediateRender: false,
      stagger: preset.stagger,
    }, 0)
    .fromTo(incoming, {
      y: preset.y, z: -preset.z, scale: preset.scale, rotationX: -preset.tilt,
      opacity: preset.opacity, ...depth("50% 20%"),
    }, {
      y: 0, z: 0, scale: 1, rotationX: 0, opacity: 1, duration: 0.9,
      immediateRender: false, stagger: preset.stagger,
    }, 0.1);
}

function catalogueHandoffs() {
  const main = first(".destination-page, .mobile-explore-v8");
  if (!main) return;
  handoff(
    first(".catalogue-banner .destination-hero__copy"),
    first(".resort-v6-search, .mobile-explore-v8__search, .portfolio-results-main > div"),
    main,
    motion.catalogue,
  );

  // Attach row transitions only near the viewport. Filters replace the rows in place.
  let frame = 0;
  let width = window.innerWidth;
  let observeRows = () => {};
  function scan() {
    frame = 0;
    observeRows();
    const grid = main?.querySelector<HTMLElement>("#portfolio-grid .portfolio-grid, .mobile-explore-v8__grid");
    if (!grid) return;
    const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    const cards = Array.from(grid.children).filter(visible);
    const contexts = new Map<Element, gsap.Context>();
    const pairs = new Map<Element, [HTMLElement[], HTMLElement[]]>();

    const toolbar = first(".resort-v6-toolbar, .mobile-explore-v8__toolbar");
    for (let index = 0; index < cards.length; index += columns) {
      const outgoing = index === 0
        ? toolbar ? [toolbar] : []
        : cards.slice(index - columns, index).flatMap(card => children(card, ".portfolio-card__media, .mobile-explore-v8__photo"));
      const incoming = cards.slice(index, index + columns).flatMap(card => children(card, ".portfolio-card__link, .mobile-explore-v8__photo > img"));
      if (outgoing.length && incoming.length) pairs.set(cards[index], [outgoing, incoming]);
    }

    const nearby = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) {
          contexts.get(target)?.revert();
          contexts.delete(target);
          continue;
        }
        if (contexts.has(target)) continue;
        const pair = pairs.get(target);
        if (!pair || !(target instanceof HTMLElement)) continue;
        contexts.set(target, gsap.context(() => { handoff(...pair, target, motion.catalogue); }));
      }
    }, { rootMargin: "320px 0px" });

    pairs.forEach((_, node) => nearby.observe(node));
    observeRows = () => {
      nearby.disconnect();
      contexts.forEach(context => context.revert());
    };
  }

  function queueScan() {
    if (!frame) frame = requestAnimationFrame(scan);
  }
  function resize() {
    if (window.innerWidth === width) return;
    width = window.innerWidth;
    queueScan();
  }
  const changes = new MutationObserver(queueScan);
  changes.observe(main, { childList: true, subtree: true });
  window.addEventListener("resize", resize, { passive: true });
  scan();
  return () => {
    cancelAnimationFrame(frame);
    changes.disconnect();
    window.removeEventListener("resize", resize);
    observeRows();
  };
}

function detailHandoffs() {
  const hero = first(".property-detail-hero, .guide-article__hero");
  const intro = first(".property-detail-intro, .guide-article__body");
  if (!hero || !intro) return;
  const copy = children(hero, ":scope > .resort-story-hero__inner, :scope > .lux-container");
  const titleAndOverview = handoff(copy, children(intro, ":scope > div, :scope > aside"), intro, motion.detail);
  const photo = hero.querySelector(".experiment-property-photo");
  if (photo) {
    titleAndOverview?.fromTo(photo, { scale: 1.025, yPercent: 0 }, {
      scale: 1.085, yPercent: 2.8, duration: 1, immediateRender: false,
    }, 0);
  }

  const body = first(".resort-story-room-stack, .guide-article__content");
  const firstRoom = body?.querySelector<HTMLElement>(".resort-story-room-card--property");
  if (!firstRoom) return;
  handoff(
    first(".property-detail-overview"),
    children(firstRoom, ":scope > .resort-story-room-card__media, :scope > .resort-story-room-card__body"),
    firstRoom,
    motion.detail,
  );
}

function quietHandoffs() {
  const main = first("main, .partner-layout .dashboard");
  const sections = children(main, ":scope > section, :scope > header, :scope > article");
  if (sections.length === 1) {
    const title = sections[0].querySelector<HTMLElement>(":scope > h1");
    const body = sections[0].querySelector<HTMLElement>(":scope > div");
    if (body) handoff(title ?? undefined, body, body, motion.quiet);
    return;
  }
  for (let index = 1; index < sections.length; index += 2) {
    const outgoing = children(sections[index - 1], ":scope > div, :scope > h1, :scope > h2");
    const incoming = children(sections[index], ":scope > div, :scope > h2, :scope > article");
    handoff(outgoing, incoming, sections[index], motion.quiet);
  }
}

export function startScrollMotion(pathname: string) {
  gsap.registerPlugin(ScrollTrigger);
  let disposeCatalogue: (() => void) | undefined;
  const context = gsap.context(() => {
    if (/^\/(resorts|hotels|liveaboards)\/?$/.test(pathname)) disposeCatalogue = catalogueHandoffs();
    else if (/^\/(resorts|hotels|liveaboards|travel-guide)\/[^/]+\/?$/.test(pathname)) detailHandoffs();
    else quietHandoffs();
  });
  return () => {
    disposeCatalogue?.();
    context.revert();
  };
}
