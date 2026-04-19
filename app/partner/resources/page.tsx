import { samplePartnerResources } from "@/lib/sample-data";

export default function PartnerResourcesPage() {
  return (
    <section>
      <p className="eyebrow">Protected Resources</p>
      <h1 className="section-title">Rates, offers, kits, and collateral.</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Audience</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {samplePartnerResources.map((resource) => (
            <tr key={resource.title}>
              <td>{resource.title}</td>
              <td>{resource.kind}</td>
              <td>{resource.audience}</td>
              <td>
                <span className="badge">{resource.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
