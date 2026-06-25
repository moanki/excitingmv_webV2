import { DestinationIndex } from "@/components/destination-index";
import { MobileDestinations } from "@/components/mobile-destinations";
import { listPublishedProperties } from "@/lib/services/resort-service";

export default async function HotelsPage() {
  const hotels = await listPublishedProperties("hotels");

  return (
    <>
      <div className="desktop-screen">
        <DestinationIndex activeKind="hotels" items={hotels} />
      </div>
      <MobileDestinations activeKind="hotels" items={hotels} />
    </>
  );
}
