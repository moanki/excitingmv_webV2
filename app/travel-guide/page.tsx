import { Cormorant_Garamond } from "next/font/google";

import { TravelGuideDirectory } from "@/components/travel-guide-directory";
import { listPublishedResorts } from "@/lib/services/resort-service";
import { getHomepageGuide } from "@/lib/site-content";

const readingSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-reading-serif"
});

export default async function TravelGuidePage() {
  const [{ content: guide }, resorts] = await Promise.all([
    getHomepageGuide("published"),
    listPublishedResorts()
  ]);
  const publishedGuides = guide.filter((item) => item.published && item.title);

  return (
    <main className={`${readingSerif.variable} reading-room`}>
      <TravelGuideDirectory guides={publishedGuides} resorts={resorts.slice(0, 4)} />
    </main>
  );
}
