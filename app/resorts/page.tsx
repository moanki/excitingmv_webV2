import { DestinationIndex } from "@/components/destination-index";
import { MobileDestinations } from "@/components/mobile-destinations";
import { listPublishedResorts } from "@/lib/services/resort-service";
import { getCatalogueContent } from "@/lib/site-content";

export default async function ResortsPage() {
  const [resorts, { content: catalogue }] = await Promise.all([
    listPublishedResorts(),
    getCatalogueContent("resorts")
  ]);

  return (
    <>
      <div className="desktop-screen">
        <DestinationIndex activeKind="resort" catalogue={catalogue} items={resorts} />
      </div>
      <MobileDestinations activeKind="resort" bannerImageUrl={catalogue.heroImageUrl} items={resorts} />
    </>
  );
}
