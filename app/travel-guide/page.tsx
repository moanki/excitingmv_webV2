import { TravelGuideDirectory } from "@/components/travel-guide-directory";
import { getHomepageGuide } from "@/lib/site-content";

export default async function TravelGuidePage() {
  const { content: guide } = await getHomepageGuide("published");
  const publishedGuides = guide.filter((item) => item.published && item.title);

  return (
    <main className="guide-directory">
      <section className="guide-directory__hero">
        <div className="lux-container">
          <p className="lux-eyebrow">Maldives Travel Guide</p>
          <h1>Practical Maldives information for tourists and travel partners.</h1>
          <p>
            Search destination guidance on arrivals, transfers, money, packing, culture, resort fit, and planning
            details that shape better Maldives itineraries.
          </p>
        </div>
      </section>
      <section className="guide-directory__body">
        <div className="lux-container">
          <TravelGuideDirectory guides={publishedGuides} />
        </div>
      </section>
    </main>
  );
}
