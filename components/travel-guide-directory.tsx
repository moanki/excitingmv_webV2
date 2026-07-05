"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { HomepageGuideItem } from "@/lib/site-content";
import type { ResortSummary } from "@/lib/types";

const guidesPerPage = 5;
const preferredCategories = ["Money", "Transport", "Arrival", "Packing", "Culture", "Seasons"];
const categoryTints: Record<string, string> = {
  money: "radial-gradient(circle at 74% 32%, #6a5636, transparent 62%)",
  transport: "radial-gradient(circle at 72% 30%, #2f5f7a, transparent 62%)",
  arrival: "radial-gradient(circle at 73% 33%, #2a5a66, transparent 62%)",
  packing: "radial-gradient(circle at 72% 31%, #4a6b3f, transparent 62%)",
  culture: "radial-gradient(circle at 71% 34%, #4a4066, transparent 62%)",
  seasons: "radial-gradient(circle at 70% 35%, #3a5f52, transparent 62%)"
};

function readTime(guide: HomepageGuideItem) {
  const words = [guide.mainContent, ...guide.sections.map((section) => section.body), ...guide.tips]
    .join(" ")
    .trim()
    .split(/\s+/).length;
  return `${Math.max(2, Math.ceil(words / 180))} min`;
}

function articleNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function TravelGuideDirectory({ guides, resorts }: { guides: HomepageGuideItem[]; resorts: ResortSummary[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activeSlug, setActiveSlug] = useState<string>();
  const [page, setPage] = useState(0);

  const categories = useMemo(() => {
    const available = Array.from(new Set(guides.map((guide) => guide.category).filter(Boolean)));
    return [
      "All",
      ...preferredCategories.filter((item) => available.includes(item)),
      ...available.filter((item) => !preferredCategories.includes(item))
    ];
  }, [guides]);

  const filteredGuides = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return guides.filter((guide) => {
      const matchesCategory = category === "All" || guide.category.toLowerCase().includes(category.toLowerCase());
      const searchable = `${guide.title} ${guide.summary} ${guide.category}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, guides, query]);

  const totalPages = Math.max(1, Math.ceil(filteredGuides.length / guidesPerPage));
  const safePage = Math.min(page, totalPages - 1);
  const visibleGuides = filteredGuides.slice(safePage * guidesPerPage, safePage * guidesPerPage + guidesPerPage);
  const activeGuide = guides.find((guide) => guide.slug === activeSlug);
  const activeIndex = activeGuide ? guides.findIndex((guide) => guide.slug === activeGuide.slug) : -1;
  const heroTint = activeGuide
    ? categoryTints[activeGuide.category.toLowerCase()] ?? "radial-gradient(circle at 72% 32%, #315a64, transparent 62%)"
    : "radial-gradient(circle at 76% 32%, #24506b, transparent 60%)";

  function chooseCategory(nextCategory: string) {
    setCategory(nextCategory);
    setPage(0);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setPage(0);
  }

  return (
    <>
      <section className="reading-room__hero" style={{ "--reading-tint": heroTint } as CSSProperties}>
        <div className="reading-room__hero-tint" />
        <div className="reading-room__wrap reading-room__hero-content">
          <p>{activeGuide?.category ?? "Maldives travel guide"}</p>
          <h1>{activeGuide?.title ?? "Practical Maldives information for tourists and partners"}</h1>
          <span>
            {activeGuide
              ? `No. ${articleNumber(activeIndex)} — ${readTime(activeGuide)} read`
              : "Arrivals, transfers, money, and resort fit — curated for those who sell it beautifully."}
          </span>
        </div>
      </section>

      <section className="reading-room__content">
        <div className="reading-room__wrap">
          <label className="reading-room__search">
            <Search aria-hidden="true" size={16} />
            <input
              aria-label="Search travel guides"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search an article or topic…"
            />
          </label>

          <div className="reading-room__tabs" aria-label="Travel guide categories">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={category === item ? "is-active" : ""}
                onClick={() => chooseCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="reading-room__workspace">
            <div className="reading-room__index">
              {visibleGuides.length ? (
                <div className={activeGuide ? "reading-room__list has-active" : "reading-room__list"}>
                  {visibleGuides.map((guide) => {
                    const guideIndex = guides.findIndex((item) => item.slug === guide.slug);
                    const isActive = activeSlug === guide.slug;

                    return (
                      <button
                        type="button"
                        className={isActive ? "reading-room__row is-active" : "reading-room__row"}
                        aria-pressed={isActive}
                        onClick={() => setActiveSlug(guide.slug)}
                        key={guide.slug}
                      >
                        <span className="reading-room__number">No. {articleNumber(guideIndex)}</span>
                        <span className="reading-room__row-copy">
                          <small>{guide.category}</small>
                          <strong>{guide.title}</strong>
                        </span>
                        <ArrowRight className="reading-room__arrow" aria-hidden="true" size={17} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="reading-room__no-results">
                  <strong>No articles match</strong>
                  <span>Try another topic or clear your search.</span>
                </div>
              )}

              {totalPages > 1 ? (
                <div className="reading-room__pager" aria-label="Article pages">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      type="button"
                      key={index}
                      className={safePage === index ? "is-active" : ""}
                      onClick={() => setPage(index)}
                      aria-label={`Page ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="reading-room__divider" />

            <article className="reading-room__panel">
              {activeGuide ? (
                <>
                  <div className="reading-room__panel-meta">
                    <span>{activeGuide.category} · {readTime(activeGuide)} read</span>
                    <button type="button" onClick={() => setActiveSlug(undefined)}>
                      Close <X aria-hidden="true" size={14} />
                    </button>
                  </div>
                  <h2>{activeGuide.title}</h2>

                  {activeGuide.tips.length ? (
                    <aside className="reading-room__tips">
                      <h3>Tips</h3>
                      <ul>
                        {activeGuide.tips.map((tip) => <li key={tip}>{tip}</li>)}
                      </ul>
                    </aside>
                  ) : null}

                  <p>{activeGuide.mainContent || activeGuide.summary}</p>
                  {activeGuide.sections.map((section) => (
                    <section key={section.heading}>
                      <h3>{section.heading}</h3>
                      <p>{section.body}</p>
                    </section>
                  ))}

                  {activeGuide.faq.length ? (
                    <section className="reading-room__faq">
                      <h3>FAQ</h3>
                      {activeGuide.faq.map((item) => (
                        <details key={item.question} open>
                          <summary><ChevronDown aria-hidden="true" size={15} />{item.question}</summary>
                          <p>{item.answer}</p>
                        </details>
                      ))}
                    </section>
                  ) : null}
                </>
              ) : (
                <div className="reading-room__empty">
                  <span><BookOpen aria-hidden="true" size={23} /></span>
                  <h2>Pick up an article<br />to begin reading</h2>
                  <p>Choose any piece from the index and it opens here — the banner above changes to match.</p>
                  <small><ArrowLeft aria-hidden="true" size={14} /> Select from the left</small>
                </div>
              )}
            </article>
          </div>

          {resorts.length ? (
            <section className="reading-room__properties">
              <header>
                <h2>Explore properties</h2>
                <Link href="/resorts">View all resorts</Link>
              </header>
              <div>
                {resorts.map((resort, index) => (
                  <Link href={`/resorts/${resort.slug}`} key={resort.id} className={`reading-room__property tone-${index + 1}`}>
                    <span
                      style={resort.heroImageUrl ? {
                        backgroundImage: `url(${optimizedImageUrl(resort.heroImageUrl, { width: 560, height: 360, quality: 82 })})`
                      } : undefined}
                    />
                    <small>{resort.location}</small>
                    <strong>{resort.name}</strong>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </>
  );
}
