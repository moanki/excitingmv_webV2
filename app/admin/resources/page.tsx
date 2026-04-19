import { samplePartnerResources } from "@/lib/sample-data";

export default function AdminResourcesPage() {
  return (
    <section>
      <p className="eyebrow">Resource Library</p>
      <h1 className="section-title">Manage protected files for approved partners.</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Kind</th>
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
              <td>{resource.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
