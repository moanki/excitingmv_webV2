import { CatalogueBanner } from "@/components/catalogue-banner";
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
      <CatalogueBanner activeKind="resort" catalogue={catalogue} />
      <div className="desktop-screen">
        <DestinationIndex activeKind="resort" items={resorts} />
      </div>
      <MobileDestinations activeKind="resort" items={resorts} />
    </>
  );
}
