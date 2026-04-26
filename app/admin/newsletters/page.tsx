import { NewsletterLeadsTable } from "@/components/admin/newsletter-leads-table";
import { listNewsletterSubmissions } from "@/lib/services/newsletter-service";

export default async function AdminNewslettersPage() {
  const submissions = await listNewsletterSubmissions();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <h1 className="section-title">Newsletter Leads</h1>
        </div>
      </div>

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
