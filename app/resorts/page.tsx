import { DestinationIndex } from "@/components/destination-index";
import { MobileDestinations } from "@/components/mobile-destinations";
import { listPublishedResorts } from "@/lib/services/resort-service";

export default async function ResortsPage() {
  const resorts = await listPublishedResorts();

  return (
    <>
      <div className="desktop-screen">
        <DestinationIndex activeKind="resort" items={resorts} />
      </div>
      <MobileDestinations resorts={resorts} />
    </>
  );
}
