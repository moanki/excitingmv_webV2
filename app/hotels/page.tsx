import { DestinationIndex } from "@/components/destination-index";
import { listPublishedProperties } from "@/lib/services/resort-service";

export default async function HotelsPage() {
  const hotels = await listPublishedProperties("hotels");

  return <DestinationIndex activeKind="hotels" items={hotels} />;
}
