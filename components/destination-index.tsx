"use client";

import Link from "next/link";
import { MapPin, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";

import type { ResortSummary } from "@/lib/types";

type DestinationKind = "resort" | "hotel" | "liveaboard";

type DestinationIndexProps = {
  activeKind: DestinationKind;
  items: ResortSummary[];
};

const kindConfig = {
  resort: {
    eyebrow: "Resort Collection",
    label: "Resorts",
    singular: "Resort",
    path: "/resorts",
    placeholder: "Search destinations, resorts...",
    emptyTitle: "No published resorts are available yet.",
    emptyBody: "Publish a resort from the admin portal and it will appear here once public cache refresh completes."
  },
  hotel: {
    eyebrow: "Hotel Collection",
    label: "Hotels",
    singular: "Hotel",
    path: "/hotels",
    placeholder: "Search hotels...",
    emptyTitle: "No published hotels are available yet.",
    emptyBody: "Publish a hotel from the admin portal and it will appear here once public cache refresh completes."
  },
  liveaboard: {
    eyebrow: "Liveaboard Collection",
    label: "Liveaboards",
    singular: "Liveaboard",
    path: "/liveaboards",
    placeholder: "Search liveaboards...",
    emptyTitle: "No published liveaboards are available yet.",
    emptyBody: "Publish a liveaboard from the admin portal and it will appear here once public cache refresh completes."
  }
} satisfies Record<DestinationKind, Record<string, string>>;

const filters = ["All", "Luxury", "Honeymoon", "Family", "Diving", "Adventure", "Business", "Spa", "Budget"];

function formatAtoll(location?: string | null) {
  if (!location) {
    return "Maldives";
  }

  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.find((part) => /atoll/i.test(part)) || parts[0] || "Maldives";
}

export function DestinationIndex({ activeKind, items }: DestinationIndexProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const config = kindConfig[activeKind];

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedFilter = activeFilter.toLowerCase();

    return items.filter((item) => {
      const searchable = `${item.name} ${item.location} ${item.category} ${item.summary}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesFilter = activeFilter === "All" || searchable.includes(normalizedFilter);
      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, items, query]);

  return (
    <main className="destination-page">
      <section className="destination-hero">
        <div className="site-container">
          <p className="lux-eyebrow">{config.eyebrow}</p>
          <h1>Destinations</h1>
          <p>Explore curated Maldives resorts, hotels, and liveaboards.</p>

          <label className="destination-search">
            <Search size={18} />
            <input
              aria-label={`Search ${config.label.toLowerCase()}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={config.placeholder}
            />
          </label>

          <nav className="destination-tabs" aria-label="Destination categories">
            {(Object.keys(kindConfig) as DestinationKind[]).map((kind) => (
              <Link
                href={kindConfig[kind].path}
                key={kind}
                className={kind === activeKind ? "is-active" : ""}
              >
                {kindConfig[kind].label}
              </Link>
            ))}
          </nav>

          <div className="destination-filters" aria-label={`${config.label} filters`}>
            {filters.map((filter) => (
              <button
                type="button"
                key={filter}
                className={activeFilter === filter ? "is-active" : ""}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="destination-results">
        <div className="site-container">
          {filteredItems.length ? (
            <div className="destination-card-stack">
              {filteredItems.map((item) => (
                <article key={item.slug} className="destination-card">
                  <Link
                    href={`${config.path}/${item.slug}`}
                    className="destination-card__media"
                    style={item.heroImageUrl ? { backgroundImage: `url(${item.heroImageUrl})` } : undefined}
                    aria-label={`View ${item.name}`}
                  >
                    <span>{config.singular}</span>
                  </Link>
                  <div className="destination-card__body">
                    <div className="destination-card__meta">
                      <span><MapPin size={14} />{formatAtoll(item.location)}</span>
                      <span><Star size={14} />{item.category || config.singular}</span>
                    </div>
                    <h2>{item.name}</h2>
                    {item.summary ? <p>{item.summary}</p> : null}
                    <div className="destination-card__footer">
                      <div className="destination-card__tags">
                        {[item.category || config.singular, item.transferType].filter(Boolean).slice(0, 2).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                      <Link href={`${config.path}/${item.slug}`}>View Details</Link>
                    </div>
                  </div>
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
