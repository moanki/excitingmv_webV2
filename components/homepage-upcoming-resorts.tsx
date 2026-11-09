import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { defaultUpcomingHomepage, featuredOpenings, visibleOpenings, type OpeningResort, type UpcomingPageContent } from "@/lib/upcoming-resorts";
import "./homepage-upcoming-resorts.css";

const calendarPath = "/upcoming-resorts";

function OpeningCard({ resort, content, lead = false }: {
  resort: OpeningResort;
  content: UpcomingPageContent;
  lead?: boolean;
}) {
  const href = `${calendarPath}#opening-${resort.id}`;
  const status = resort.dateMoved ? content.dateMovedLabel : resort.status;
  const location = [resort.atoll, lead ? resort.operator : resort.dateLabel].filter(Boolean).join(" · ");

  return (
    <article className={`opening-home__card${lead ? " opening-home__card--lead" : ""}`}>
      <div className="opening-home__media">
        {resort.imageUrl && <img src={resort.imageUrl} alt={resort.imageAlt} loading="lazy" decoding="async" />}
      </div>
      <div className="opening-home__copy">
        {lead && <div className="opening-home__timing">
          <span className="opening-home__badge" data-moved={resort.dateMoved}>{status}</span>
          <span>{resort.dateLabel}</span>
        </div>}
        <h3><Link href={href}>{resort.name}</Link></h3>
        {location && <p className="opening-home__location">{location}</p>}
        {lead && resort.highlights && <p className="opening-home__summary">{resort.highlights}</p>}
        <div className="opening-home__actions">
          {!lead && <span className="opening-home__badge" data-moved={resort.dateMoved}>{status}</span>}
          {resort.keysLabel && <span>{resort.keysLabel}{resort.keyCount !== null && content.keysUnit ? ` ${content.keysUnit}` : ""}</span>}
          {lead && <Link className="opening-home__ask" href={content.teamUrl}>{content.askLabel}</Link>}
        </div>
      </div>
    </article>
  );
}

export function HomepageUpcomingResorts({ content }: { content: UpcomingPageContent }) {
  if (!content.enabled) return null;

  const copy = content.homepage ?? defaultUpcomingHomepage;
  const [lead, ...featured] = featuredOpenings(content);
  if (!lead) {
    return <section className="opening-home opening-home--empty" aria-label={copy.title}>
      <div className="lux-container">
        <Link className="opening-home__explore" href={calendarPath}>{copy.exploreLabel}<ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </section>;
  }

  const supporting = featured.slice(0, 2);
  const remaining = featured.slice(2);
  const viewAll = copy.viewAllLabel.replaceAll("{count}", String(visibleOpenings(content).length));

  return (
    <section className="opening-home" aria-label={copy.title}>
      <div className="lux-container">
        <header className="opening-home__header">
          <div>
            <h2>{copy.title}</h2>
            {copy.description && <p>{copy.description}</p>}
          </div>
          <Link className="opening-home__all" href={calendarPath}>{viewAll}</Link>
        </header>
        <div className="opening-home__grid" data-count={supporting.length + 1}>
          <OpeningCard resort={lead} content={content} lead />
          {supporting.length > 0 && <div className="opening-home__supporting">
            {supporting.map((resort) => <OpeningCard key={resort.id} resort={resort} content={content} />)}
          </div>}
        </div>
        {remaining.length > 0 && <div className="opening-home__remaining">
          {remaining.map((resort) => <OpeningCard key={resort.id} resort={resort} content={content} />)}
        </div>}
      </div>
    </section>
  );
}
