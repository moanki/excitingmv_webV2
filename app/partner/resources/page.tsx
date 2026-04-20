import { listPublishedResources } from "@/lib/services/resource-service";

export default async function PartnerResourcesPage() {
  const resources = await listPublishedResources();

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
            <th>Document</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => (
            <tr key={resource.id}>
              <td>{resource.title}</td>
              <td>{resource.resourceType}</td>
              <td>{resource.audienceType}</td>
              <td>
                <span className="badge">{resource.status}</span>
              </td>
              <td>
                <a href={resource.filePath} target="_blank" rel="noreferrer">
                  Open
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
