import { samplePartners } from "@/lib/sample-data";

export default function AdminPartnersPage() {
  return (
    <section>
      <p className="eyebrow">Partner Approvals</p>
      <h1 className="section-title">Review registrations and access status.</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Agency</th>
            <th>Market</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {samplePartners.map((partner) => (
            <tr key={partner.email}>
              <td>{partner.name}</td>
              <td>{partner.market}</td>
              <td>
                <span className="badge">{partner.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
