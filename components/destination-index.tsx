"use client";

import Link from "next/link";
import {
  Anchor,
  BedDouble,
  ChevronDown,
  Filter,
  Heart,
  MapPin,
  Palmtree,
  Search,
  Ship,
  SlidersHorizontal,
  Sparkles,
  Star,
  Waves
} from "lucide-react";
import { useMemo, useState } from "react";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { ResortSummary } from "@/lib/types";

type DestinationKind = "resort" | "hotels" | "liveaboards";

type DestinationIndexProps = {
  activeKind: DestinationKind;
  items: ResortSummary[];
};

const kindConfig = {
  resort: {
    eyebrow: "Our Resorts",
    label: "Resorts",
    singular: "Resort",
    path: "/resorts",
    placeholder: "Search resorts, islands, or experiences...",
    title: "Discover More Than Paradise",
    body: "From private island sanctuaries to trade-ready luxury escapes, explore curated Maldives resorts shaped for confident partner conversations.",
    cta: "Explore Resorts",
    emptyTitle: "No published resorts are available yet.",
    emptyBody: "Publish a resort from the admin portal and it will appear here once public cache refresh completes."
  },
  hotels: {
    eyebrow: "Our Hotels",
    label: "Hotels",
    singular: "Hotel",
    path: "/hotels",
    placeholder: "Search hotels, locations, or experiences...",
    title: "Maldives Hotels With Island Ease",
    body: "Browse hotels and hospitality stays selected for practical access, partner clarity, and polished Maldives itineraries.",
    cta: "Explore Hotels",
    emptyTitle: "No published hotels are available yet.",
    emptyBody: "Publish a hotel from the admin portal and it will appear here once public cache refresh completes."
  },
  liveaboards: {
    eyebrow: "Our Liveaboards",
    label: "Liveaboards",
    singular: "Liveaboard",
    path: "/liveaboards",
    placeholder: "Search liveaboards, routes, or diving...",
    title: "Luxury Voyages Across The Maldives",
    body: "A focused collection of liveaboards for diving, private charters, and ocean-led itineraries across the Maldives.",
    cta: "Explore Liveaboards",
    emptyTitle: "No published liveaboards are available yet.",
    emptyBody: "Publish a liveaboard from the admin portal and it will appear here once public cache refresh completes."
  }
} satisfies Record<DestinationKind, Record<string, string>>;

const filterOptions = {
  resort: [
    { label: "All Resorts", Icon: Palmtree },
    { label: "Luxury", Icon: Sparkles },
    { label: "Honeymoon", Icon: Heart },
    { label: "Family", Icon: BedDouble },
    { label: "Wellness", Icon: Waves },
    { label: "Dining", Icon: Star }
  ],
  hotels: [
    { label: "All Hotels", Icon: BedDouble },
    { label: "Luxury", Icon: Sparkles },
    { label: "City", Icon: MapPin },
    { label: "Beach", Icon: Waves },
    { label: "Business", Icon: SlidersHorizontal },
    { label: "Dining", Icon: Star }
  ],
  liveaboards: [
    { label: "All Liveaboards", Icon: Ship },
    { label: "Diving", Icon: Anchor },
    { label: "Adventure", Icon: Waves },
    { label: "Luxury", Icon: Sparkles },
    { label: "Private Charter", Icon: Heart },
    { label: "Routes", Icon: MapPin }
  ]
} satisfies Record<DestinationKind, Array<{ label: string; Icon: typeof Palmtree }>>;

const heroFallbacks = {
  resort: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=2200&q=92",
  hotels: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2200&q=92",
  liveaboards: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=2200&q=92"
} satisfies Record<DestinationKind, string>;

function formatAtoll(location?: string | null) {
  if (!location) {
    return "Maldives";
  }

  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.find((part) => /atoll/i.test(part)) || parts[0] || "Maldives";
}

export function DestinationIndex({ activeKind, items }: DestinationIndexProps) {
  const [query, setQuery] = useState("");
  const config = kindConfig[activeKind];
  const filters = filterOptions[activeKind];
  const [activeFilter, setActiveFilter] = useState(filters[0].label);
  const heroImage = items.find((item) => item.heroImageUrl)?.heroImageUrl || heroFallbacks[activeKind];

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedFilter = activeFilter.replace(/^All\s+/i, "").toLowerCase();

    return items.filter((item) => {
      const searchable = `${item.name} ${item.location} ${item.category} ${item.summary}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesFilter = activeFilter.startsWith("All") || searchable.includes(normalizedFilter);
      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, items, query]);

  return (
    <main className="destination-page">
      <section className="destination-hero">
        <div
          className="destination-hero__image"
          style={{ backgroundImage: `url(${optimizedImageUrl(heroImage, { width: 2200, height: 980, quality: 94 })})` }}
          aria-hidden="true"
        />
        <div className="site-container destination-hero__content">
          <div className="destination-hero__copy">
            <p className="lux-eyebrow">{config.eyebrow}</p>
            <h1>{config.title}</h1>
            <span className="destination-title-rule" aria-hidden="true" />
            <p>{config.body}</p>
            <div className="destination-hero__actions">
              <a href="#destination-results" className="destination-primary-action">
                {config.cta}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div className="destination-filter-strip" aria-label={`${config.label} filters`}>
            {filters.map(({ label, Icon }) => (
              <button
                type="button"
                key={label}
                className={activeFilter === label ? "is-active" : ""}
                onClick={() => setActiveFilter(label)}
              >
                <Icon size={28} strokeWidth={1.45} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="destination-results" id="destination-results">
        <div className="site-container">
          <div className="destination-toolbar">
            <label className="destination-search">
              <Search size={18} />
              <input
                aria-label={`Search ${config.label.toLowerCase()}`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={config.placeholder}
              />
            </label>
            <button type="button" className="destination-toolbar__filter">
              <Filter size={18} />
              Filters
            </button>
            <div className="destination-sort" aria-label="Sort">
              <span>Sort by:</span>
              <strong>Recommended</strong>
              <ChevronDown size={16} />
            </div>
          </div>

          {filteredItems.length ? (
            <div className="destination-card-grid">
              {filteredItems.map((item) => (
                <article key={item.slug} className="destination-card">
                  <Link
                    href={`${config.path}/${item.slug}`}
                    className="destination-card__media"
                    style={item.heroImageUrl ? { backgroundImage: `url(${optimizedImageUrl(item.heroImageUrl, { width: 760, height: 640, quality: 91 })})` } : undefined}
                    aria-label={`View ${item.name}`}
                  >
                    <span className="destination-card__badge">{item.category || config.singular}</span>
                    <span className="destination-card__heart" aria-hidden="true"><Heart size={20} /></span>
                    <div className="destination-card__content">
                      <span className="destination-card__location"><MapPin size={14} />{formatAtoll(item.location)}</span>
                      <h2>{item.name}</h2>
                      <div className="destination-card__footer">
                        <span className="destination-card__rating">
                          <Star size={15} fill="currentColor" />
                          {item.category || "Curated"}
                        </span>
                        <span className="destination-card__cta">
                          View {config.singular}
                          <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <article className="resort-story-empty-card">
              <h2>{config.emptyTitle}</h2>
              <p>{config.emptyBody}</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
