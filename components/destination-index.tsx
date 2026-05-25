"use client";

import Link from "next/link";
import {
  Anchor,
  ArrowUpDown,
  BadgeCheck,
  Car,
  ChevronDown,
  MapPin,
  Plane,
  Search,
  Ship,
  SlidersHorizontal,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  category: string;
  selectionTag: string;
  location: string;
  transferOptions: string[];
  primaryTransferDisplay: string;
  recommendedOrder: number;
  createdAt: string;
  featured: boolean;
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
  portfolioTitle: string;
  categoryLabel: string;
  categoryAllLabel: string;
  categoryOptions: string[];
  selectionOptions: string[];
  locationOptions: string[];
  transferOptions: string[];
  emptyTitle: string;
};

type PortfolioFiltersState = {
  category: string;
  selection: string;
  location: string;
  transfer: string;
};

const kindConfig = {
  resort: {
    eyebrow: "Our Resorts",
    label: "Resorts",
    singular: "resort",
    path: "/resorts",
    placeholder: "Search resorts...",
    title: "Discover More Than Paradise",
    body: "From private island sanctuaries to trade-ready luxury escapes, explore curated Maldives resorts shaped for confident partner conversations.",
    cta: "Explore Resorts",
    portfolioTitle: "Resort Portfolio",
    categoryLabel: "Resort Category",
    categoryAllLabel: "All Resort Categories",
    categoryOptions: ["Budget-Conscious", "Classic 5-Star", "Premium 5-Star", "Luxury 5-Star", "Ultra Luxury 5-Star"],
    selectionOptions: ["Marine Experience", "Honeymoon", "All-Inclusive", "Family Oriented", "Adults-only", "Private Islands"],
    locationOptions: [
      "North Male Atoll",
      "South Male Atoll",
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
    emptyTitle: "No resorts found"
  },
  hotels: {
    eyebrow: "Our Hotels",
    label: "Hotels",
    singular: "hotel",
    path: "/hotels",
    placeholder: "Search hotels...",
    title: "Maldives Hotels With Island Ease",
    body: "Browse hotels and hospitality stays selected for practical access, partner clarity, and polished Maldives itineraries.",
    cta: "Explore Hotels",
    portfolioTitle: "Hotel Portfolio",
    categoryLabel: "Hotel Category",
    categoryAllLabel: "All Hotel Categories",
    categoryOptions: ["Budget-Conscious", "Classic Hotel", "Premium Hotel", "Luxury Hotel", "Business Hotel", "Airport Hotel"],
    selectionOptions: ["City Stay", "Business Travel", "Transit Stay", "Family Oriented", "Budget-Conscious", "Premium Stay"],
    locationOptions: ["Male", "Hulhumale", "Velana International Airport Area", "Greater Male Region", "Addu City", "Other Islands"],
    transferOptions: ["Airport Transfer", "City Transfer", "Speedboat", "Domestic"],
    emptyTitle: "No hotels found"
  },
  liveaboards: {
    eyebrow: "Our Liveaboards",
    label: "Liveaboards",
    singular: "liveaboard",
    path: "/liveaboards",
    placeholder: "Search liveaboards...",
    title: "Luxury Voyages Across The Maldives",
    body: "A focused collection of liveaboards for diving, private charters, and ocean-led itineraries across the Maldives.",
    cta: "Explore Liveaboards",
    portfolioTitle: "Liveaboard Portfolio",
    categoryLabel: "Liveaboard Category",
    categoryAllLabel: "All Liveaboard Categories",
    categoryOptions: ["Budget-Conscious", "Classic Liveaboard", "Premium Liveaboard", "Luxury Liveaboard", "Diving Specialist", "Private Charter"],
    selectionOptions: ["Diving", "Surfing", "Marine Experience", "Private Charter", "Group Travel", "Premium Cruise"],
    locationOptions: ["Male Departure", "Central Atolls", "North Atolls", "South Atolls", "Ari Atoll Route", "Baa Atoll Route", "Deep South Route"],
    transferOptions: ["Male Departure", "Domestic + Vessel", "Speedboat Connection", "Seaplane Connection"],
    emptyTitle: "No liveaboards found"
  }
} satisfies Record<DestinationKind, PortfolioConfig>;

const heroFallbacks = {
  resort: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=2200&q=92",
  hotels: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2200&q=92",
  liveaboards: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=2200&q=92"
} satisfies Record<DestinationKind, string>;

const initialFilters: PortfolioFiltersState = {
  category: "",
  selection: "",
  location: "",
  transfer: ""
};

const initialVisibleCount = 20;

function normalize(value?: string | null) {
  return value?.trim() ?? "";
}

function normalizeDisplay(value: string) {
  return value.replace(/Malé/g, "Male").replace(/Hulhumalé/g, "Hulhumale").replace(/malé/gi, "Male");
}

function formatAtoll(location?: string | null) {
  const value = normalizeDisplay(normalize(location));
  if (!value) {
    return "Maldives";
  }

  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.find((part) => /atoll/i.test(part)) || parts[0] || "Maldives";
}

function matchesOption(value: string, options: string[]) {
  const normalized = normalizeDisplay(value).toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized);
}

function inferCategory(kind: DestinationKind, category: string, summary = "") {
  const config = kindConfig[kind];
  const directMatch = matchesOption(category, config.categoryOptions);
  if (directMatch) {
    return directMatch;
  }

  const text = `${category} ${summary}`.toLowerCase();
  if (/budget|value|affordable|conscious/.test(text)) return "Budget-Conscious";

  if (kind === "resort") {
    if (/ultra/.test(text)) return "Ultra Luxury 5-Star";
    if (/premium/.test(text)) return "Premium 5-Star";
    if (/classic/.test(text)) return "Classic 5-Star";
    return /luxury|5/.test(text) ? "Luxury 5-Star" : "Premium 5-Star";
  }

  if (kind === "hotels") {
    if (/airport/.test(text)) return "Airport Hotel";
    if (/business|transit|city/.test(text)) return "Business Hotel";
    if (/luxury/.test(text)) return "Luxury Hotel";
    if (/classic/.test(text)) return "Classic Hotel";
    return "Premium Hotel";
  }

  if (/charter|private/.test(text)) return "Private Charter";
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

  const text = normalizeDisplay(`${location} ${summary}`).toLowerCase();
  if (kind === "hotels") {
    if (/hulhumal/.test(text)) return "Hulhumale";
    if (/airport|velana/.test(text)) return "Velana International Airport Area";
    if (/addu/.test(text)) return "Addu City";
    if (/male/.test(text)) return "Male";
    return "Other Islands";
  }

  if (kind === "liveaboards") {
    if (/deep south|gaafu|addu/.test(text)) return "Deep South Route";
    if (/baa/.test(text)) return "Baa Atoll Route";
    if (/ari/.test(text)) return "Ari Atoll Route";
    if (/north/.test(text)) return "North Atolls";
    if (/south/.test(text)) return "South Atolls";
    if (/male|departure/.test(text)) return "Male Departure";
    return "Central Atolls";
  }

  return normalizeDisplay(atoll);
}

function inferTransferOptions(kind: DestinationKind, transferType: string, summary = "") {
  const config = kindConfig[kind];
  const values = normalizeDisplay(transferType)
    .split(/[,+/&]| and /i)
    .map((item) => item.trim())
    .filter(Boolean);
  const matches = values
    .map((value) => matchesOption(value, config.transferOptions))
    .filter((value): value is string => Boolean(value));

  if (matches.length) {
    return Array.from(new Set(matches));
  }

  const text = normalizeDisplay(`${transferType} ${summary}`).toLowerCase();
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
  return ["Male Departure"];
}

function inferSelectionTag(kind: DestinationKind, item: ResortSummary, category: string) {
  const configuredTag = item.selectionTags?.find(Boolean);
  if (configuredTag) {
    return configuredTag;
  }

  const text = `${item.name} ${item.location} ${item.category} ${item.summary} ${item.highlights?.join(" ") ?? ""}`.toLowerCase();

  if (kind === "resort") {
    if (/honeymoon|romance|couple/.test(text)) return "Honeymoon";
    if (/all.?inclusive/.test(text)) return "All-Inclusive";
    if (/family|kids|children/.test(text)) return "Family Oriented";
    if (/adult/.test(text)) return "Adults-only";
    if (/private|island|villa/.test(text)) return "Private Islands";
    return category.includes("Ultra") ? "Private Islands" : "Marine Experience";
  }

  if (kind === "hotels") {
    if (/business|corporate|meeting/.test(text)) return "Business Travel";
    if (/transit|airport|overnight/.test(text)) return "Transit Stay";
    if (/family|kids|children/.test(text)) return "Family Oriented";
    if (/budget|value/.test(text)) return "Budget-Conscious";
    if (/premium|luxury|suite/.test(text)) return "Premium Stay";
    return "City Stay";
  }

  if (/surf/.test(text)) return "Surfing";
  if (/charter|private/.test(text)) return "Private Charter";
  if (/group|fleet/.test(text)) return "Group Travel";
  if (/premium|luxury/.test(text)) return "Premium Cruise";
  return "Diving";
}

function normalizePortfolioItems(kind: DestinationKind, items: ResortSummary[]) {
  return items.map((item, index) => {
    const category = inferCategory(kind, normalize(item.category), item.summary);
    const transferOptions = inferTransferOptions(kind, item.transferType, item.summary);
    return {
      id: item.id,
      type: kind,
      name: item.name,
      slug: item.slug,
      image: item.heroImageUrl ?? "",
      category,
      selectionTag: inferSelectionTag(kind, item, category),
      location: inferLocation(kind, item.location, item.summary),
      transferOptions,
      primaryTransferDisplay: transferOptions[0] ?? "",
      recommendedOrder: item.recommendedOrder ?? index + 1,
      createdAt: item.createdAt ?? item.updatedAt ?? "",
      featured: Boolean(item.isFeaturedHomepage)
    } satisfies PortfolioItem;
  });
}

function searchText(item: PortfolioItem) {
  return [
    item.name,
    item.location,
    item.category,
    item.selectionTag,
    item.transferOptions.join(" ")
  ].join(" ").toLowerCase();
}

function sortPortfolioItems(items: PortfolioItem[], sort: SortOption) {
  const next = [...items];
  if (sort === "az") return next.sort((left, right) => left.name.localeCompare(right.name));
  if (sort === "location") return next.sort((left, right) => left.location.localeCompare(right.location) || left.name.localeCompare(right.name));
  if (sort === "category") return next.sort((left, right) => left.category.localeCompare(right.category) || left.name.localeCompare(right.name));
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
  return Boolean(query.trim() || filters.category || filters.selection || filters.location || filters.transfer || sort !== "recommended");
}

function readInitialQueryState() {
  if (typeof window === "undefined") {
    return { query: "", filters: initialFilters, sort: "recommended" as SortOption };
  }

  const params = new URLSearchParams(window.location.search);
  const sort = params.get("sort");
  const validSort: SortOption =
    sort === "az" || sort === "location" || sort === "category" || sort === "recent" ? sort : "recommended";

  return {
    query: params.get("q") ?? "",
    filters: {
      category: params.get("category") ?? "",
      selection: params.get("selection") ?? "",
      location: params.get("location") ?? "",
      transfer: params.get("transfer") ?? ""
    },
    sort: validSort
  };
}

function writeQueryState(query: string, filters: PortfolioFiltersState, sort: SortOption) {
  if (typeof window === "undefined") {
    return;
  }

  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.selection) params.set("selection", filters.selection);
  if (filters.location) params.set("location", filters.location);
  if (filters.transfer) params.set("transfer", filters.transfer);
  if (sort !== "recommended") params.set("sort", sort);

  const nextUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
  window.history.replaceState(null, "", nextUrl);
}

function transferIcon(label: string): LucideIcon {
  if (/seaplane|domestic|flight/i.test(label)) return Plane;
  if (/airport|city|car/i.test(label)) return Car;
  if (/vessel|boat|departure|speedboat/i.test(label)) return Ship;
  return Anchor;
}

function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  allLabel: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedLabel = value || allLabel;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={`portfolio-select ${open ? "is-open" : ""}`} ref={dropdownRef}>
      <button type="button" onClick={() => setOpen((current) => !current)} aria-label={label} aria-expanded={open}>
        <span>{selectedLabel}</span>
      </button>
      <ChevronDown size={15} aria-hidden="true" />
      {open ? (
        <div className="portfolio-select__menu" role="listbox" aria-label={label}>
          {[{ label: allLabel, value: "" }, ...options.map((option) => ({ label: option, value: option }))].map((option) => (
            <button
              type="button"
              className={option.value === value ? "is-selected" : ""}
              key={`${label}-${option.value || "all"}`}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SortSelect({ sort, onSortChange }: { sort: SortOption; onSortChange: (sort: SortOption) => void }) {
  const options: Array<{ label: string; value: SortOption }> = [
    { label: "Recommended", value: "recommended" },
    { label: "A-Z", value: "az" },
    { label: "Location", value: "location" },
    { label: "Category", value: "category" },
    { label: "Recently Added", value: "recent" }
  ];
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((option) => option.value === sort)?.label ?? "Sort";

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={`portfolio-select portfolio-select--sort ${open ? "is-open" : ""}`} ref={dropdownRef}>
      <ArrowUpDown size={14} aria-hidden="true" />
      <button type="button" onClick={() => setOpen((current) => !current)} aria-label="Sort" aria-expanded={open}>
        <span>{selectedLabel}</span>
      </button>
      <ChevronDown size={15} aria-hidden="true" />
      {open ? (
        <div className="portfolio-select__menu" role="listbox" aria-label="Sort">
          {options.map((option) => (
            <button
              type="button"
              className={option.value === sort ? "is-selected" : ""}
              key={option.value}
              role="option"
              aria-selected={option.value === sort}
              onClick={() => {
                onSortChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PortfolioFilters({
  config,
  query,
  filters,
  sort,
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
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onQueryChange: (value: string) => void;
  onFiltersChange: (filters: PortfolioFiltersState) => void;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
}) {
  return (
    <div className="portfolio-controls">
      <div className="portfolio-filter-row" aria-label={`${config.label} portfolio filters`}>
        <label className="portfolio-search">
          <Search size={17} />
          <input
            aria-label={`Search ${config.label.toLowerCase()}`}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={config.placeholder}
          />
        </label>
        <div className="portfolio-filter-row__desktop">
          <FilterSelect
            label={config.categoryLabel}
            value={filters.category}
            options={config.categoryOptions}
            allLabel={config.categoryAllLabel}
            onChange={(value) => onFiltersChange({ ...filters, category: value })}
          />
          <FilterSelect
            label="Our Selection"
            value={filters.selection}
            options={config.selectionOptions}
            allLabel="All Selections"
            onChange={(value) => onFiltersChange({ ...filters, selection: value })}
          />
          <FilterSelect
            label="Location"
            value={filters.location}
            options={config.locationOptions}
            allLabel="All Locations"
            onChange={(value) => onFiltersChange({ ...filters, location: value })}
          />
          <FilterSelect
            label="Transfer Option"
            value={filters.transfer}
            options={config.transferOptions}
            allLabel="All Transfer Options"
            onChange={(value) => onFiltersChange({ ...filters, transfer: value })}
          />
          <SortSelect sort={sort} onSortChange={onSortChange} />
        </div>
        <div className="portfolio-mobile-actions">
          <button type="button" className="portfolio-mobile-filter" onClick={() => onMobileOpenChange(true)}>
            <SlidersHorizontal size={17} />
            Filters
          </button>
          <SortSelect sort={sort} onSortChange={onSortChange} />
        </div>
      </div>

      <MobileFilterDrawer
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

function MobileFilterDrawer({
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
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="portfolio-drawer" role="dialog" aria-modal="true" aria-label={`${config.label} filters`}>
      <button type="button" className="portfolio-drawer__backdrop" onClick={onClose} aria-label="Close filters" />
      <div className="portfolio-drawer__panel" ref={panelRef} tabIndex={-1}>
        <div className="portfolio-drawer__header">
          <h2>Filters</h2>
          <button type="button" onClick={onClose} aria-label="Close filters">
            <X size={20} />
          </button>
        </div>
        <FilterSelect
          label={config.categoryLabel}
          value={filters.category}
          options={config.categoryOptions}
          allLabel={config.categoryAllLabel}
          onChange={(value) => onFiltersChange({ ...filters, category: value })}
        />
        <FilterSelect
          label="Our Selection"
          value={filters.selection}
          options={config.selectionOptions}
          allLabel="All Selections"
          onChange={(value) => onFiltersChange({ ...filters, selection: value })}
        />
        <FilterSelect
          label="Location"
          value={filters.location}
          options={config.locationOptions}
          allLabel="All Locations"
          onChange={(value) => onFiltersChange({ ...filters, location: value })}
        />
        <FilterSelect
          label="Transfer Option"
          value={filters.transfer}
          options={config.transferOptions}
          allLabel="All Transfer Options"
          onChange={(value) => onFiltersChange({ ...filters, transfer: value })}
        />
        <div className="portfolio-drawer__actions">
          <button type="button" onClick={onReset}>
            Clear filters
          </button>
          <button type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function PortfolioGrid({ children }: { children: ReactNode }) {
  return <div className="portfolio-grid">{children}</div>;
}

function PortfolioCard({ item, config, priority = false }: { item: PortfolioItem; config: PortfolioConfig; priority?: boolean }) {
  const image = item.image || heroFallbacks[item.type];
  const TransferIcon = transferIcon(item.primaryTransferDisplay);
  const detailLabel = `View ${item.name} ${config.singular} details`;

  return (
    <article className="portfolio-card">
      <Link href={`${config.path}/${item.slug}`} className="portfolio-card__link" aria-label={detailLabel}>
        <img
          src={optimizedImageUrl(image, { width: 560, height: 700, quality: 90 })}
          alt={`${item.name} ${config.singular}`}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          width={560}
          height={700}
        />
        <span className="portfolio-card__overlay" aria-hidden="true" />
        <span className="portfolio-card__badge">
          <BadgeCheck size={12} aria-hidden="true" />
          {item.category}
        </span>
        <span className="portfolio-card__text">
          <span className="portfolio-card__title">{item.name}</span>
          <span className="portfolio-card__meta">
            <span>
              <MapPin size={13} />
              {item.location}
            </span>
            <span>
              <TransferIcon size={13} />
              {item.primaryTransferDisplay}
            </span>
          </span>
        </span>
      </Link>
    </article>
  );
}

function PortfolioSkeletonCard() {
  return (
    <article className="portfolio-card portfolio-card--skeleton" aria-hidden="true">
      <div className="portfolio-skeleton portfolio-skeleton--image" />
      <div className="portfolio-skeleton portfolio-skeleton--badge" />
      <div className="portfolio-skeleton portfolio-skeleton--bottom" />
    </article>
  );
}

function PortfolioEmptyState({ config, onReset }: { config: PortfolioConfig; onReset: () => void }) {
  return (
    <article className="portfolio-empty">
      <h2>{config.emptyTitle}</h2>
      <p>Try adjusting your filters or search.</p>
      <button type="button" onClick={onReset}>
        Clear filters
      </button>
    </article>
  );
}

function PortfolioResultsBar({
  config,
  resultCount,
  total,
  hasActive,
  onReset
}: {
  config: PortfolioConfig;
  resultCount: number;
  total: number;
  hasActive: boolean;
  onReset: () => void;
}) {
  return (
    <div className="portfolio-results-bar">
      <p>
        Showing <strong>{resultCount}</strong>
        {resultCount === total ? ` ${config.label.toLowerCase()}` : ` of ${total} ${config.label.toLowerCase()}`}
      </p>
      {hasActive ? (
        <button type="button" onClick={onReset}>
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

export function DestinationIndex({ activeKind, items }: DestinationIndexProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<PortfolioFiltersState>(initialFilters);
  const [sort, setSort] = useState<SortOption>("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const hasMounted = useRef(false);
  const config = kindConfig[activeKind];
  const heroImage = items.find((item) => item.heroImageUrl)?.heroImageUrl || heroFallbacks[activeKind];

  const portfolioItems = useMemo(() => normalizePortfolioItems(activeKind, items), [activeKind, items]);

  useEffect(() => {
    const nextState = readInitialQueryState();
    setQuery(nextState.query);
    setDebouncedQuery(nextState.query);
    setFilters(nextState.filters);
    setSort(nextState.sort);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    const filtered = portfolioItems.filter((item) => {
      const matchesQuery = !normalizedQuery || searchText(item).includes(normalizedQuery);
      const matchesCategory = !filters.category || item.category === filters.category;
      const matchesSelection = !filters.selection || item.selectionTag === filters.selection;
      const matchesLocation = !filters.location || item.location === filters.location;
      const matchesTransfer = !filters.transfer || item.transferOptions.includes(filters.transfer);
      return matchesQuery && matchesCategory && matchesSelection && matchesLocation && matchesTransfer;
    });

    return sortPortfolioItems(filtered, sort);
  }, [debouncedQuery, filters, portfolioItems, sort]);

  useEffect(() => {
    setIsFiltering(true);
    setVisibleCount(initialVisibleCount);
    const timer = window.setTimeout(() => setIsFiltering(false), 100);
    return () => window.clearTimeout(timer);
  }, [debouncedQuery, filters, sort]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    writeQueryState(debouncedQuery, filters, sort);
  }, [debouncedQuery, filters, sort]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasActive = hasActiveFilters(query, filters, sort);

  function resetFilters() {
    setQuery("");
    setDebouncedQuery("");
    setFilters(initialFilters);
    setSort("recommended");
    setFiltersOpen(false);
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
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="destination-results portfolio-results" id="destination-results">
        <div className="site-container">
          <div className="portfolio-heading">
            <div>
              <h2>{config.portfolioTitle}</h2>
            </div>
          </div>

          <PortfolioFilters
            config={config}
            query={query}
            filters={filters}
            sort={sort}
            mobileOpen={filtersOpen}
            onMobileOpenChange={setFiltersOpen}
            onQueryChange={setQuery}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            onReset={resetFilters}
          />

          <PortfolioResultsBar
            config={config}
            resultCount={filteredItems.length}
            total={portfolioItems.length}
            hasActive={hasActive}
            onReset={resetFilters}
          />

          {isFiltering ? (
            <PortfolioGrid>
              {Array.from({ length: 10 }).map((_, index) => (
                <PortfolioSkeletonCard key={index} />
              ))}
            </PortfolioGrid>
          ) : filteredItems.length ? (
            <>
              <div id="portfolio-grid">
                <PortfolioGrid>
                  {visibleItems.map((item, index) => (
                    <PortfolioCard key={item.id} item={item} config={config} priority={index < 5} />
                  ))}
                </PortfolioGrid>
              </div>
              {visibleCount < filteredItems.length ? (
                <div className="portfolio-load-more">
                  <button type="button" onClick={() => setVisibleCount((count) => count + initialVisibleCount)}>
                    Load More {config.label}
                    <ChevronDown size={16} />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <PortfolioEmptyState config={config} onReset={resetFilters} />
          )}
        </div>
      </section>
    </main>
  );
}
