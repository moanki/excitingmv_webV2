import Link from "next/link";

import { listPublishedResorts } from "@/lib/services/resort-service";

const experienceThemes = [
  {
    title: "Private island escapes",
    description: "For couples and VIP travelers who want privacy, pace, and high-touch service."
  },
  {
    title: "Family luxury",
    description: "Resorts with spacious villa inventory, practical transfers, and strong family programming."
  },
  {
    title: "Diving and marine life",
    description: "Experiences built around reef access, marine encounters, and destination-led adventure."
  },
  {
    title: "Wellness and slow travel",
    description: "Properties suited to restorative itineraries, spa-led stays, and longer luxury escapes."
  }
];

export default async function ExperiencesPage() {
  const resorts = await listPublishedResorts();

  return (
    <main className="shell section">
      <section className="panel stack">
        <div className="stack">
          <p className="eyebrow">Experiences</p>
          <h1 className="section-title">Use-case led experiences for matching the right resort to the right client.</h1>
          <p className="muted">
            This page gives your public navigation a valid destination while highlighting how the resort
            portfolio can be positioned by traveler intent rather than only by property name.
          </p>
        </div>

        <div className="grid">
          {experienceThemes.map((theme) => (
            <article key={theme.title} className="card">
              <span className="badge">Theme</span>
              <h2>{theme.title}</h2>
              <p className="muted">{theme.description}</p>
            </article>
          ))}
        </div>

        <div className="stack">
          <h2>Featured resorts for these journeys</h2>
          <div className="grid">
            {resorts.slice(0, 6).map((resort) => (
              <article key={resort.slug} className="card">
                <span className="badge">{resort.category}</span>
                <h3>{resort.name}</h3>
                <p className="muted">{resort.location}</p>
                <p className="muted">{resort.summary}</p>
                <div className="card-actions">
                  <Link href={`/resorts/${resort.slug}`} className="button">
                    View Resort
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
