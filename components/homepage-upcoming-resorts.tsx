import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { defaultUpcomingHomepage, featuredOpenings, visibleOpenings, type OpeningResort, type UpcomingPageContent } from "@/lib/upcoming-resorts";
import "./homepage-upcoming-resorts.css";

const calendarPath = "/upcoming-resorts";

function OpeningCard({ resort, content, lead = false, showTeam = false }: {
  resort: OpeningResort;
  content: UpcomingPageContent;
  lead?: boolean;
  showTeam?: boolean;
}) {
  const href = `${calendarPath}#opening-${resort.id}`;
  const status = resort.dateMoved ? content.dateMovedLabel : resort.status;
  const location = [resort.atoll, lead ? resort.operator : resort.dateLabel].filter(Boolean).join(" · ");
  const keys = resort.keysLabel && [resort.keysLabel, resort.keyCount !== null && content.keysUnit].filter(Boolean).join(" ");
  const badge = status && <span className="opening-home__badge" data-moved={resort.dateMoved}>{status}</span>;

  return (
    <article className={`opening-home__card${lead ? " opening-home__card--lead" : ""}`}>
      <div className="opening-home__media" aria-hidden={resort.imageUrl ? undefined : true}>
        {resort.imageUrl && <img src={resort.imageUrl} alt={resort.imageAlt} loading="lazy" decoding="async" />}
      </div>
      <div className="opening-home__copy">
        {lead && (badge || resort.dateLabel) && (
          <div className="opening-home__details">
            {badge}
            {resort.dateLabel && <span>{resort.dateLabel}</span>}
          </div>
        )}
        <h3><Link href={href}>{resort.name}</Link></h3>
        {location && <p className="opening-home__location">{location}</p>}
        {lead && resort.highlights && <p className="opening-home__summary">{resort.highlights}</p>}
        {(!lead && badge || keys || showTeam) && (
          <div className="opening-home__details">
            {!lead && badge}
            {keys && <span>{keys}</span>}
            {showTeam && <Link className="opening-home__ask" href={content.teamUrl}>{content.askLabel}</Link>}
          </div>
        )}
      </div>
    </article>
  );
}

export function HomepageUpcomingResorts({ content }: { content: UpcomingPageContent }) {
  if (!content.enabled) return null;

  const copy = content.homepage ?? defaultUpcomingHomepage;
  const featured = featuredOpenings(content);
  if (featured.length === 0) {
    return <section className="opening-home opening-home--empty" aria-label={copy.title}>
      <div className="lux-container">
        <Link className="opening-home__explore" href={calendarPath}>{copy.exploreLabel}<ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </section>;
  }

  const rows: OpeningResort[][] = [];
  for (let index = 0; index < featured.length;) {
    // Keep four together so a single card never starts a second group.
    const rowSize = featured.length - index === 4 ? 4 : 3;
    rows.push(featured.slice(index, index + rowSize));
    index += rowSize;
  }
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
        <div className="opening-home__grid">
          {rows.map(([lead, ...supporting], index) => (
            <div key={lead.id} className="opening-home__row" data-count={supporting.length + 1}>
              <OpeningCard resort={lead} content={content} lead showTeam={index === 0} />
              {supporting.length > 0 && <div className="opening-home__supporting">
                {supporting.map((resort) => <OpeningCard key={resort.id} resort={resort} content={content} />)}
              </div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
