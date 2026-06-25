import { DestinationIndex } from "@/components/destination-index";
import { MobileDestinations } from "@/components/mobile-destinations";
import { listPublishedProperties } from "@/lib/services/resort-service";

export default async function LiveaboardsPage() {
  const liveaboards = await listPublishedProperties("liveaboards");

  return (
    <>
      <div className="desktop-screen">
        <DestinationIndex activeKind="liveaboards" items={liveaboards} />
      </div>
      <MobileDestinations activeKind="liveaboards" items={liveaboards} />
    </>
  );
}
