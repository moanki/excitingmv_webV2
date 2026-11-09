import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { defaultUpcomingHomepage, featuredOpenings, openingFigures, visibleOpenings, type OpeningResort, type UpcomingPageContent } from "@/lib/upcoming-resorts";
import "./homepage-upcoming-resorts.css";

const calendarPath = "/upcoming-resorts";
const sourceDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
});

function OpeningCard({ resort, content, placement }: {
  resort: OpeningResort;
  content: UpcomingPageContent;
  placement?: "lead" | "second" | "third";
}) {
  const lead = placement === "lead";
  const status = resort.dateMoved ? content.dateMovedLabel : resort.status;
  const location = [resort.atoll, resort.operator].filter(Boolean).join(" · ");
  const keys = resort.keysLabel && [resort.keysLabel, resort.keyCount !== null && content.keysUnit].filter(Boolean).join(" ");
  const timing = [resort.dateLabel, keys].filter(Boolean).join(" · ");

  return (
    <article className="opening-home__card" data-placement={placement}>
      {resort.imageUrl && <div className="opening-home__media">
        <img src={resort.imageUrl} alt={resort.imageAlt} loading="lazy" decoding="async" />
      </div>}
      <div className="opening-home__copy">
        <p className="opening-home__status">
          <span data-moved={resort.dateMoved}>{status}</span>
          {lead && resort.dateLabel}
        </p>
        <h3><Link href={`${calendarPath}#opening-${resort.id}`}>{resort.name}</Link></h3>
        {(location || lead && keys) && <p>{[location, lead && keys].filter(Boolean).join(" · ")}</p>}
        {!lead && timing && <p>{timing}</p>}
        {lead && resort.highlights && <p className="opening-home__summary">{resort.highlights}</p>}
      </div>
    </article>
  );
}

export function HomepageUpcomingResorts({ content }: { content: UpcomingPageContent }) {
  if (!content.enabled) return null;

  const copy = { ...defaultUpcomingHomepage, ...content.homepage };
  const [lead, second, third, ...additional] = featuredOpenings(content);
  if (!lead) {
    return <section className="opening-home opening-home--empty" aria-label={copy.title}>
      <div className="lux-container">
        <Link className="opening-home__explore" href={calendarPath}>{copy.exploreLabel}<ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </section>;
  }

  const openings = visibleOpenings(content);
  const figures = openingFigures(openings);
  const firstMoved = openings.find((resort) => resort.dateMoved);
  const checkedOn = openings[0].checkedOn;
  const sharedCheckDate = checkedOn && openings.every((resort) => resort.checkedOn === checkedOn);
  const viewAll = copy.viewAllLabel.replaceAll("{count}", figures.openings.toLocaleString("en-GB"));

  return (
    <section className="opening-home" aria-label={copy.title}>
      <div className="lux-container">
        <header className="opening-home__header">
          <h2>{copy.title}</h2>
          {copy.description && <p>{copy.description}</p>}
        </header>
        <div className="opening-home__grid" data-featured={third ? 3 : second ? 2 : 1}>
          <OpeningCard resort={lead} content={content} placement="lead" />
          {second && <OpeningCard resort={second} content={content} placement="second" />}
          <div className="opening-home__metric" data-metric="openings">
            <strong>{figures.openings.toLocaleString("en-GB")}</strong>
            <p>{copy.openingsLabel.replaceAll("{atolls}", figures.atolls.toLocaleString("en-GB"))}</p>
          </div>
          <div className="opening-home__metric" data-metric="keys">
            <strong>{figures.keys.toLocaleString("en-GB")}</strong>
            <p>{copy.keysLabel}</p>
          </div>
          {third && <OpeningCard resort={third} content={content} placement="third" />}
          <div className="opening-home__metric" data-metric="moved">
            <strong>{figures.moved.toLocaleString("en-GB")}</strong>
            <div>
              <p>{copy.movedLabel}</p>
              {firstMoved && <Link href={`${calendarPath}#opening-${firstMoved.id}`}>{copy.movedLinkLabel}</Link>}
            </div>
          </div>
          <Link className="opening-home__all" href={calendarPath}>
            <span>{viewAll}</span>
            <ArrowRight size={24} aria-hidden="true" />
          </Link>
        </div>
        {additional.length > 0 && <div className="opening-home__extras">
          {additional.map((resort) => <OpeningCard key={resort.id} resort={resort} content={content} />)}
        </div>}
        <footer className="opening-home__footer">
          {(sharedCheckDate || copy.dateNote) && (
            <p>
              {sharedCheckDate && <>{content.checkedLabel} <time dateTime={checkedOn}>{sourceDate.format(new Date(checkedOn))}</time>. </>}
              {copy.dateNote}
            </p>
          )}
          <Link className="opening-home__ask" href={content.teamUrl}>{content.askLabel}</Link>
        </footer>
      </div>
    </section>
  );
}
