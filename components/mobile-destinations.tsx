"use client";

import { MapPin, Search } from "lucide-react";
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
  const [query, setQuery] = useState("");

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
    const normalizedQuery = query.trim().toLowerCase();
    return activeItems.filter((item) => {
      const matchesQuery = !normalizedQuery || [item.name, item.location, item.category, item.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      return matchesQuery && matchesFilter(item, activeFilter);
    });
  }, [activeFilter, activeItems, query]);

  function selectTab(tab: DestinationTab) {
    setActiveTab(tab);
    setActiveFilter("All");
    setQuery("");
  }

  return (
    <main className="mobile-screen mobile-resorts">
      <section className="mobile-hero mobile-hero--destinations">
        <div className="mobile-hero__content">
          <h1>Discover More Than Paradise</h1>
          <p>Curated island stays and voyages across the Maldives</p>
        </div>
      </section>

      <nav className="mobile-subtabs" aria-label="Destination categories">
        {(Object.keys(tabLabels) as DestinationTab[]).map((tab) => (
          <button
            type="button"
            className={activeTab === tab ? "is-active" : ""}
            aria-pressed={activeTab === tab}
            onClick={() => selectTab(tab)}
            key={tab}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </nav>

      <div className="mobile-destination-tools">
        <label className="mobile-search-field">
          <Search aria-hidden="true" size={16} />
          <span className="mobile-visually-hidden">Search {tabLabels[activeTab]}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${tabLabels[activeTab].toLowerCase()}`}
          />
        </label>

        <div className="mobile-chip-row" aria-label={`${tabLabels[activeTab]} filters`}>
          {tabFilters[activeTab].map((filter) => (
            <button
              type="button"
              className={filter === activeFilter ? "is-active" : ""}
              aria-pressed={filter === activeFilter}
              onClick={() => setActiveFilter(filter)}
              key={filter}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <p className="mobile-count">
        <strong>{visibleItems.length}</strong> {tabLabels[activeTab].toLowerCase()} available
      </p>

      {visibleItems.length ? (
        <section className="mobile-card-list">
          {visibleItems.map((item) => (
            <Link href={item.href} className="mobile-resort-card" key={item.id}>
              <div className="mobile-resort-card__image">
                <img src={item.imageUrl} alt={item.name} loading="lazy" />
                <span className="mobile-resort-card__badge">{item.category}</span>
                <span className="mobile-resort-card__transfer">{item.transfer}</span>
              </div>
              <div className="mobile-resort-card__body">
                <p>
                  <MapPin aria-hidden="true" size={10} />
                  <span>{item.location}</span>
                </p>
                <h2>{item.name}</h2>
                <span>{item.description}</span>
                <div className="mobile-tag-row">
                  {item.tags.map((tag) => <em key={tag}>{tag}</em>)}
                </div>
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
    </main>
  );
}
