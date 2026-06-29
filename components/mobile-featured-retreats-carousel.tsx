"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { useRef, useState } from "react";

export type MobileFeaturedRetreat = {
  href: string;
  image: string;
  title: string;
  type: string;
  atoll: string;
};

export function MobileFeaturedRetreatsCarousel({ items }: { items: MobileFeaturedRetreat[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const [active, setActive] = useState(0);
  const [edge, setEdge] = useState<"start" | "end" | null>(null);

  function updateActive() {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>(".lux-retreat-card"));
    if (!cards.length) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    const next = cards.reduce((best, card, index) =>
      Math.abs(card.offsetLeft + card.offsetWidth / 2 - center) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - center) ? index : best, 0);
    setActive(next);
  }

  function bounce(direction: "start" | "end") {
    setEdge(direction);
  }

  function showSlide(index: number) {
    const track = trackRef.current;
    const card = track?.querySelectorAll<HTMLElement>(".lux-retreat-card")[index];
    if (track && card) track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
  }

  return <>
    <div className="mv2-focus-retreats__head">
      <span>Featured Retreats</span>
      <span aria-live="polite"><b>{String(active + 1).padStart(2, "0")}</b> / {String(items.length).padStart(2, "0")}</span>
    </div>
    <div
      ref={trackRef}
      className={`mobile-featured-carousel__track${edge ? ` is-bouncing-${edge}` : ""}`}
      aria-label="Featured resort carousel"
      onScroll={updateActive}
      onAnimationEnd={() => setEdge(null)}
      onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => {
        const delta = event.changedTouches[0].clientX - touchStartX.current;
        if (active === 0 && delta > 24) bounce("start");
        if (active === items.length - 1 && delta < -24) bounce("end");
      }}
    >
      {items.map((item, index) => <Link href={item.href} key={`${item.href}-${item.title}-${index}`} className="lux-retreat-card">
        <div className="lux-retreat-card__image" style={{ backgroundImage: `url(${item.image})` }} />
        <div className="lux-retreat-card__shade" />
        <div className="lux-retreat-card__content">
          <h3>{item.title}</h3>
          <p><MapPin size={14} strokeWidth={1.8} />{item.atoll}</p>
          <span><Star size={14} strokeWidth={1.8} />{item.type}</span>
          <strong>View more <ArrowRight size={15} /></strong>
        </div>
      </Link>)}
    </div>
    <div className="mobile-featured-carousel__dots" aria-label={`Slide ${active + 1} of ${items.length}`}>
      {items.map((item, index) => <button key={`${item.href}-dot-${index}`} type="button" className={active === index ? "is-active" : ""} aria-label={`Show slide ${index + 1} of ${items.length}`} aria-current={active === index ? "true" : undefined} onClick={() => showSlide(index)} />)}
    </div>
  </>;
}
