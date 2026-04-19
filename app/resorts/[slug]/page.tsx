import { notFound } from "next/navigation";

import { sampleResorts } from "@/lib/sample-data";

export function generateStaticParams() {
  return sampleResorts.map((resort) => ({ slug: resort.slug }));
}

export default async function ResortDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resort = sampleResorts.find((item) => item.slug === slug);

  if (!resort) {
    notFound();
  }

  return (
    <main className="shell section">
      <div className="panel">
        <p className="eyebrow">{resort.location}</p>
        <h1 className="section-title">{resort.name}</h1>
        <p className="lede">{resort.summary}</p>
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
    </main>
  );
}
