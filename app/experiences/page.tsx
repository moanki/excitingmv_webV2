import Link from "next/link";
import {
  ChevronDown,
  Clock3,
  Gift,
  Heart,
  Leaf,
  Martini,
  Palmtree,
  Search,
  ShipWheel,
  Snail,
  Sparkles,
  Waves
} from "lucide-react";

import { optimizedImageUrl } from "@/lib/image-urls";
import { listPublishedResorts } from "@/lib/services/resort-service";

const heroImage = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=94";

const categories = [
  { label: "All Experiences", Icon: Palmtree },
  { label: "Water Activities", Icon: Waves },
  { label: "Marine & Nature", Icon: Snail },
  { label: "Culture & Local", Icon: ShipWheel },
  { label: "Wellness & Relaxation", Icon: Leaf },
  { label: "Dining Experiences", Icon: Martini },
  { label: "Special Moments", Icon: Gift }
];

const experiences = [
  {
    title: "Swim with Turtles",
    description: "Snorkel in crystal-clear lagoons and swim alongside gentle sea turtles.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=92",
    duration: "2 - 3 Hours",
    price: "$85",
    Icon: Snail
  },
  {
    title: "Dolphin Sunset Cruise",
    description: "Cruise the Maldivian waters as dolphins play through the golden sunset.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=92",
    duration: "2 Hours",
    price: "$110",
    Icon: Waves
  },
  {
    title: "Sandbank Picnic",
    description: "Escape to a private sandbank and enjoy an elegant ocean-side picnic.",
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=92",
    duration: "3 - 4 Hours",
    price: "$150",
    Icon: Palmtree
  },
  {
    title: "Manta Ray Snorkeling",
    description: "Snorkel with majestic manta rays in their natural Maldives habitat.",
    image: "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&w=900&q=92",
    duration: "2 - 3 Hours",
    price: "$120",
    Icon: Waves
  },
  {
    title: "Private Beach Dinner",
    description: "A romantic dinner under the stars on your own private beach setting.",
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=92",
    duration: "3 Hours",
    price: "$220",
    Icon: Martini
  },
  {
    title: "Overwater Spa",
    description: "Rejuvenate body and mind with a refined overwater spa ritual.",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=92",
    duration: "90 Minutes",
    price: "$180",
    Icon: Leaf
  },
  {
    title: "Local Island Visit",
    description: "Discover local life, culture, and traditions on nearby islands.",
    image: "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&w=900&q=92",
    duration: "3 - 4 Hours",
    price: "$95",
    Icon: ShipWheel
  },
  {
    title: "House Reef Snorkeling",
    description: "Explore vibrant coral reefs and tropical marine life close to shore.",
    image: "https://images.unsplash.com/photo-1544551763-92ab472cad5d?auto=format&fit=crop&w=900&q=92",
    duration: "1 - 2 Hours",
    price: "$70",
    Icon: Sparkles
  }
];

function formatAtoll(location?: string | null) {
  if (!location) return "Maldives";
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.find((part) => /atoll/i.test(part)) || parts[0] || "Maldives";
}

export default async function ExperiencesPage() {
  const resorts = await listPublishedResorts();
  const featuredResorts = resorts.slice(0, 5);

  return (
    <main className="experiences-page">
      <section className="experiences-hero">
        <div
          className="experiences-hero__image"
          style={{ backgroundImage: `url(${optimizedImageUrl(heroImage, { width: 2200, height: 1100, quality: 94 })})` }}
          aria-hidden="true"
        />
        <div className="site-container experiences-hero__content">
          <div className="experiences-hero__copy">
            <p className="lux-eyebrow">Experiences</p>
            <h1>Discover More Than Paradise</h1>
            <p>
              From thrilling adventures to serene moments, explore unforgettable experiences crafted to make every
              Maldives journey extraordinary.
            </p>
            <div className="experiences-hero__actions">
              <a href="#curated-experiences" className="destination-primary-action">
                Explore Experiences <span aria-hidden="true">›</span>
              </a>
              <Link href="/contact" className="experiences-secondary-action">
                Plan Your Journey
              </Link>
            </div>
          </div>

          <div className="experience-category-strip" aria-label="Experience categories">
            {categories.map(({ label, Icon }, index) => (
              <button type="button" className={index === 0 ? "is-active" : ""} key={label}>
                <Icon size={30} strokeWidth={1.45} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="experiences-catalog" id="curated-experiences">
        <div className="site-container">
          <div className="experiences-catalog__header">
            <h2>Curated Experiences For You</h2>
            <div className="experiences-catalog__tools">
              <label className="experiences-search">
                <input aria-label="Search experiences" placeholder="Search experiences..." />
                <Search size={16} />
              </label>
              <button type="button" className="experiences-sort">
                Sort by: <strong>Popular</strong>
                <ChevronDown size={15} />
              </button>
            </div>
          </div>

          <div className="experience-card-grid">
            {experiences.map((experience) => {
              const Icon = experience.Icon;
              return (
                <article className="experience-card" key={experience.title}>
                  <div
                    className="experience-card__image"
                    style={{ backgroundImage: `url(${optimizedImageUrl(experience.image, { width: 680, height: 430, quality: 91 })})` }}
                  >
                    <Heart size={20} aria-hidden="true" />
                  </div>
                  <div className="experience-card__body">
                    <span className="experience-card__icon"><Icon size={20} /></span>
                    <h3>{experience.title}</h3>
                    <p>{experience.description}</p>
                    <div className="experience-card__meta">
                      <span><Clock3 size={14} />{experience.duration}</span>
                      <strong>From {experience.price}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="experience-load-more">
            <button type="button">
              Load More Experiences
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="experience-retreats">
        <div className="site-container">
          <div className="experience-retreats__header">
            <h2>Featured Retreats<br />for These Journeys</h2>
            <Link href="/resorts">View All Resorts <span aria-hidden="true">→</span></Link>
          </div>
          {featuredResorts.length ? (
            <div className="experience-retreat-row">
              {featuredResorts.map((resort) => (
                <Link href={`/resorts/${resort.slug}`} className="experience-retreat-card" key={resort.slug}>
                  <div
                    style={
                      resort.heroImageUrl
                        ? { backgroundImage: `url(${optimizedImageUrl(resort.heroImageUrl, { width: 520, height: 420, quality: 91 })})` }
                        : undefined
                    }
                  >
                    <span>{resort.category || "Luxury"}</span>
                    <div>
                      <h3>{resort.name}</h3>
                      <p>{formatAtoll(resort.location)}</p>
                      <strong>View Resort →</strong>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <article className="resort-story-empty-card">
              <h2>No featured retreats are available yet.</h2>
              <p>Publish resorts from the admin portal and they will appear here.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
