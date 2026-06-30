import { DestinationIndex } from "@/components/destination-index";
import { MobileDestinations } from "@/components/mobile-destinations";
import { listPublishedProperties } from "@/lib/services/resort-service";
import { getCatalogueContent } from "@/lib/site-content";

export default async function HotelsPage() {
  const [hotels, { content: catalogue }] = await Promise.all([
    listPublishedProperties("hotels"),
    getCatalogueContent("hotels")
  ]);

  return (
    <>
      <div className="desktop-screen">
        <DestinationIndex activeKind="hotels" catalogue={catalogue} items={hotels} />
      </div>
      <MobileDestinations activeKind="hotels" bannerImageUrl={catalogue.heroImageUrl} items={hotels} />
    </>
  );
}
