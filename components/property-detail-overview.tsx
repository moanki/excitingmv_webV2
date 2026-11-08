import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Accessibility,
  ArrowLeft,
  Armchair,
  Baby,
  Bath,
  BedDouble,
  BottleWine,
  Car,
  ChefHat,
  CircleCheck,
  Clock,
  Coffee,
  ConciergeBell,
  Dumbbell,
  FileDown,
  Flower2,
  Heart,
  HeartPulse,
  MapPin,
  Network,
  Plane,
  Sailboat,
  Share2,
  ShipWheel,
  Sparkles,
  TreePalm,
  Utensils,
  UsersRound,
  Waves,
  Wifi
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { ResortCuratedMoment } from "@/lib/types";
import { PropertyInquiry } from "@/components/property-inquiry";

type DetailFact = {
  label: string;
  value: string;
  Icon: LucideIcon;
  href?: string;
};

type PropertyDetailOverviewProps = {
  actionLabel: string;
  backHref: string;
  curatedMoments: ResortCuratedMoment[];
  facts: DetailFact[];
  heroImageUrl?: string;
  kicker: string;
  name: string;
  overviewCopy: string;
  overviewTitle: string;
  roomsHref?: string;
  roomsLabel?: string;
};

type AmenityIconRule = {
  terms: RegExp;
  Icon: LucideIcon;
};

const curatedIconRules: AmenityIconRule[] = [
  { terms: /\bconnected islands?\b/i, Icon: Network },
  { terms: /\bno waiting\b/i, Icon: CircleCheck },
  { terms: /\b(room types?|bedrooms?|villas?|residences?|houses?)\b/i, Icon: BedDouble },
  { terms: /\b(couples?|famil(?:y|ies)|groups?)\b/i, Icon: UsersRound },
  { terms: /\b(wi[ -]?fi|wireless|internet)\b/i, Icon: Wifi },
  { terms: /\b(spas?|massages?|saunas?|steam|therapy)\b/i, Icon: Flower2 },
  { terms: /\b(wellness|yoga|meditation|relaxation)\b/i, Icon: HeartPulse },
  { terms: /\b(fitness|gyms?|training)\b/i, Icon: Dumbbell },
  { terms: /\b(pools?|beaches?|lagoon|sundeck)\b/i, Icon: Waves },
  { terms: /\b(snorkel(l?ing)?|diving|dive|reefs?|marine)\b/i, Icon: Waves },
  { terms: /\b(wheelchair|accessib(le|ility)|disabled|grab rails)\b/i, Icon: Accessibility },
  { terms: /\b(baths?|bathroom|shower|toilet)\b/i, Icon: Bath },
  { terms: /\b(seating|sofa|living area|desk)\b/i, Icon: Armchair },
  { terms: /\b(kids?|family|child|children|babysitting)\b/i, Icon: Baby },
  { terms: /\b(restaurants?|dining|breakfast|meals?|food)\b/i, Icon: Utensils },
  { terms: /\b(chefs?|culinary|kitchen)\b/i, Icon: ChefHat },
  { terms: /\b(bars?|wine|cocktails?|champagne)\b/i, Icon: BottleWine },
  { terms: /\b(coffee|caf[eé]s?)\b/i, Icon: Coffee },
  { terms: /\b(seaplanes?|planes?|transfers?|airport|cars?|taxi)\b/i, Icon: Plane },
  { terms: /\b(boats?|yachts?|liveaboard|charter|sailing|sail|cruises?)\b/i, Icon: Sailboat },
  { terms: /\b(front desk|concierge|butler|jadugar|services?)\b/i, Icon: ConciergeBell },
  { terms: /\b(gardens?|island|palm|terrace|outdoor|cycling|bikes?)\b/i, Icon: TreePalm },
  { terms: /\b(anchor|excursions?|activities|activity|experiences?|adventures?)\b/i, Icon: ShipWheel },
  { terms: /\b(24[ -]hour|open|clock)\b/i, Icon: Clock }
];
const initialCuratedItemLimit = 20;

function cleanText(value: string | undefined) {
  return value?.trim() ?? "";
}

function displayCuratedMoment(item: ResortCuratedMoment) {
  const title = cleanText(item.title);
  const description = cleanText(item.description);

  if (description || !title.includes(":")) {
    return { ...item, title, description };
  }

  const [first, ...rest] = title.split(":");
  const splitDescription = rest.join(":").trim();
  return splitDescription ? { ...item, title: first.trim(), description: splitDescription } : { ...item, title, description };
}

function splitOverviewCopy(copy: string) {
  const sentences = copy.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [copy];

  if (sentences.length <= 2) {
    return [copy];
  }

  const midpoint = Math.ceil(sentences.length / 2);
  return [sentences.slice(0, midpoint).join(" "), sentences.slice(midpoint).join(" ")].filter(Boolean);
}

function iconForMoment(item: ResortCuratedMoment) {
  return curatedIconRules.find((rule) => rule.terms.test(item.title))?.Icon
    ?? curatedIconRules.find((rule) => rule.terms.test(item.description ?? ""))?.Icon
    ?? Sparkles;
}

function CuratedAmenities({ items }: { items: ResortCuratedMoment[] }) {
  return (
    <ul className="property-detail-curated__list">
      {items.map((item, index) => {
        const Icon = iconForMoment(item);
        return (
          <li className="property-detail-curated__item" key={`${item.title}-${index}`}>
            {item.iconUrl ? (
              <span
                className="property-detail-curated__uploaded-icon"
                style={{ "--curated-icon-url": `url(${item.iconUrl})` } as CSSProperties}
                aria-hidden="true"
              />
            ) : (
              <Icon size={32} strokeWidth={1.6} aria-hidden="true" />
            )}
            <span>{item.title || item.description}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function PropertyDetailOverview({
  actionLabel,
  backHref,
  curatedMoments,
  facts,
  heroImageUrl,
  kicker,
  name,
  overviewCopy,
  overviewTitle,
  roomsHref = "#rooms",
  roomsLabel = "Discover the Stay"
}: PropertyDetailOverviewProps) {
  const heroBackground = heroImageUrl
    ? `url(${optimizedImageUrl(heroImageUrl, { width: 1900, height: 1120, quality: 86 })})`
    : "linear-gradient(135deg, #0b4a54 0%, #4fb7ba 48%, #f4f2ec 100%)";
  const visibleCuratedMoments = curatedMoments
    .map(displayCuratedMoment)
    .filter((item) => item.title || item.description);
  const initialCuratedMoments = visibleCuratedMoments.slice(0, initialCuratedItemLimit);
  const remainingCuratedMoments = visibleCuratedMoments.slice(initialCuratedItemLimit);
  const overviewParagraphs = splitOverviewCopy(overviewCopy);

  return (
    <>
      <section className="property-detail-hero resort-story-hero" style={{ backgroundImage: heroBackground }}>
        <div className="resort-story-hero__overlay" />
        <div className="mobile-detail-actions" aria-label={`${actionLabel} actions`}>
          <Link href={backHref} aria-label={`Back to ${actionLabel}`}>
            <ArrowLeft size={18} />
          </Link>
          <button type="button" aria-label={`Share ${actionLabel}`}>
            <Share2 size={18} />
          </button>
          <button type="button" aria-label={`Save ${actionLabel}`}>
            <Heart size={18} />
          </button>
        </div>
        <div className="site-container resort-story-hero__inner">
          <div className="resort-story-hero__copy">
            <p className="section-kicker">{kicker}</p>
            <h1>{name}</h1>
          </div>
        </div>
      </section>

      <section className="property-detail-intro" id="overview">
        <div className="property-detail-facts" aria-label={`${name} quick facts`}>
          <div className="site-container property-detail-facts__inner">
            {facts.map((fact) => (
              <div className={`property-detail-fact${fact.href ? " property-detail-fact--brochure" : ""}${["Location", "Route / Atoll", "Transfer"].includes(fact.label) ? ` property-detail-fact--${fact.label === "Transfer" ? "transfer" : "location"}` : ""}`} key={fact.label}>
                {fact.href ? (
                  <a className="property-detail-fact__download" href={fact.href} download={`${name} Factsheet.pdf`} aria-label={`Download ${name} factsheet`}>
                    <fact.Icon size={14} aria-hidden="true" />
                    Factsheet
                  </a>
                ) : <><span>{fact.label}</span><strong title={["Location", "Route / Atoll", "Transfer"].includes(fact.label) ? fact.value : undefined}>{fact.value}</strong></>}
              </div>
            ))}
          </div>
        </div>

        <div className="site-container">
          <article className="property-detail-overview">
            <p className="eyebrow">Overview</p>
            <h2>{overviewTitle}</h2>
            <div className="property-detail-overview__copy">
              {overviewParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="property-detail-overview__actions">
              <a href={roomsHref} className="property-detail-overview__button">
                {roomsLabel}
              </a>
              <PropertyInquiry name={name} />
            </div>
          </article>
        </div>
      </section>

      {visibleCuratedMoments.length ? (
        <section className="property-detail-curated" id="experiences" aria-labelledby="property-detail-curated-heading">
          <div className="site-container property-detail-curated__layout">
            <div className="property-detail-curated__heading">
              <h2 id="property-detail-curated-heading">What stands <br />out here</h2>
              <p>A curated look at {name}'s most-loved amenities.</p>
            </div>
            <div className="property-detail-curated__content">
              <CuratedAmenities items={initialCuratedMoments} />
              {remainingCuratedMoments.length ? (
                <details className="property-detail-curated__more">
                  <summary>view more</summary>
                  <CuratedAmenities items={remainingCuratedMoments} />
                </details>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export const propertyFactIcons = {
  BedDouble,
  Car,
  ConciergeBell,
  FileDown,
  MapPin,
  Plane,
  Sailboat,
  Sparkles
};
