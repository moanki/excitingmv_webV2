"use client";

import { ChevronDown, MapPin, Plane, Search, Ship, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { ResortSummary } from "@/lib/types";

type DestinationTab = "resorts" | "hotels" | "liveaboards";

type DestinationItem = {
  id: string;
  name: string;
  location: string;
  category: string;
  transfer: string;
  description: string;
  imageUrl: string;
  tags: string[];
  href: string;
};

type MobileDestinationsProps = {
  resorts: ResortSummary[];
};

const resortFallbackImages = [
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=900&q=88",
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=88",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=85"
];

const hotelItems: DestinationItem[] = [
  {
    id: "samann-grand",
    name: "Samann Grand",
    location: "Male City",
    category: "City Hotel",
    transfer: "Airport Transfer",
    description: "A polished city stay for convenient arrivals, departures, and short Maldives stopovers.",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=86",
    tags: ["Male City", "Business", "Airport Transfer"],
    href: "/contact"
  },
  {
    id: "h78-maldives",
    name: "H78 Maldives",
    location: "Hulhumale",
    category: "Beachfront Hotel",
    transfer: "Airport Transfer",
    description: "A relaxed beachfront base close to Velana International Airport and Male.",
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=86",
    tags: ["Hulhumale", "Beachfront", "Airport Transfer"],
    href: "/contact"
  },
  {
    id: "jen-maldives",
    name: "JEN Maldives Male",
    location: "Male City",
    category: "City Hotel",
    transfer: "Airport Transfer",
    description: "A central city hotel option for efficient transits and business-led partner itineraries.",
    imageUrl: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=86",
    tags: ["Male City", "Business", "Transit"],
    href: "/contact"
  },
  {
    id: "saii-lagoon",
    name: "SAii Lagoon Maldives",
    location: "Emboodhoo Lagoon",
    category: "Lifestyle Hotel",
    transfer: "Speedboat",
    description: "A polished lagoon stay suited to short escapes, families, and connected island experiences.",
    imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=86",
    tags: ["Lagoon", "Lifestyle", "Speedboat"],
    href: "/contact"
  }
];

const liveaboardItems: DestinationItem[] = [
  {
    id: "scubaspa-ying",
    name: "Scubaspa Ying",
    location: "Central Atolls",
    category: "Luxury Liveaboard",
    transfer: "7 Nights",
    description: "A premium dive and wellness voyage combining marine exploration with spa-led relaxation.",
    imageUrl: "https://images.unsplash.com/photo-1566847438217-76e82d383f84?auto=format&fit=crop&w=900&q=86",
    tags: ["Diving", "Luxury Yacht", "7 Nights"],
    href: "/contact"
  },
  {
    id: "maldives-explorer",
    name: "Maldives Explorer",
    location: "North & Central Atolls",
    category: "Adventure Liveaboard",
    transfer: "10 Nights",
    description: "An island-hopping itinerary created for diving, surfing, and remote-atoll discovery.",
    imageUrl: "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=900&q=86",
    tags: ["Diving", "Surfing", "10 Nights"],
    href: "/contact"
  },
  {
    id: "emperor-serenity",
    name: "Emperor Serenity",
    location: "Central Atolls",
    category: "Diving Charter",
    transfer: "7 Nights",
    description: "A comfortable dive-led vessel for classic Maldives routes and marine-rich itineraries.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=86",
    tags: ["Diving", "Central Atolls", "7 Nights"],
    href: "/contact"
  },
  {
    id: "duke-of-york",
    name: "Duke of York",
    location: "South Atolls",
    category: "Luxury Charter",
    transfer: "10 Nights",
    description: "A refined charter-style liveaboard for private groups and extended atoll exploration.",
    imageUrl: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=86",
    tags: ["Luxury Yacht", "Private Charter", "10 Nights"],
    href: "/contact"
  }
];

const tabFilters: Record<DestinationTab, string[]> = {
  resorts: ["All", "Seaplane", "Speedboat", "Raa Atoll", "Baa Atoll", "South Male", "Ultra Luxury"],
  hotels: ["All", "Male City", "Hulhumale", "Airport Transfer", "Business", "Beachfront"],
  liveaboards: ["All", "Diving", "Surfing", "Luxury Yacht", "7 Nights", "10 Nights"]
};

const tabLabels: Record<DestinationTab, string> = {
  resorts: "Resorts",
  hotels: "Hotels",
  liveaboards: "Liveaboards"
};

function matchesFilter(item: DestinationItem, filter: string) {
  if (filter === "All") return true;
  const searchable = [item.location, item.category, item.transfer, ...item.tags].join(" ").toLowerCase();
  return searchable.includes(filter.toLowerCase());
}

export function MobileDestinations({ resorts }: MobileDestinationsProps) {
  const [activeTab, setActiveTab] = useState<DestinationTab>("resorts");
  const [activeFilter, setActiveFilter] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<"recommended" | "az">("recommended");

  const resortItems = useMemo<DestinationItem[]>(
    () => resorts.map((resort, index) => ({
      id: resort.id,
      name: resort.name,
      location: resort.location || "Maldives",
      category: resort.category || "Luxury",
      transfer: resort.transferType || "Transfer",
      description: resort.summary,
      imageUrl: resort.heroImageUrl || resortFallbackImages[index % resortFallbackImages.length],
      tags: [resort.category, resort.transferType, "Partner Ready"].filter(Boolean),
      href: `/resorts/${resort.slug}`
    })),
    [resorts]
  );

  const activeItems = activeTab === "resorts"
    ? resortItems
    : activeTab === "hotels"
      ? hotelItems
      : liveaboardItems;

  const visibleItems = useMemo(() => {
    const filtered = activeItems.filter((item) => matchesFilter(item, activeFilter));
    return sort === "az" ? [...filtered].sort((left, right) => left.name.localeCompare(right.name)) : filtered;
  }, [activeFilter, activeItems, sort]);

  function selectTab(tab: DestinationTab) {
    setActiveTab(tab);
    setActiveFilter("All");
    setSort("recommended");
  }

  function tabIcon(tab: DestinationTab) {
    if (tab === "resorts") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21V10M12 10C12 7 9.8 5 6.5 4.8 7 8 9 10 12 10Zm0 0c0-3 2.2-5 5.5-5.2C17 8 15 10 12 10Zm0 0c-1.6-2-1.6-4.2 0-6 1.6 1.8 1.6 4 0 6Z" />
        </svg>
      );
    }
    if (tab === "hotels") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20V8h10v12M14 12h6v8M7 11h3M7 15h3M17 15h1M2 20h20" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 15h16l-2.5 4H7L4 15Zm3-3h10l-1.5-5h-7L7 12ZM12 7V3M9 3h6" />
      </svg>
    );
  }

  function TransferIcon({ label }: { label: string }) {
    return /seaplane|airport/i.test(label) ? <Plane aria-hidden="true" /> : <Ship aria-hidden="true" />;
  }

  return (
    <main className="mobile-screen mobile-resorts">
      <section className="mobile-hero mobile-hero--destinations">
        <div className="mobile-hero__content">
          <span>Explore</span>
          <h1>Discover More Than Paradise</h1>
          <p>Curated island stays and voyages across the Maldives, selected for remarkable journeys and confident partner planning.</p>
        </div>
      </section>

      <nav className="mobile-subtabs" aria-label="Destination categories">
        <span className={`mobile-subtabs__indicator mobile-subtabs__indicator--${activeTab}`} aria-hidden="true" />
        {(Object.keys(tabLabels) as DestinationTab[]).map((tab) => (
          <button
            type="button"
            className={activeTab === tab ? "is-active" : ""}
            aria-pressed={activeTab === tab}
            onClick={() => selectTab(tab)}
            key={tab}
          >
            {tabIcon(tab)}
            {tabLabels[tab]}
          </button>
        ))}
      </nav>

      <div className="mobile-destination-tools">
        <button type="button" className="mobile-explore-filter" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal aria-hidden="true" />
          Filters
          {activeFilter !== "All" ? <i aria-hidden="true" /> : null}
        </button>
        <label className="mobile-explore-sort">
          <span>Sort: <strong>{sort === "recommended" ? "Recommended" : "A–Z"}</strong></span>
          <ChevronDown aria-hidden="true" />
          <select value={sort} onChange={(event) => setSort(event.target.value as "recommended" | "az")} aria-label="Sort destinations">
            <option value="recommended">Recommended</option>
            <option value="az">A–Z</option>
          </select>
        </label>
      </div>

      <p className="mobile-count">
        Showing <strong>{visibleItems.length}</strong> {tabLabels[activeTab]}
      </p>

      {visibleItems.length ? (
        <section className="mobile-card-list">
          {visibleItems.map((item) => (
            <Link href={item.href} className="mobile-resort-card" key={item.id}>
              <div className="mobile-resort-card__image">
                <img src={item.imageUrl} alt={item.name} loading="lazy" />
              </div>
              <div className="mobile-resort-card__body">
                <span className="mobile-resort-card__category">{item.category}</span>
                <h2>{item.name}</h2>
                <p>
                  <span><MapPin aria-hidden="true" />{item.location}</span>
                  <i aria-hidden="true" />
                  <span><TransferIcon label={item.transfer} />{item.transfer}</span>
                </p>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="mobile-empty-state">
          <Search aria-hidden="true" size={20} />
          <strong>No matches found</strong>
          <span>Try another search or filter.</span>
        </div>
      )}

      {filtersOpen ? (
        <div className="mobile-explore-sheet" role="dialog" aria-modal="true" aria-label={`${tabLabels[activeTab]} filters`}>
          <button type="button" className="mobile-explore-sheet__backdrop" onClick={() => setFiltersOpen(false)} aria-label="Close filters" />
          <div className="mobile-explore-sheet__panel">
            <i className="mobile-explore-sheet__handle" aria-hidden="true" />
            <header>
              <h2>Filters</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X /></button>
            </header>
            <div className="mobile-explore-sheet__options">
              <span>{tabLabels[activeTab]} options</span>
              {tabFilters[activeTab].map((filter) => (
                <button
                  type="button"
                  className={filter === activeFilter ? "is-active" : ""}
                  aria-pressed={filter === activeFilter}
                  onClick={() => setActiveFilter(filter)}
                  key={filter}
                >
                  {filter}<i aria-hidden="true" />
                </button>
              ))}
            </div>
            <button type="button" className="mobile-explore-sheet__apply" onClick={() => setFiltersOpen(false)}>Apply Filters</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
