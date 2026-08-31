import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Accessibility,
  ArrowLeft,
  Baby,
  BedDouble,
  BottleWine,
  Car,
  ChefHat,
  Clock,
  Coffee,
  ConciergeBell,
  Dumbbell,
  Flower2,
  Heart,
  HeartPulse,
  MapPin,
  Plane,
  Sailboat,
  Share2,
  ShieldCheck,
  ShipWheel,
  Sparkles,
  TreePalm,
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

type CuratedCategory = {
  label: string;
  terms: string[];
  Icon: LucideIcon;
};

const curatedIconRules: CuratedCategory[] = [
  { label: "Connectivity", terms: ["wifi", "internet"], Icon: Wifi },
  { label: "Spa", terms: ["spa", "massage", "sauna", "steam", "therapy"], Icon: Flower2 },
  { label: "Wellness", terms: ["wellness", "yoga", "meditation", "relaxation"], Icon: HeartPulse },
  { label: "Fitness", terms: ["fitness", "gym", "training"], Icon: Dumbbell },
  { label: "Pools & Lagoon", terms: ["pool", "beach", "lagoon", "private beach", "sundeck"], Icon: Waves },
  { label: "Diving & Marine", terms: ["snorkel", "dive", "diving", "reef", "marine", "house reef"], Icon: Waves },
  { label: "Access", terms: ["wheelchair", "accessible", "disabled", "grab rails"], Icon: Accessibility },
  { label: "Family", terms: ["kid", "family", "child", "children", "club", "babysitting"], Icon: Baby },
  { label: "Restaurants", terms: ["restaurant", "dining", "breakfast", "meal", "food"], Icon: Utensils },
  { label: "Culinary", terms: ["chef", "culinary", "kitchen"], Icon: ChefHat },
  { label: "Bars", terms: ["bar", "wine", "cocktail", "champagne"], Icon: BottleWine },
  { label: "Cafes", terms: ["coffee", "cafe"], Icon: Coffee },
  { label: "Transfers", terms: ["seaplane", "plane", "transfer", "airport", "car", "taxi"], Icon: Plane },
  { label: "Boating", terms: ["boat", "yacht", "liveaboard", "charter", "sail", "cruise"], Icon: Sailboat },
  { label: "Guest Services", terms: ["front desk", "concierge", "butler", "jadugar", "service", "room service"], Icon: ConciergeBell },
  { label: "Island Life", terms: ["garden", "island", "palm", "terrace", "outdoor", "cycling", "bike"], Icon: TreePalm },
  { label: "Experiences", terms: ["anchor", "excursion", "activity", "experience", "adventure"], Icon: ShipWheel },
  { label: "Essentials", terms: ["24-hour", "24 hour", "open", "clock"], Icon: Clock }
];
const fallbackCuratedCategory: CuratedCategory = { label: "Signature Details", terms: [], Icon: ShieldCheck };
const initialCuratedGroupLimit = 5;
const initialCuratedItemsPerGroup = 4;
const curatedCategoryOrder = new Map(curatedIconRules.map((category, index) => [category.label, index]));

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
  return categoryForMoment(item).Icon;
}

function categoryForMoment(item: ResortCuratedMoment) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return curatedIconRules.find((rule) => rule.terms.some((term) => text.includes(term))) ?? fallbackCuratedCategory;
}

function groupCuratedMoments(items: ResortCuratedMoment[]) {
  const grouped = new Map<string, { label: string; Icon: LucideIcon; items: ResortCuratedMoment[] }>();

  for (const item of items) {
    const category = categoryForMoment(item);
    const group = grouped.get(category.label) ?? { label: category.label, Icon: category.Icon, items: [] };
    group.items.push(item);
    grouped.set(category.label, group);
  }

  return [...grouped.values()].sort(
    (a, b) =>
      (curatedCategoryOrder.get(a.label) ?? curatedIconRules.length) -
      (curatedCategoryOrder.get(b.label) ?? curatedIconRules.length)
  );
}

function splitCuratedGroups(groups: ReturnType<typeof groupCuratedMoments>) {
  const initialGroups = groups.slice(0, initialCuratedGroupLimit).map((group) => ({
    ...group,
    items: group.items.slice(0, initialCuratedItemsPerGroup)
  }));
  const remainingGroups = [
    ...groups.slice(0, initialCuratedGroupLimit)
      .map((group) => ({ ...group, items: group.items.slice(initialCuratedItemsPerGroup) }))
      .filter((group) => group.items.length),
    ...groups.slice(initialCuratedGroupLimit)
  ];

  return { initialGroups, remainingGroups };
}

function CuratedGroups({ groups }: { groups: ReturnType<typeof groupCuratedMoments> }) {
  return (
    <div className="property-detail-curated__groups">
      {groups.map((group) => {
        return (
          <article className="property-detail-curated__group" key={group.label}>
            <div className="property-detail-curated__group-heading">
              <h3>{group.label}</h3>
            </div>
            <div className="property-detail-curated__chips">
              {group.items.map((item, index) => {
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
          </article>
        );
      })}
    </div>
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
    .filter((item) => item.title || item.description || item.iconUrl);
  const curatedGroups = groupCuratedMoments(visibleCuratedMoments);
  const { initialGroups: initialCuratedGroups, remainingGroups: remainingCuratedGroups } = splitCuratedGroups(curatedGroups);
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
              <div className="property-detail-fact" key={fact.label}>
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
            <div className="property-detail-overview__copy">
              {overviewParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
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
            <CuratedGroups groups={initialCuratedGroups} />
            {remainingCuratedGroups.length ? (
              <details className="property-detail-curated__more">
                <summary>view more</summary>
                <CuratedGroups groups={remainingCuratedGroups} />
              </details>
            ) : null}
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
  MapPin,
  Plane,
  Sailboat,
  Sparkles
};
