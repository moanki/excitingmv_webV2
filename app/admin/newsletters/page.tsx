import { listNewsletterSubmissions } from "@/lib/services/newsletter-service";

export default async function AdminNewslettersPage() {
  const submissions = await listNewsletterSubmissions();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">Newsletter and Lead Capture</p>
          <h1 className="section-title">Review submissions and download the current lead list.</h1>
          <p className="admin-page-lede">
            Monitor incoming leads, validate market interest, and export the queue for outreach.
          </p>
        </div>
        <a className="admin-btn admin-btn--secondary" href="/api/admin/newsletters/export">
          Download CSV
        </a>
      </div>

      {submissions.length ? (
        <div className="admin-table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Agency</th>
                <th>Email</th>
                <th>Country</th>
                <th>Contact</th>
                <th>Market</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.fullName}</td>
                  <td>{submission.agencyName}</td>
                  <td>{submission.email}</td>
                  <td>{submission.countryOfOrigin}</td>
                  <td>{submission.contactNumber}</td>
                  <td>{submission.primaryMarket}</td>
                  <td>
                    <span className="badge">{submission.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <strong>No submissions yet</strong>
          <p>New newsletter and lead-capture entries will appear here once the public forms receive traffic.</p>
        </div>
      )}
    </section>
  );
}
