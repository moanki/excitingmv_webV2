import { notFound } from "next/navigation";

import { getResortBySlug, listPublishedResorts } from "@/lib/services/resort-service";

export async function generateStaticParams() {
  const resorts = await listPublishedResorts();
  return resorts.map((resort) => ({ slug: resort.slug }));
}

export default async function ResortDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resort = await getResortBySlug(slug);

  if (!resort) {
    notFound();
  }

  return (
    <main className="shell section stack">
      <div className="panel">
        <p className="eyebrow">{resort.location}</p>
        <h1 className="section-title">{resort.name}</h1>
        <p className="lede">{resort.description || resort.summary}</p>
        <div className="grid" style={{ marginTop: "1rem" }}>
          <div className="stat-card">
            <p className="eyebrow">Transfer</p>
            <strong>{resort.transferType}</strong>
          </div>
          <div className="stat-card">
            <p className="eyebrow">Category</p>
            <strong>{resort.category}</strong>
          </div>
          <div className="stat-card">
            <p className="eyebrow">Status</p>
            <strong>{resort.status}</strong>
          </div>
        </div>
      </div>

      <div className="split">
        <article className="panel">
          <p className="eyebrow">Highlights</p>
          <ul className="list">
            {resort.highlights.length ? (
              resort.highlights.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No highlights added yet.</li>
            )}
          </ul>
        </article>
        <article className="panel">
          <p className="eyebrow">Meal Plans</p>
          <ul className="list">
            {resort.mealPlans.length ? (
              resort.mealPlans.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No meal plans added yet.</li>
            )}
          </ul>
        </article>
      </div>
    </main>
  );
}
