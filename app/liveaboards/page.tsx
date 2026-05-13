import { DestinationIndex } from "@/components/destination-index";
import { listPublishedProperties } from "@/lib/services/resort-service";

export default async function LiveaboardsPage() {
  const liveaboards = await listPublishedProperties("liveaboards");

  return <DestinationIndex activeKind="liveaboards" items={liveaboards} />;
}
