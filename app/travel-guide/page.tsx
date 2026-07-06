import { Cormorant_Garamond } from "next/font/google";

import { TravelGuideDirectory } from "@/components/travel-guide-directory";
import { listPublishedResorts } from "@/lib/services/resort-service";
import { getCatalogueContent, getHomepageGuide } from "@/lib/site-content";

const readingSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-reading-serif"
});

export default async function TravelGuidePage({
  searchParams
}: {
  searchParams: Promise<{ article?: string | string[] }>;
}) {
  const [{ content: guide }, { content: catalogue }, resorts, params] = await Promise.all([
    getHomepageGuide("published"),
    getCatalogueContent("travel-guide"),
    listPublishedResorts(),
    searchParams
  ]);
  const publishedGuides = guide.filter((item) => item.published && item.title);
  const requestedSlug = typeof params.article === "string" ? params.article : undefined;
  const initialArticleSlug = publishedGuides.some((item) => item.slug === requestedSlug) ? requestedSlug : undefined;

  return (
    <main className={`${readingSerif.variable} reading-room`}>
      <TravelGuideDirectory
        guides={publishedGuides}
        catalogue={catalogue}
        resorts={resorts.slice(0, 4)}
        initialArticleSlug={initialArticleSlug}
      />
    </main>
  );
}
