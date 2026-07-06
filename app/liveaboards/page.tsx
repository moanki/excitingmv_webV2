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
      <div className="desktop-screen">
        <DestinationIndex activeKind="liveaboards" catalogue={catalogue} items={liveaboards} />
      </div>
      <MobileDestinations activeKind="liveaboards" catalogue={catalogue} items={liveaboards} />
    </>
  );
}
