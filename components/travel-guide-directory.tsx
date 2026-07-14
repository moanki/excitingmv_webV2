"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, Search } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent
} from "react";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { CatalogueContent, HomepageGuideItem } from "@/lib/site-content";
import { relatedResortsForGuide, travelGuideReadTime, travelGuideTags } from "@/lib/travel-guide-utils";
import type { ResortSummary } from "@/lib/types";

const guidesPerPage = 5;
const preferredCategories = ["Money", "Transport", "Arrival", "Packing", "Culture", "Seasons"];

function articleNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

function ReaderArticle({ guide, tags }: { guide: HomepageGuideItem; tags: string[] }) {
  return (
    <>
      {guide.summary ? (
        <aside className="reading-room__partner-brief">
          <span>Partner brief</span>
          <p>{guide.summary}</p>
        </aside>
      ) : null}

      {tags.length ? (
        <div className="reading-room__best-for" aria-label="Guide themes">
          <span>Useful for</span>
          <div>{tags.map((tag) => <strong key={tag}>{tag}</strong>)}</div>
        </div>
      ) : null}

      {guide.mainContent ? <p>{guide.mainContent}</p> : null}

      {guide.tips.length ? (
        <aside className="reading-room__tips">
          <h3>Agent tips</h3>
          <ul>
            {guide.tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </aside>
      ) : null}

      {guide.sections.map((section) => (
        <section key={section.heading}>
          <h3>{section.heading}</h3>
          <p>{section.body}</p>
        </section>
      ))}

      {guide.faq.length ? (
        <section className="reading-room__faq">
          <h3>FAQ</h3>
          {guide.faq.map((item) => (
            <details key={item.question}>
              <summary><ChevronDown aria-hidden="true" size={15} />{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </section>
      ) : null}
    </>
  );
}

export function TravelGuideDirectory({
  guides,
  catalogue,
  resorts,
  initialArticleSlug
}: {
  guides: HomepageGuideItem[];
  catalogue: CatalogueContent;
  resorts: ResortSummary[];
  initialArticleSlug?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activeSlug, setActiveSlug] = useState(initialArticleSlug);
  const [page, setPage] = useState(0);
  const [readerOpen, setReaderOpen] = useState(Boolean(initialArticleSlug));
  const [progress, setProgress] = useState(0);
  const readerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
  const activeTags = activeGuide ? travelGuideTags(activeGuide) : [];
  const relatedResorts = activeGuide ? relatedResortsForGuide(activeGuide, resorts) : [];
  const heroTint = "radial-gradient(circle at 76% 32%, #24506b, transparent 60%)";
  const catalogueHeroUrl = optimizedImageUrl(
    catalogue.heroImageUrl,
    { width: 1920, height: 900, quality: 90 }
  );
  const readerHeroUrl = optimizedImageUrl(
    activeGuide?.imageUrl || catalogue.heroImageUrl,
    { width: 1920, height: 1080, quality: 90 }
  );

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("article");
    if (slug && guides.some((guide) => guide.slug === slug)) {
      setActiveSlug(slug);
      setReaderOpen(true);
    }
  }, [guides]);

  useEffect(() => {
    if (!readerOpen || !activeGuide) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeReader();
        return;
      }
      if (event.key !== "Tab" || !readerRef.current) return;

      const focusable = Array.from(
        readerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], details summary, [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeGuide, readerOpen]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  function chooseCategory(nextCategory: string) {
    setCategory(nextCategory);
    setPage(0);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setPage(0);
  }

  function updateArticleUrl(slug?: string) {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("article", slug);
    else url.searchParams.delete("article");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function openArticle(slug: string, event: ReactMouseEvent<HTMLButtonElement>) {
    clearTimeout(closeTimerRef.current);
    setActiveSlug(slug);
    setProgress(0);
    updateArticleUrl(slug);
    triggerRef.current = event.currentTarget;
    setReaderOpen(true);
  }

  function closeReader() {
    setReaderOpen(false);
    updateArticleUrl();
    closeTimerRef.current = setTimeout(() => {
      setActiveSlug(undefined);
      triggerRef.current?.focus();
    }, 280);
  }

  function selectReaderArticle(slug: string) {
    setActiveSlug(slug);
    setProgress(0);
    readerRef.current?.scrollTo({ top: 0 });
    updateArticleUrl(slug);
  }

  function updateProgress() {
    const reader = readerRef.current;
    if (!reader) return;
    const available = reader.scrollHeight - reader.clientHeight;
    setProgress(available > 0 ? (reader.scrollTop / available) * 100 : 100);
  }

  return (
    <>
      <section className="reading-room__hero" style={{ "--reading-tint": heroTint } as CSSProperties}>
        <div
          className="reading-room__hero-image"
          style={catalogueHeroUrl ? { backgroundImage: `url(${JSON.stringify(catalogueHeroUrl)})` } : undefined}
        />
        <div className="reading-room__hero-tint" />
        <div className="reading-room__wrap reading-room__hero-content">
          <div>
            <p>{catalogue.eyebrow || "Destination Intelligence"}</p>
            <h1>{catalogue.title || "Maldives Travel Guide"}</h1>
            <span>{catalogue.body || "Practical destination insights, selling angles, and planning guidance for partners positioning the Maldives with confidence."}</span>
          </div>
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
                <div className="reading-room__list">
                  {visibleGuides.map((guide) => {
                    const guideIndex = guides.findIndex((item) => item.slug === guide.slug);
                    const isActive = activeSlug === guide.slug;
                    const tags = travelGuideTags(guide);

                    return (
                      <button
                        type="button"
                        className={isActive ? "reading-room__row is-active" : "reading-room__row"}
                        aria-pressed={isActive}
                        aria-haspopup="dialog"
                        onClick={(event) => openArticle(guide.slug, event)}
                        key={guide.slug}
                      >
                        <span className="reading-room__row-meta">
                          <small>Guide {articleNumber(guideIndex)}</small>
                          <small>{guide.category}</small>
                          <small>{travelGuideReadTime(guide)} read</small>
                        </span>
                        <span className="reading-room__row-copy">
                          <strong>{guide.title}</strong>
                          <span>{guide.summary || guide.description}</span>
                          {tags.length ? (
                            <span className="reading-room__row-tags">
                              {tags.map((tag) => <em key={tag}>{tag}</em>)}
                            </span>
                          ) : null}
                        </span>
                        <span className="reading-room__row-cta">Open insight <ArrowRight aria-hidden="true" size={16} /></span>
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
          </div>
        </div>
      </section>

      {activeGuide ? (
        <div
          className={readerOpen ? "reading-room__reader is-open" : "reading-room__reader"}
        >
          <div className="reading-room__reader-backdrop" aria-hidden="true" onMouseDown={closeReader} />
          <div
            className="reading-room__reader-shell"
            ref={readerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="travel-guide-reader-title"
            onScroll={updateProgress}
          >
            <div className="reading-room__reader-progress" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
            <header className="reading-room__reader-header">
              <button ref={closeRef} type="button" onClick={closeReader} aria-label="Close article and return to guides">
                <ArrowLeft aria-hidden="true" size={17} /> Back to guides
              </button>
              <span>Guide {articleNumber(activeIndex)} · {activeGuide.category} · {travelGuideReadTime(activeGuide)} read</span>
            </header>

            <div
              className="reading-room__reader-hero"
              style={readerHeroUrl ? { backgroundImage: `url(${JSON.stringify(readerHeroUrl)})` } : undefined}
            >
              <div className="reading-room__reader-hero-overlay" />
              <div className="reading-room__reader-hero-copy">
                <p>{activeGuide.category}</p>
                <h2 id="travel-guide-reader-title">{activeGuide.title}</h2>
                {activeGuide.summary ? <span>{activeGuide.summary}</span> : null}
              </div>
            </div>

            <article className="reading-room__reader-article">
              <div>
                <ReaderArticle guide={activeGuide} tags={activeTags} />
              </div>

              <section className="reading-room__related">
                <header>
                  <p>Contextual recommendations</p>
                  <h3>{relatedResorts.length ? "Relevant stays for this guide" : "Continue your Maldives research"}</h3>
                </header>
                {relatedResorts.length ? (
                  <div>
                    {relatedResorts.map((resort) => (
                      <Link href={`/resorts/${resort.slug}`} key={resort.id}>
                        <span
                          style={resort.heroImageUrl ? {
                            backgroundImage: `url(${optimizedImageUrl(resort.heroImageUrl, { width: 520, height: 340, quality: 82 })})`
                          } : undefined}
                        />
                        <small>{resort.transferType || resort.location}</small>
                        <strong>{resort.name}</strong>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link className="reading-room__related-all" href="/resorts">
                    Explore all resorts <ArrowRight aria-hidden="true" size={15} />
                  </Link>
                )}
              </section>

              <nav className="reading-room__reader-nav" aria-label="Travel guide article navigation">
                {activeIndex > 0 ? (
                  <button type="button" onClick={() => selectReaderArticle(guides[activeIndex - 1].slug)}>
                    <ArrowLeft aria-hidden="true" size={16} />
                    <span><small>Previous</small>{guides[activeIndex - 1].title}</span>
                  </button>
                ) : <span />}
                {activeIndex < guides.length - 1 ? (
                  <button type="button" onClick={() => selectReaderArticle(guides[activeIndex + 1].slug)}>
                    <span><small>Next</small>{guides[activeIndex + 1].title}</span>
                    <ArrowRight aria-hidden="true" size={16} />
                  </button>
                ) : null}
              </nav>
            </article>
          </div>
        </div>
      ) : null}
    </>
  );
}
