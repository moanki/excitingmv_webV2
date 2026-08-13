import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Accessibility,
  Anchor,
  ArrowLeft,
  Baby,
  BedDouble,
  Dumbbell,
  Heart,
  MapPin,
  Palmtree,
  Plane,
  Sailboat,
  Share2,
  ShieldCheck,
  Sparkles,
  Utensils,
  Waves,
  Wifi
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { ResortCuratedMoment } from "@/lib/types";

type DetailFact = {
  label: string;
  value: string;
  Icon: LucideIcon;
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

const curatedIconRules: Array<{ terms: string[]; Icon: LucideIcon }> = [
  { terms: ["wifi", "internet"], Icon: Wifi },
  { terms: ["spa", "wellness", "massage", "sauna", "steam", "yoga"], Icon: Sparkles },
  { terms: ["fitness", "gym"], Icon: Dumbbell },
  { terms: ["pool", "beach", "snorkel", "dive", "diving", "reef", "water", "lagoon"], Icon: Waves },
  { terms: ["wheelchair", "accessible", "disabled", "grab rails"], Icon: Accessibility },
  { terms: ["kid", "family", "child", "children", "club"], Icon: Baby },
  { terms: ["restaurant", "dining", "bar", "breakfast", "meal", "food", "chef"], Icon: Utensils },
  { terms: ["seaplane", "plane", "transfer", "airport"], Icon: Plane },
  { terms: ["boat", "yacht", "liveaboard", "charter", "sail"], Icon: Sailboat },
  { terms: ["front desk", "concierge", "butler", "jadugar", "service"], Icon: ShieldCheck },
  { terms: ["garden", "island", "palm", "terrace"], Icon: Palmtree },
  { terms: ["anchor", "marine", "cruise"], Icon: Anchor }
];

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

function iconForMoment(item: ResortCuratedMoment) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return curatedIconRules.find((rule) => rule.terms.some((term) => text.includes(term)))?.Icon ?? Sparkles;
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
    .filter((item) => item.title || item.description || item.iconUrl);

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
              <div className="property-detail-fact" key={fact.label}>
                <fact.Icon size={16} aria-hidden="true" />
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="site-container">
          <article className="property-detail-overview">
            <p className="eyebrow">Overview</p>
            <h2>{overviewTitle}</h2>
            <p>{overviewCopy}</p>
            <a href={roomsHref} className="property-detail-overview__button">
              {roomsLabel}
            </a>
          </article>
        </div>
      </section>

      {visibleCuratedMoments.length ? (
        <section className="property-detail-curated" id="experiences" aria-labelledby="property-detail-curated-heading">
          <div className="site-container">
            <div className="property-detail-curated__heading">
              <h2 id="property-detail-curated-heading">What stands out here</h2>
              <p>A curated look at {name}'s most-loved amenities.</p>
            </div>
            <div className="property-detail-curated__chips">
              {visibleCuratedMoments.map((item, index) => {
                const Icon = iconForMoment(item);
                return (
                  <span className="property-detail-curated__chip" key={`${item.title}-${index}`}>
                    {item.iconUrl ? (
                      <span
                        className="property-detail-curated__uploaded-icon"
                        style={{ "--curated-icon-url": `url(${item.iconUrl})` } as CSSProperties}
                        aria-hidden="true"
                      />
                    ) : (
                      <Icon size={15} aria-hidden="true" />
                    )}
                    {item.title}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export const propertyFactIcons = {
  BedDouble,
  MapPin,
  Plane,
  Sailboat,
  Sparkles
};
