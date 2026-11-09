import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { defaultUpcomingHomepage, featuredOpenings, homepageImagePosition, openingFigures, visibleOpenings, type UpcomingPageContent } from "@/lib/upcoming-resorts";
import { OpeningPhotoGallery } from "./opening-photo-gallery";
import "./homepage-upcoming-resorts.css";

const calendarPath = "/upcoming-resorts";

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

  const photos = featured.map((resort) => ({
    id: resort.id,
    name: resort.name,
    details: [resort.atoll, resort.dateLabel].filter(Boolean).join(" · "),
    href: `${calendarPath}#opening-${resort.id}`,
    imageUrl: resort.imageUrl,
    imageAlt: resort.imageAlt,
    objectPosition: homepageImagePosition(resort.homepageFocalPoint)
  }));
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
        <OpeningPhotoGallery photos={photos} />
        <footer className="opening-home__footer">
          <p>{summary}</p>
          <Link className="opening-home__link" href={calendarPath}>{viewAll}<ArrowRight size={18} aria-hidden="true" /></Link>
        </footer>
      </div>
    </section>
  );
}
