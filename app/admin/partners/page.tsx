import { PartnerQueueTable } from "@/components/admin/partner-queue-table";
import { listPartnerRequests } from "@/lib/services/partner-service";

export default async function AdminPartnersPage() {
  const partners = await listPartnerRequests();

  return (
    <section className="stack">
      {partners.length ? (
        <PartnerQueueTable partners={partners} />
      ) : (
        <div className="empty-state">
          <strong>No partners pending review.</strong>
        </div>
      )}
    </section>
  );
}
