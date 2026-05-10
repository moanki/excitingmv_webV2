import { DestinationIndex } from "@/components/destination-index";
import { listPublishedProperties } from "@/lib/services/resort-service";

export default async function HotelsPage() {
  const hotels = await listPublishedProperties("hotel");

  return <DestinationIndex activeKind="hotel" items={hotels} />;
}
