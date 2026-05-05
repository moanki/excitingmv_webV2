"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { HomepageGuideItem } from "@/lib/site-content";

const categories = ["All", "Money", "Transport", "Arrival", "Packing", "Culture"];

export function TravelGuideDirectory({ guides }: { guides: HomepageGuideItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filteredGuides = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return guides.filter((guide) => {
      const matchesCategory = category === "All" || guide.category.toLowerCase().includes(category.toLowerCase());
      const searchable = `${guide.title} ${guide.summary} ${guide.category}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, guides, query]);

  return (
    <>
      <div className="guide-directory__tools">
        <label className="guide-directory__search">
          <span>Search travel guides</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search travel guides..."
          />
        </label>
        <div className="guide-directory__filters" aria-label="Travel guide categories">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "is-active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="guide-directory__grid">
        {filteredGuides.map((guide) => (
          <Link href={`/travel-guide/${guide.slug}`} className="guide-directory__card" key={guide.slug}>
            <span>{guide.category}</span>
            <div style={{ backgroundImage: `url(${guide.imageUrl})` }} />
            <h2>{guide.title}</h2>
            <p>{guide.summary || guide.description}</p>
            <strong>Read insight</strong>
          </Link>
        ))}
      </div>
    </>
  );
}
