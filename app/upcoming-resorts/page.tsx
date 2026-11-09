import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { getUpcomingResorts } from "@/lib/services/upcoming-resorts-service";
import { openingStats, visibleOpenings } from "@/lib/upcoming-resorts";
import "./upcoming-resorts.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getUpcomingResorts();
  return page ? { title: page.content.seoTitle, description: page.content.seoDescription } : {};
}

export default async function UpcomingResortsPage() {
  const page = await getUpcomingResorts();
  if (!page?.content.enabled) notFound();
  const c = page.content;
  const resorts = visibleOpenings(c);
  const sections = c.sections.filter((s) => s.enabled);
  let index = 0;

  return <main className="opening-calendar">
    <section className="opening-hero">
      {c.bannerUrl && <img className="opening-hero__image" src={c.bannerUrl} alt={c.bannerAlt} fetchPriority="high" />}
      <div className="opening-hero__shade" />
      <div className="opening-wrap opening-hero__content">
        {c.eyebrow && <p className="opening-eyebrow">{c.eyebrow}</p>}
        <h1>{c.title}{c.subtitle && <span>{c.subtitle}</span>}</h1>
        {c.description && <p className="opening-hero__description">{c.description}</p>}
        <nav className="opening-jumps" aria-label={c.jumpLabel}>
          {sections.map((s) => <a key={s.id} href={`#year-${s.id}`}>{s.jumpLabel || `${c.jumpLabel} ${s.title}`}<ArrowRight size={15} aria-hidden="true" /></a>)}
        </nav>
        {c.bannerCaption && <p className="opening-hero__caption">{c.bannerCaption}</p>}
        {c.stats.length > 0 && <dl className="opening-stats">{openingStats(c).map((stat) => <div key={stat.id}><dt>{stat.label}</dt><dd>{stat.displayValue}</dd></div>)}</dl>}
      </div>
    </section>
    <div className="opening-wrap opening-years">
      {resorts.length === 0 && <p className="opening-empty">{c.emptyMessage}</p>}
      {sections.map((section) => <section className="opening-year" id={`year-${section.id}`} key={section.id} aria-labelledby={`heading-${section.id}`}>
        <header className="opening-year__heading"><h2 id={`heading-${section.id}`}>{section.title}</h2><p>{section.description}</p></header>
        <ol className="opening-timeline">
          {resorts.filter((r) => r.sectionId === section.id).map((r) => {
            index += 1;
            return <li className="opening-row" key={r.id}>
              <div className="opening-date"><span className="opening-index">{String(index).padStart(2, "0")}</span>
                <p>{r.launchDate ? <time dateTime={r.launchDate}>{r.dateLabel}</time> : r.dateLabel}</p>
                {r.dateMoved && <span className="opening-moved">{c.dateMovedLabel}</span>}
              </div>
              <article className="opening-card">
                <figure className={`opening-card__media${r.imageUrl ? "" : " is-empty"}`}>
                  {r.imageUrl && <img src={r.imageUrl} alt={r.imageAlt} loading="lazy" />}
                  {r.imageCaption && <figcaption>{r.imageCaption}</figcaption>}
                </figure>
                <div className="opening-card__body">
                  <div className="opening-card__status">{r.status}</div>
                  <h3>{r.name}</h3>
                  <p className="opening-card__location">{[r.atoll, r.operator].filter(Boolean).join(" · ")}</p>
                  <p className="opening-card__highlights">{r.highlights}</p>
                  <div className="opening-card__details">
                    {r.keysLabel && <span className="opening-keys">{r.keysLabel} <span>{c.keysUnit}</span></span>}
                    {r.note && <span className="opening-card__note">{r.note}</span>}
                    <Link className="opening-ask" href={c.teamUrl}>{c.askLabel}<ArrowRight size={15} aria-hidden="true" /></Link>
                  </div>
                  {(r.officialUrl || r.sourceUrl) && <div className="opening-sources">
                    {r.officialUrl && <a href={r.officialUrl} target="_blank" rel="noopener noreferrer"><span>{c.officialLabel}<ArrowUpRight size={13} aria-hidden="true" /></span><small>{r.officialUrl}</small></a>}
                    {r.sourceUrl && <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer"><span>{c.sourceLabel}<ArrowUpRight size={13} aria-hidden="true" /></span><small>{r.sourceUrl}</small></a>}
                  </div>}
                  {r.checkedOn && <p className="opening-checked">{c.checkedLabel} <time dateTime={r.checkedOn}>{r.checkedOn}</time></p>}
                </div>
              </article>
            </li>;
          })}
        </ol>
      </section>)}
      {c.disclaimer && <p className="opening-disclaimer">{c.disclaimer}</p>}
    </div>
    <section className="opening-guidance"><div className="opening-wrap">
      <div><h2>{c.guidanceTitle}</h2><p>{c.guidanceBody}</p></div>
      <div><h2>{c.ctaTitle}</h2><p>{c.ctaBody}</p>{c.ctaLabel && <Link href={c.teamUrl}>{c.ctaLabel}<ArrowRight size={16} aria-hidden="true" /></Link>}</div>
    </div></section>
  </main>;
}
