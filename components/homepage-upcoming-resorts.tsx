import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { defaultUpcomingHomepage, featuredOpenings, homepageImagePosition, openingFigures, visibleOpenings, type OpeningResort, type UpcomingPageContent } from "@/lib/upcoming-resorts";
import "./homepage-upcoming-resorts.css";

const calendarPath = "/upcoming-resorts";

function OpeningPhoto({ resort }: { resort: OpeningResort }) {
  const details = [resort.atoll, resort.dateLabel].filter(Boolean).join(" · ");

  return (
    <article className="opening-home__photo">
      {resort.imageUrl && <div className="opening-home__media">
        <img src={resort.imageUrl} alt={resort.imageAlt} loading="lazy" decoding="async" style={{ objectPosition: homepageImagePosition(resort.homepageFocalPoint) }} />
      </div>}
      <div className="opening-home__caption">
        <h3><Link href={`${calendarPath}#opening-${resort.id}`}>{resort.name}</Link></h3>
        {details && <p>{details}</p>}
      </div>
    </article>
  );
}

export function HomepageUpcomingResorts({ content }: { content: UpcomingPageContent }) {
  if (!content.enabled) return null;

  const copy = { ...defaultUpcomingHomepage, ...content.homepage };
  const featured = featuredOpenings(content);
  if (!featured.length) {
    return <section className="opening-home opening-home--empty" aria-label={copy.title}>
      <div className="lux-container">
        <Link className="opening-home__link" href={calendarPath}>{copy.exploreLabel}<ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
    </section>;
  }

  const preset = Math.min(featured.length, 6);
  const split = preset === 4 || preset === 5;
  const figures = openingFigures(visibleOpenings(content));
  const count = figures.openings.toLocaleString("en-GB");
  const atolls = figures.atolls.toLocaleString("en-GB");
  const summary = `${count} ${copy.openingsLabel.replaceAll("{atolls}", atolls)}`;
  const viewAll = copy.viewAllLabel.replaceAll("{count}", count);

  return (
    <section className="opening-home" aria-label={copy.title}>
      <div className="lux-container">
        <header className="opening-home__header">
          {copy.eyebrow && <p className="opening-home__eyebrow">{copy.eyebrow}</p>}
          <h2>{copy.title}</h2>
          {copy.description && <p>{copy.description}</p>}
        </header>
        <div className="opening-home__gallery" data-preset={preset} data-odd={featured.length % 2 === 1}>
          {split ? <>
            <OpeningPhoto resort={featured[0]} />
            <div className="opening-home__companions">
              {featured.slice(1).map((resort) => <OpeningPhoto key={resort.id} resort={resort} />)}
            </div>
          </> : featured.map((resort) => <OpeningPhoto key={resort.id} resort={resort} />)}
        </div>
        <footer className="opening-home__footer">
          <p>{summary}</p>
          <Link className="opening-home__link" href={calendarPath}>{viewAll}<ArrowRight size={18} aria-hidden="true" /></Link>
        </footer>
      </div>
    </section>
  );
}
