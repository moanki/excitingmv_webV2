"use client";

import { ArrowRight, ChevronDown, MapPin, Plane, Search, Ship, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { ResortSummary } from "@/lib/types";

type DestinationKind = "resort" | "hotels" | "liveaboards";
type SortOption = "recommended" | "az";

type MobileDestinationsProps = {
  activeKind: DestinationKind;
  items: ResortSummary[];
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=900&q=88",
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=88",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1566847438217-76e82d383f84?auto=format&fit=crop&w=900&q=86"
];

const kindDetails = {
  resort: {
    label: "Resorts",
    singular: "resort",
    path: "/resorts",
    title: "Discover More Than Paradise",
    subtitle: "Curated for confident partner conversations.",
    banner: "https://ddelyhoaflwtlzjwtihq.supabase.co/storage/v1/render/image/public/site-assets/resorts/1777890426234-ff89c105-42a8-44b1-a1a3-f33fe8289e09.jpg"
  },
  hotels: {
    label: "Hotels",
    singular: "hotel",
    path: "/hotels",
    title: "City & Island Hotels",
    subtitle: "Carefully selected hotel partners across the Maldives.",
    banner: "https://ddelyhoaflwtlzjwtihq.supabase.co/storage/v1/render/image/public/site-assets/media-library/1779012223137-b55962de-de0d-41f4-8478-34a7aef74fb5.jpg"
  },
  liveaboards: {
    label: "Liveaboards",
    singular: "liveaboard",
    path: "/liveaboards",
    title: "Liveaboard Charters",
    subtitle: "Exclusive voyages across the Maldivian archipelago.",
    banner: "https://ddelyhoaflwtlzjwtihq.supabase.co/storage/v1/render/image/public/site-assets/media-library/1780215750661-ab0bf4cc-9341-4789-aee5-71065630abef.webp"
  }
} satisfies Record<DestinationKind, {
  label: string;
  singular: string;
  path: string;
  title: string;
  subtitle: string;
  banner: string;
}>;

const tabOrder: DestinationKind[] = ["resort", "hotels", "liveaboards"];

function TabIcon({ kind }: { kind: DestinationKind }) {
  if (kind === "resort") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" /></svg>;
  }
  if (kind === "hotels") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="17" rx="1" /><path d="M4 9h16" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17h18M12 3v10M6 13 12 3l6 10H6Z" /></svg>;
}

function TransferIcon({ label }: { label: string }) {
  return /seaplane|airport|domestic/i.test(label) ? <Plane aria-hidden="true" /> : <Ship aria-hidden="true" />;
}

export function MobileDestinations({ activeKind, items }: MobileDestinationsProps) {
  const details = kindDetails[activeKind];
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>("recommended");

  useEffect(() => {
    if (!filtersOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [filtersOpen]);

  const filterOptions = useMemo(() => {
    const options = new Set<string>();
    items.forEach((item) => {
      if (item.category) options.add(item.category);
      if (item.transferType) options.add(item.transferType);
      if (item.location) options.add(item.location);
    });
    return ["All", ...Array.from(options).slice(0, 12)];
  }, [items]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const searchable = [item.name, item.location, item.category, item.transferType, item.summary, ...(item.selectionTags ?? [])]
        .join(" ")
        .toLowerCase();
      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (activeFilter === "All" || searchable.includes(activeFilter.toLowerCase()));
    });
    return sort === "az" ? [...filtered].sort((left, right) => left.name.localeCompare(right.name)) : filtered;
  }, [activeFilter, items, query, sort]);

  return (
    <main className={`mobile-screen mobile-resorts mobile-explore-v8 mobile-explore-v8--${activeKind}`}>
      <section
        className="mobile-explore-v8__hero"
        style={{ backgroundImage: `url(${optimizedImageUrl(details.banner, { width: 900, height: 520, quality: 88 })})` }}
      >
        <div className="mobile-explore-v8__hero-shade" />
        <div className="mobile-explore-v8__hero-copy">
          <span>{details.label}</span>
          <h1>{details.title}</h1>
          <p>{details.subtitle}</p>
        </div>
      </section>

      <nav className="mobile-explore-v8__tabs" aria-label="Destination categories">
        {tabOrder.map((kind) => {
          const tab = kindDetails[kind];
          return (
            <Link href={tab.path} className={kind === activeKind ? "is-active" : ""} aria-current={kind === activeKind ? "page" : undefined} key={kind}>
              <TabIcon kind={kind} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <section className="mobile-explore-v8__search">
        <span>Search the portfolio</span>
        <label>
          <Search aria-hidden="true" />
          <input
            aria-label={`Search ${details.label.toLowerCase()}`}
            placeholder="Name, atoll, experience…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? <button type="button" onClick={() => setQuery("")}>Clear</button> : null}
        </label>
      </section>

      <div className="mobile-explore-v8__toolbar">
        <span>Showing <strong>{visibleItems.length}</strong> {details.label.toLowerCase()}</span>
        <div>
          <label className="mobile-explore-v8__sort">
            <strong>{sort === "recommended" ? "Recommended" : "Name A–Z"}</strong>
            <ChevronDown aria-hidden="true" />
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} aria-label={`Sort ${details.label.toLowerCase()}`}>
              <option value="recommended">Recommended</option>
              <option value="az">Name A–Z</option>
            </select>
          </label>
          <button type="button" className="mobile-explore-v8__refine" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal aria-hidden="true" />
            Refine
            {activeFilter !== "All" ? <i>1</i> : null}
          </button>
        </div>
      </div>

      {activeFilter !== "All" ? (
        <div className="mobile-explore-v8__tags">
          <button type="button" onClick={() => setActiveFilter("All")}>{activeFilter}<X aria-hidden="true" /></button>
        </div>
      ) : null}

      {visibleItems.length ? (
        <section className="mobile-explore-v8__grid" aria-label={`${details.label} portfolio`}>
          {visibleItems.map((item, index) => (
            <Link href={item.slug ? `${details.path}/${item.slug}` : details.path} className="mobile-explore-v8__card" key={item.id}>
              <div className="mobile-explore-v8__photo">
                <img
                  src={optimizedImageUrl(item.heroImageUrl || fallbackImages[index % fallbackImages.length], { width: 480, height: 640, quality: 84 })}
                  alt={item.name}
                  loading="lazy"
                />
                <span className="mobile-explore-v8__badge">{item.category || details.label}</span>
                <div className="mobile-explore-v8__overlay">
                  <h2>{item.name}</h2>
                  <p>
                    <span><MapPin aria-hidden="true" />{item.location || "Maldives"}</span>
                    <i aria-hidden="true" />
                    <span><TransferIcon label={item.transferType} />{item.transferType || "Transfer"}</span>
                  </p>
                </div>
                <span className="mobile-explore-v8__view">View {details.singular}<ArrowRight aria-hidden="true" /></span>
              </div>
              <div className="mobile-explore-v8__card-tags">
                {(item.selectionTags?.length ? item.selectionTags : [item.category]).filter(Boolean).slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="mobile-explore-v8__empty">
          <Search aria-hidden="true" />
          <h2>No results</h2>
          <p>Adjust your search or filters.</p>
        </div>
      )}

      {filtersOpen ? (
        <div className="mobile-explore-v8__sheet" role="dialog" aria-modal="true" aria-label={`Refine ${details.label.toLowerCase()}`}>
          <button type="button" className="mobile-explore-v8__scrim" onClick={() => setFiltersOpen(false)} aria-label="Close filters" />
          <div className="mobile-explore-v8__sheet-card">
            <i className="mobile-explore-v8__handle" aria-hidden="true" />
            <header>
              <h2>Refine your search</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X /></button>
            </header>
            <section>
              <span>{details.label} options</span>
              <div>
                {filterOptions.map((filter) => (
                  <button
                    type="button"
                    className={filter === activeFilter ? "is-selected" : ""}
                    onClick={() => setActiveFilter(filter)}
                    key={filter}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </section>
            <footer>
              <em>Showing <strong>{visibleItems.length}</strong> {details.label.toLowerCase()}</em>
              <div>
                <button type="button" onClick={() => setActiveFilter("All")}>Reset</button>
                <button type="button" onClick={() => setFiltersOpen(false)}>Apply filters</button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </main>
  );
}
