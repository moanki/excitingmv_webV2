"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { optimizedImageUrl } from "@/lib/image-urls";
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
  const featuredGuide = filteredGuides[0];
  const supportingGuides = featuredGuide ? filteredGuides.slice(1) : filteredGuides;

  return (
    <>
      <div className="guide-directory__tools">
        <label className="guide-directory__search">
          <span>Search</span>
          <input
            aria-label="Search travel guides"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles, tips and more..."
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

      {featuredGuide ? (
        <Link href={`/travel-guide/${featuredGuide.slug}`} className="guide-directory__featured">
          <div style={{ backgroundImage: `url(${optimizedImageUrl(featuredGuide.imageUrl, { width: 1200, height: 720, quality: 78 })})` }} />
          <article>
            <span>{featuredGuide.category}</span>
            <h2>{featuredGuide.title}</h2>
            <p>{featuredGuide.summary || featuredGuide.description}</p>
            <strong>Read insight</strong>
          </article>
        </Link>
      ) : null}

      <div className="guide-directory__feed-heading">
        <p className="lux-eyebrow">Articles</p>
        <h2>Latest Maldives insights</h2>
      </div>

      <div className="guide-directory__grid">
        {supportingGuides.map((guide) => (
          <Link href={`/travel-guide/${guide.slug}`} className="guide-directory__card" key={guide.slug}>
            <span>{guide.category}</span>
            <div style={{ backgroundImage: `url(${optimizedImageUrl(guide.imageUrl, { width: 420, height: 280, quality: 72 })})` }} />
            <h2>{guide.title}</h2>
            <p>{guide.summary || guide.description}</p>
            <strong>Read insight</strong>
          </Link>
        ))}
      </div>
    </>
  );
}
