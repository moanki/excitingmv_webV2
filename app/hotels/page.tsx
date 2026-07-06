import { CatalogueBanner } from "@/components/catalogue-banner";
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
      <CatalogueBanner activeKind="hotels" catalogue={catalogue} />
      <div className="desktop-screen">
        <DestinationIndex activeKind="hotels" items={hotels} />
      </div>
      <MobileDestinations activeKind="hotels" items={hotels} />
    </>
  );
}
