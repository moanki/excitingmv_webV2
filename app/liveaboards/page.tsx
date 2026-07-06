import { CatalogueBanner } from "@/components/catalogue-banner";
import { DestinationIndex } from "@/components/destination-index";
import { MobileDestinations } from "@/components/mobile-destinations";
import { listPublishedProperties } from "@/lib/services/resort-service";
import { getCatalogueContent } from "@/lib/site-content";

export default async function LiveaboardsPage() {
  const [liveaboards, { content: catalogue }] = await Promise.all([
    listPublishedProperties("liveaboards"),
    getCatalogueContent("liveaboards")
  ]);

  return (
    <>
      <CatalogueBanner activeKind="liveaboards" catalogue={catalogue} />
      <div className="desktop-screen">
        <DestinationIndex activeKind="liveaboards" items={liveaboards} />
      </div>
      <MobileDestinations activeKind="liveaboards" items={liveaboards} />
    </>
  );
}
