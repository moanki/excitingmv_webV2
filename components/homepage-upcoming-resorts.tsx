import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { defaultUpcomingHomepage, featuredOpenings, visibleOpenings, type OpeningResort, type UpcomingPageContent } from "@/lib/upcoming-resorts";
import "./homepage-upcoming-resorts.css";

const calendarPath = "/upcoming-resorts";

function OpeningCard({ resort, content }: {
  resort: OpeningResort;
  content: UpcomingPageContent;
}) {
  const href = `${calendarPath}#opening-${resort.id}`;
  const status = resort.dateMoved ? content.dateMovedLabel : resort.status;
  const location = [resort.atoll, resort.dateLabel].filter(Boolean).join(" · ");
  const keys = resort.keysLabel && [resort.keysLabel, resort.keyCount !== null && content.keysUnit].filter(Boolean).join(" ");
  const details = [status, keys].filter(Boolean).join(" · ");

  return (
    <article className="opening-home__card">
      <div className="opening-home__media" aria-hidden={resort.imageUrl ? undefined : true}>
        {resort.imageUrl && <img src={resort.imageUrl} alt={resort.imageAlt} loading="lazy" decoding="async" />}
      </div>
      <div className="opening-home__copy">
        <h3><Link href={href}>{resort.name}</Link></h3>
        {location && <p className="opening-home__location">{location}</p>}
        {details && <p className="opening-home__details" data-moved={resort.dateMoved}>{details}</p>}
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
    // Split the last four into pairs so no resort is stranded on its own row.
    const rowSize = featured.length - index === 4 ? 2 : 3;
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
          {rows.map((row) => (
            <div key={row[0].id} className="opening-home__row" data-count={row.length}>
              {row.map((resort) => <OpeningCard key={resort.id} resort={resort} content={content} />)}
            </div>
          ))}
        </div>
        <Link className="opening-home__ask" href={content.teamUrl}>{content.askLabel}</Link>
      </div>
    </section>
  );
}
