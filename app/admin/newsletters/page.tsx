const submissions = [
  { email: "sales@auroratravel.com", source: "homepage", status: "new" },
  { email: "contracts@islandpartners.ae", source: "partner-form", status: "reviewed" }
];

export default function AdminNewslettersPage() {
  return (
    <section>
      <p className="eyebrow">Newsletter and Lead Capture</p>
      <h1 className="section-title">Export, review, and route incoming registrations.</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Source</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.email}>
              <td>{submission.email}</td>
              <td>{submission.source}</td>
              <td>{submission.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
