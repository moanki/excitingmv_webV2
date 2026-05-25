"use client";

import Link from "next/link";
import {
  Anchor,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  Car,
  ChevronDown,
  Gem,
  Heart,
  MapPin,
  Plane,
  RotateCcw,
  Search,
  Ship,
  SlidersHorizontal,
  Tags,
  UserRound,
  Users,
  Waves,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { ResortSummary } from "@/lib/types";

type DestinationKind = "resort" | "hotels" | "liveaboards";
type SortOption = "recommended" | "az" | "location" | "category" | "recent";

type PortfolioItem = {
  id: string;
  type: DestinationKind;
  name: string;
  slug: string;
  image: string;
  portfolioCategory: string;
  selectionTags: string[];
  location: string;
  transferOptions: string[];
  featured: boolean;
  recommendedOrder: number;
  createdAt: string;
};

type DestinationIndexProps = {
  activeKind: DestinationKind;
  items: ResortSummary[];
};

type PortfolioConfig = {
  eyebrow: string;
  label: string;
  singular: string;
  path: string;
  placeholder: string;
  title: string;
  body: string;
  cta: string;
  categoryLabel: string;
  categoryOptions: string[];
  selectionOptions: string[];
  locationOptions: string[];
  transferOptions: string[];
  emptyTitle: string;
  emptyBody: string;
};

type PortfolioFiltersState = {
  portfolioCategory: string;
  selectionTags: string[];
  location: string;
  transferOptions: string[];
};

const kindConfig = {
  resort: {
    eyebrow: "Our Resorts",
    label: "Resorts",
    singular: "Resort",
    path: "/resorts",
    placeholder: "Search resorts...",
    title: "Discover More Than Paradise",
    body: "From private island sanctuaries to trade-ready luxury escapes, explore curated Maldives resorts shaped for confident partner conversations.",
    cta: "Explore Resorts",
    categoryLabel: "Resort Category",
    categoryOptions: ["Budget-Conscious", "Classic 5-Star", "Premium 5-Star", "Luxury 5-Star", "Ultra Luxury 5-Star"],
    selectionOptions: ["Marine Experience", "Honeymoon", "All-Inclusive", "Family Oriented", "Adults-only", "Private Islands"],
    locationOptions: [
      "North Malé Atoll",
      "South Malé Atoll",
      "Baa Atoll",
      "Raa Atoll",
      "Ari Atoll",
      "Noonu Atoll",
      "Lhaviyani Atoll",
      "Dhaalu Atoll",
      "Gaafu Alifu Atoll",
      "Gaafu Dhaalu Atoll"
    ],
    transferOptions: ["Speedboat", "Seaplane", "Domestic"],
    emptyTitle: "No resorts found",
    emptyBody: "Try adjusting your search or filters."
  },
  hotels: {
    eyebrow: "Our Hotels",
    label: "Hotels",
    singular: "Hotel",
    path: "/hotels",
    placeholder: "Search hotels...",
    title: "Maldives Hotels With Island Ease",
    body: "Browse hotels and hospitality stays selected for practical access, partner clarity, and polished Maldives itineraries.",
    cta: "Explore Hotels",
    categoryLabel: "Hotel Category",
    categoryOptions: ["Budget-Conscious", "Classic Hotel", "Premium Hotel", "Luxury Hotel", "Business Hotel"],
    selectionOptions: ["City Stay", "Business Travel", "Transit Stay", "Family Oriented", "Budget-Conscious", "Premium Stay"],
    locationOptions: ["Malé", "Hulhumalé", "Velana International Airport Area", "Greater Malé Region", "Addu City", "Other Islands"],
    transferOptions: ["Airport Transfer", "Speedboat", "Domestic", "City Transfer"],
    emptyTitle: "No hotels found",
    emptyBody: "Try adjusting your search or filters."
  },
  liveaboards: {
    eyebrow: "Our Liveaboards",
    label: "Liveaboards",
    singular: "Liveaboard",
    path: "/liveaboards",
    placeholder: "Search liveaboards...",
    title: "Luxury Voyages Across The Maldives",
    body: "A focused collection of liveaboards for diving, private charters, and ocean-led itineraries across the Maldives.",
    cta: "Explore Liveaboards",
    categoryLabel: "Liveaboard Category",
    categoryOptions: ["Budget-Conscious", "Classic Liveaboard", "Premium Liveaboard", "Luxury Liveaboard", "Diving Specialist"],
    selectionOptions: ["Diving", "Surfing", "Marine Experience", "Private Charter", "Group Travel", "Premium Cruise"],
    locationOptions: ["Central Atolls", "North Atolls", "South Atolls", "Ari Atoll Route", "Baa Atoll Route", "Deep South Route", "Malé Departure"],
    transferOptions: ["Malé Departure", "Domestic + Vessel", "Speedboat Connection", "Seaplane Connection"],
    emptyTitle: "No liveaboards found",
    emptyBody: "Try adjusting your search or filters."
  }
} satisfies Record<DestinationKind, PortfolioConfig>;

const heroFallbacks = {
  resort: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=2200&q=92",
  hotels: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2200&q=92",
  liveaboards: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=2200&q=92"
} satisfies Record<DestinationKind, string>;

const initialFilters: PortfolioFiltersState = {
  portfolioCategory: "",
  selectionTags: [],
  location: "",
  transferOptions: []
};

function normalize(value?: string | null) {
  return value?.trim() ?? "";
}

function formatAtoll(location?: string | null) {
  const value = normalize(location);
  if (!value) {
    return "Maldives";
  }

  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.find((part) => /atoll/i.test(part)) || parts[0] || "Maldives";
}

function matchesOption(value: string, options: string[]) {
  const normalized = value.toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized);
}

function inferPortfolioCategory(kind: DestinationKind, category: string, summary = "") {
  const config = kindConfig[kind];
  const directMatch = matchesOption(category, config.categoryOptions);
  if (directMatch) {
    return directMatch;
  }

  const text = `${category} ${summary}`.toLowerCase();
  if (/budget|value|affordable|conscious/.test(text)) {
    return "Budget-Conscious";
  }

  if (kind === "resort") {
    if (/ultra/.test(text)) return "Ultra Luxury 5-Star";
    if (/premium/.test(text)) return "Premium 5-Star";
    if (/classic/.test(text)) return "Classic 5-Star";
    return /luxury|5/.test(text) ? "Luxury 5-Star" : "Premium 5-Star";
  }

  if (kind === "hotels") {
    if (/business|airport|transit|city/.test(text)) return "Business Hotel";
    if (/luxury/.test(text)) return "Luxury Hotel";
    if (/classic/.test(text)) return "Classic Hotel";
    return "Premium Hotel";
  }

  if (/diving|dive/.test(text)) return "Diving Specialist";
  if (/luxury/.test(text)) return "Luxury Liveaboard";
  if (/classic/.test(text)) return "Classic Liveaboard";
  return "Premium Liveaboard";
}

function inferLocation(kind: DestinationKind, location: string, summary = "") {
  const config = kindConfig[kind];
  const atoll = formatAtoll(location);
  const directMatch = matchesOption(atoll, config.locationOptions) ?? matchesOption(location, config.locationOptions);
  if (directMatch) {
    return directMatch;
  }

  const text = `${location} ${summary}`.toLowerCase();
  if (kind === "hotels") {
    if (/hulhumal/.test(text)) return "Hulhumalé";
    if (/airport|velana/.test(text)) return "Velana International Airport Area";
    if (/addu/.test(text)) return "Addu City";
    if (/mal[eé]|male/.test(text)) return "Malé";
    return "Other Islands";
  }

  if (kind === "liveaboards") {
    if (/deep south|gaafu|addu/.test(text)) return "Deep South Route";
    if (/baa/.test(text)) return "Baa Atoll Route";
    if (/ari/.test(text)) return "Ari Atoll Route";
    if (/north/.test(text)) return "North Atolls";
    if (/south/.test(text)) return "South Atolls";
    if (/mal[eé]|male|departure/.test(text)) return "Malé Departure";
    return "Central Atolls";
  }

  return atoll;
}

function inferTransferOptions(kind: DestinationKind, transferType: string, summary = "") {
  const config = kindConfig[kind];
  const values = transferType
    .split(/[,+/&]| and /i)
    .map((item) => item.trim())
    .filter(Boolean);
  const matches = values
    .map((value) => matchesOption(value, config.transferOptions))
    .filter((value): value is string => Boolean(value));

  if (matches.length) {
    return Array.from(new Set(matches));
  }

  const text = `${transferType} ${summary}`.toLowerCase();
  if (kind === "resort") {
    if (/seaplane/.test(text)) return ["Seaplane"];
    if (/domestic/.test(text)) return ["Domestic"];
    if (/speedboat|boat|yacht/.test(text)) return ["Speedboat"];
    return ["Seaplane"];
  }

  if (kind === "hotels") {
    if (/city/.test(text)) return ["City Transfer"];
    if (/speedboat|boat/.test(text)) return ["Speedboat"];
    if (/domestic/.test(text)) return ["Domestic"];
    return ["Airport Transfer"];
  }

  if (/domestic/.test(text)) return ["Domestic + Vessel"];
  if (/speedboat|boat/.test(text)) return ["Speedboat Connection"];
  if (/seaplane/.test(text)) return ["Seaplane Connection"];
  return ["Malé Departure"];
}

function inferSelectionTags(kind: DestinationKind, item: ResortSummary, category: string) {
  const configuredTags = item.selectionTags?.filter(Boolean) ?? [];
  if (configuredTags.length) {
    return configuredTags;
  }

  const text = `${item.name} ${item.location} ${item.category} ${item.summary} ${item.highlights?.join(" ") ?? ""}`.toLowerCase();

  if (kind === "resort") {
    const tags = [
      /marine|reef|lagoon|ocean|dive|water/.test(text) ? "Marine Experience" : "",
      /honeymoon|romance|couple/.test(text) ? "Honeymoon" : "",
      /all.?inclusive/.test(text) ? "All-Inclusive" : "",
      /family|kids|children/.test(text) ? "Family Oriented" : "",
      /adult/.test(text) ? "Adults-only" : "",
      /private|island|villa/.test(text) ? "Private Islands" : ""
    ].filter(Boolean);
    return tags.length ? tags : ["Marine Experience", category.includes("Ultra") ? "Private Islands" : "Honeymoon"];
  }

  if (kind === "hotels") {
    const tags = [
      /city|male|hulhumal/.test(text) ? "City Stay" : "",
      /business|corporate|meeting/.test(text) ? "Business Travel" : "",
      /transit|airport|overnight/.test(text) ? "Transit Stay" : "",
      /family|kids|children/.test(text) ? "Family Oriented" : "",
      /budget|value/.test(text) ? "Budget-Conscious" : "",
      /premium|luxury|suite/.test(text) ? "Premium Stay" : ""
    ].filter(Boolean);
    return tags.length ? tags : ["City Stay", "Premium Stay"];
  }

  const tags = [
    /dive|diving|reef|marine/.test(text) ? "Diving" : "",
    /surf/.test(text) ? "Surfing" : "",
    /marine|ocean|reef/.test(text) ? "Marine Experience" : "",
    /charter|private/.test(text) ? "Private Charter" : "",
    /group|fleet/.test(text) ? "Group Travel" : "",
    /premium|luxury/.test(text) ? "Premium Cruise" : ""
  ].filter(Boolean);
  return tags.length ? tags : ["Diving", "Marine Experience"];
}

function normalizePortfolioItems(kind: DestinationKind, items: ResortSummary[]) {
  return items.map((item, index) => {
    const portfolioCategory = inferPortfolioCategory(kind, normalize(item.category), item.summary);
    return {
      id: item.id,
      type: kind,
      name: item.name,
      slug: item.slug,
      image: item.heroImageUrl ?? "",
      portfolioCategory,
      selectionTags: inferSelectionTags(kind, item, portfolioCategory),
      location: inferLocation(kind, item.location, item.summary),
      transferOptions: inferTransferOptions(kind, item.transferType, item.summary),
      featured: Boolean(item.isFeaturedHomepage),
      recommendedOrder: item.recommendedOrder ?? index + 1,
      createdAt: item.createdAt ?? item.updatedAt ?? ""
    } satisfies PortfolioItem;
  });
}

function searchText(item: PortfolioItem) {
  return [
    item.name,
    item.location,
    item.portfolioCategory,
    item.selectionTags.join(" "),
    item.transferOptions.join(" ")
  ].join(" ").toLowerCase();
}

function sortPortfolioItems(items: PortfolioItem[], sort: SortOption) {
  const next = [...items];
  if (sort === "az") {
    return next.sort((left, right) => left.name.localeCompare(right.name));
  }
  if (sort === "location") {
    return next.sort((left, right) => left.location.localeCompare(right.location) || left.name.localeCompare(right.name));
  }
  if (sort === "category") {
    return next.sort((left, right) => left.portfolioCategory.localeCompare(right.portfolioCategory) || left.name.localeCompare(right.name));
  }
  if (sort === "recent") {
    return next.sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });
  }

  return next.sort((left, right) => {
    const featuredScore = Number(right.featured) - Number(left.featured);
    return featuredScore || left.recommendedOrder - right.recommendedOrder || left.name.localeCompare(right.name);
  });
}

function hasActiveFilters(query: string, filters: PortfolioFiltersState, sort: SortOption) {
  return Boolean(
    query.trim() ||
      filters.portfolioCategory ||
      filters.location ||
      filters.selectionTags.length ||
      filters.transferOptions.length ||
      sort !== "recommended"
  );
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function selectionIcon(label: string): LucideIcon {
  if (/honeymoon/i.test(label)) return Heart;
  if (/family|group/i.test(label)) return Users;
  if (/adult/i.test(label)) return UserRound;
  if (/private|premium/i.test(label)) return Gem;
  if (/business/i.test(label)) return Briefcase;
  if (/city/i.test(label)) return Building2;
  if (/diving|surfing|marine/i.test(label)) return Waves;
  return Tags;
}

function transferIcon(label: string): LucideIcon {
  if (/seaplane|domestic|airport/i.test(label)) return Plane;
  if (/city|car/i.test(label)) return Car;
  if (/vessel|boat|departure|speedboat/i.test(label)) return Ship;
  return Anchor;
}

function PortfolioFilters({
  config,
  query,
  filters,
  sort,
  total,
  resultCount,
  mobileOpen,
  onMobileOpenChange,
  onQueryChange,
  onFiltersChange,
  onSortChange,
  onReset
}: {
  config: PortfolioConfig;
  query: string;
  filters: PortfolioFiltersState;
  sort: SortOption;
  total: number;
  resultCount: number;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onQueryChange: (value: string) => void;
  onFiltersChange: (filters: PortfolioFiltersState) => void;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
}) {
  const active = hasActiveFilters(query, filters, sort);

  return (
    <div className="portfolio-controls">
      <label className="portfolio-search">
        <Search size={18} />
        <input
          aria-label={`Search ${config.label.toLowerCase()}`}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={config.placeholder}
        />
      </label>

      <div className="portfolio-mobile-actions">
        <button type="button" className="portfolio-mobile-filter" onClick={() => onMobileOpenChange(true)}>
          <SlidersHorizontal size={17} />
          Filters
        </button>
        <SortSelect sort={sort} onSortChange={onSortChange} />
      </div>

      <div className="portfolio-filter-row" aria-label={`${config.label} portfolio filters`}>
        <FilterGroup
          label={config.categoryLabel}
          options={config.categoryOptions}
          value={filters.portfolioCategory}
          onChange={(value) => onFiltersChange({ ...filters, portfolioCategory: filters.portfolioCategory === value ? "" : value })}
        />
        <FilterGroup
          label="Our Selection"
          options={config.selectionOptions}
          values={filters.selectionTags}
          multi
          onMultiChange={(value) => onFiltersChange({ ...filters, selectionTags: toggleValue(filters.selectionTags, value) })}
        />
        <FilterGroup
          label="Location"
          options={config.locationOptions}
          value={filters.location}
          onChange={(value) => onFiltersChange({ ...filters, location: filters.location === value ? "" : value })}
        />
        <FilterGroup
          label="Transfer Option"
          options={config.transferOptions}
          values={filters.transferOptions}
          multi
          onMultiChange={(value) => onFiltersChange({ ...filters, transferOptions: toggleValue(filters.transferOptions, value) })}
        />
        <div className="portfolio-sort-desktop">
          <SortSelect sort={sort} onSortChange={onSortChange} />
        </div>
      </div>

      <div className="portfolio-results-bar">
        <p>
          Showing <strong>{resultCount}</strong> of <strong>{total}</strong> {config.label.toLowerCase()}
        </p>
        <button type="button" onClick={onReset} disabled={!active}>
          <RotateCcw size={15} />
          Reset Filters
        </button>
      </div>

      <FilterDrawer
        config={config}
        filters={filters}
        open={mobileOpen}
        onClose={() => onMobileOpenChange(false)}
        onFiltersChange={onFiltersChange}
        onReset={onReset}
      />
    </div>
  );
}

function SortSelect({ sort, onSortChange }: { sort: SortOption; onSortChange: (sort: SortOption) => void }) {
  return (
    <label className="portfolio-sort">
      <span>Sort</span>
      <select value={sort} onChange={(event) => onSortChange(event.target.value as SortOption)} aria-label="Sort listings">
        <option value="recommended">Recommended</option>
        <option value="az">A-Z</option>
        <option value="location">Location</option>
        <option value="category">Category</option>
        <option value="recent">Recently Added</option>
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  );
}

function FilterGroup({
  label,
  options,
  value,
  values = [],
  multi = false,
  onChange,
  onMultiChange
}: {
  label: string;
  options: string[];
  value?: string;
  values?: string[];
  multi?: boolean;
  onChange?: (value: string) => void;
  onMultiChange?: (value: string) => void;
}) {
  return (
    <fieldset className="portfolio-filter-group">
      <legend>{label}</legend>
      <div>
        {options.map((option) => {
          const active = multi ? values.includes(option) : value === option;
          return (
            <button
              type="button"
              key={option}
              className={active ? "is-active" : ""}
              onClick={() => (multi ? onMultiChange?.(option) : onChange?.(option))}
              aria-pressed={active}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FilterDrawer({
  config,
  filters,
  open,
  onClose,
  onFiltersChange,
  onReset
}: {
  config: PortfolioConfig;
  filters: PortfolioFiltersState;
  open: boolean;
  onClose: () => void;
  onFiltersChange: (filters: PortfolioFiltersState) => void;
  onReset: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="portfolio-drawer" role="dialog" aria-modal="true" aria-label={`${config.label} filters`}>
      <button type="button" className="portfolio-drawer__backdrop" onClick={onClose} aria-label="Close filters" />
      <div className="portfolio-drawer__panel">
        <div className="portfolio-drawer__header">
          <h2>Filters</h2>
          <button type="button" onClick={onClose} aria-label="Close filters">
            <X size={20} />
          </button>
        </div>
        <FilterGroup
          label={config.categoryLabel}
          options={config.categoryOptions}
          value={filters.portfolioCategory}
          onChange={(value) => onFiltersChange({ ...filters, portfolioCategory: filters.portfolioCategory === value ? "" : value })}
        />
        <FilterGroup
          label="Our Selection"
          options={config.selectionOptions}
          values={filters.selectionTags}
          multi
          onMultiChange={(value) => onFiltersChange({ ...filters, selectionTags: toggleValue(filters.selectionTags, value) })}
        />
        <FilterGroup
          label="Location"
          options={config.locationOptions}
          value={filters.location}
          onChange={(value) => onFiltersChange({ ...filters, location: filters.location === value ? "" : value })}
        />
        <FilterGroup
          label="Transfer Option"
          options={config.transferOptions}
          values={filters.transferOptions}
          multi
          onMultiChange={(value) => onFiltersChange({ ...filters, transferOptions: toggleValue(filters.transferOptions, value) })}
        />
        <div className="portfolio-drawer__actions">
          <button type="button" onClick={onReset}>
            Reset
          </button>
          <button type="button" onClick={onClose}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

function PortfolioGrid({ children }: { children: ReactNode }) {
  return <div className="portfolio-grid">{children}</div>;
}

function PortfolioCard({ item, config }: { item: PortfolioItem; config: PortfolioConfig }) {
  const image = item.image || heroFallbacks[item.type];
  const TransferIcon = transferIcon(item.transferOptions[0] ?? "");
  const visibleTags = item.selectionTags.slice(0, 2);
  const hiddenTagCount = Math.max(item.selectionTags.length - visibleTags.length, 0);

  return (
    <article className="portfolio-card">
      <Link href={`${config.path}/${item.slug}`} className="portfolio-card__media" aria-label={`View ${item.name}`}>
        <img
          src={optimizedImageUrl(image, { width: 760, height: 475, quality: 91 })}
          alt={item.name}
          loading="lazy"
          width={760}
          height={475}
        />
        <span className="portfolio-card__badge">
          <BadgeCheck size={14} />
          {item.portfolioCategory}
        </span>
      </Link>
      <div className="portfolio-card__body">
        <h2>{item.name}</h2>
        <div className="portfolio-card__meta">
          <span>
            <MapPin size={15} />
            {item.location}
          </span>
          <span>
            <TransferIcon size={15} />
            {item.transferOptions.join(" · ")}
          </span>
        </div>
        <div className="portfolio-card__tags" aria-label="Our selection">
          {visibleTags.map((tag) => {
            const Icon = selectionIcon(tag);
            return (
              <span key={tag}>
                <Icon size={14} />
                {tag}
              </span>
            );
          })}
          {hiddenTagCount > 0 ? <span>+{hiddenTagCount}</span> : null}
        </div>
        <Link href={`${config.path}/${item.slug}`} className="portfolio-card__cta">
          View {config.singular}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function PortfolioSkeletonCard() {
  return (
    <article className="portfolio-card portfolio-card--skeleton" aria-hidden="true">
      <div className="portfolio-skeleton portfolio-skeleton--image" />
      <div className="portfolio-card__body">
        <div className="portfolio-skeleton portfolio-skeleton--badge" />
        <div className="portfolio-skeleton portfolio-skeleton--title" />
        <div className="portfolio-skeleton portfolio-skeleton--line" />
        <div className="portfolio-skeleton portfolio-skeleton--line-short" />
        <div className="portfolio-skeleton portfolio-skeleton--tags" />
        <div className="portfolio-skeleton portfolio-skeleton--cta" />
      </div>
    </article>
  );
}

function PortfolioEmptyState({ config, onReset }: { config: PortfolioConfig; onReset: () => void }) {
  return (
    <article className="portfolio-empty">
      <Award size={24} />
      <h2>{config.emptyTitle}</h2>
      <p>{config.emptyBody}</p>
      <button type="button" onClick={onReset}>
        Reset Filters
      </button>
    </article>
  );
}

export function DestinationIndex({ activeKind, items }: DestinationIndexProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<PortfolioFiltersState>(initialFilters);
  const [sort, setSort] = useState<SortOption>("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const config = kindConfig[activeKind];
  const heroImage = items.find((item) => item.heroImageUrl)?.heroImageUrl || heroFallbacks[activeKind];

  const portfolioItems = useMemo(() => normalizePortfolioItems(activeKind, items), [activeKind, items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = portfolioItems.filter((item) => {
      const matchesQuery = !normalizedQuery || searchText(item).includes(normalizedQuery);
      const matchesCategory = !filters.portfolioCategory || item.portfolioCategory === filters.portfolioCategory;
      const matchesLocation = !filters.location || item.location === filters.location;
      const matchesSelections =
        !filters.selectionTags.length || filters.selectionTags.every((tag) => item.selectionTags.includes(tag));
      const matchesTransfers =
        !filters.transferOptions.length || filters.transferOptions.every((transfer) => item.transferOptions.includes(transfer));
      return matchesQuery && matchesCategory && matchesLocation && matchesSelections && matchesTransfers;
    });

    return sortPortfolioItems(filtered, sort);
  }, [filters, portfolioItems, query, sort]);

  useEffect(() => {
    setIsFiltering(true);
    const timer = window.setTimeout(() => setIsFiltering(false), 120);
    return () => window.clearTimeout(timer);
  }, [filters, query, sort]);

  function resetFilters() {
    setQuery("");
    setFilters(initialFilters);
    setSort("recommended");
  }

  return (
    <main className="destination-page portfolio-page">
      <section className="destination-hero portfolio-hero">
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
        </div>
      </section>

      <section className="destination-results portfolio-results" id="destination-results">
        <div className="site-container">
          <PortfolioFilters
            config={config}
            query={query}
            filters={filters}
            sort={sort}
            total={portfolioItems.length}
            resultCount={filteredItems.length}
            mobileOpen={filtersOpen}
            onMobileOpenChange={setFiltersOpen}
            onQueryChange={setQuery}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            onReset={resetFilters}
          />

          {isFiltering ? (
            <PortfolioGrid>
              {Array.from({ length: 6 }).map((_, index) => (
                <PortfolioSkeletonCard key={index} />
              ))}
            </PortfolioGrid>
          ) : filteredItems.length ? (
            <PortfolioGrid>
              {filteredItems.map((item) => (
                <PortfolioCard key={item.id} item={item} config={config} />
              ))}
            </PortfolioGrid>
          ) : (
            <PortfolioEmptyState config={config} onReset={resetFilters} />
          )}
        </div>
      </section>
    </main>
  );
}
