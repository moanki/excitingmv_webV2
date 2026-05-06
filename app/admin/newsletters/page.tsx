import { NewsletterLeadsTable } from "@/components/admin/newsletter-leads-table";
import { listNewsletterSubmissions } from "@/lib/services/newsletter-service";

export default async function AdminNewslettersPage() {
  const submissions = await listNewsletterSubmissions();

  return (
    <section className="stack">
      {submissions.length ? (
        <NewsletterLeadsTable submissions={submissions} />
      ) : (
        <div className="empty-state">
          <strong>No newsletter leads yet.</strong>
        </div>
      )}
    </section>
  );
}
