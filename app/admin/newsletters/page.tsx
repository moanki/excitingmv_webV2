import { listNewsletterSubmissions } from "@/lib/services/newsletter-service";

export default async function AdminNewslettersPage() {
  const submissions = await listNewsletterSubmissions();

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Newsletter and Lead Capture</p>
          <h1 className="section-title">Review submissions and download the current lead list.</h1>
        </div>
        <a className="button-muted" href="/api/admin/newsletters/export">
          Download CSV
        </a>
      </div>
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
              <td>{submission.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
