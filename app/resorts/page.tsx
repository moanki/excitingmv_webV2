import { DestinationIndex } from "@/components/destination-index";
import { listPublishedResorts } from "@/lib/services/resort-service";

export default async function ResortsPage() {
  const resorts = await listPublishedResorts();

  return <DestinationIndex activeKind="resort" items={resorts} />;
}
