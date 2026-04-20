import { deleteResourceAction, saveResourceAction } from "@/app/admin/resources/actions";
import { listResources } from "@/lib/services/resource-service";

export default async function AdminResourcesPage() {
  const resources = await listResources();

  return (
    <section className="stack">
      <div>
        <p className="eyebrow">Resource Library</p>
        <h1 className="section-title">Manage public and protected documents for partners.</h1>
      </div>

      <article className="panel">
        <p className="eyebrow">Create Resource</p>
        <form action={saveResourceAction} className="stack">
          <div className="form-grid">
            <label className="field">
              Title
              <input name="title" />
            </label>
            <label className="field">
              Type
              <input name="resourceType" placeholder="Presentation, Rate Sheet, Brochure" />
            </label>
            <label className="field">
              File URL / Path
              <input name="filePath" />
            </label>
            <label className="field">
              Audience
              <select name="audienceType" defaultValue="all_partners">
                <option value="all_partners">All Partners</option>
                <option value="selected_partners">Selected Partners</option>
              </select>
            </label>
            <label className="field">
              Status
              <select name="status" defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="field">
              Sort Order
              <input name="sortOrder" defaultValue="0" />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Description
              <textarea name="description" />
            </label>
          </div>
          <button className="button" type="submit">
            Save Resource
          </button>
        </form>
      </article>

      <div className="stack">
        {resources.map((resource) => (
          <article className="panel" key={resource.id}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{resource.resourceType}</p>
                <h2>{resource.title}</h2>
                <p className="muted">{resource.description}</p>
              </div>
              <span className="badge">{resource.status}</span>
            </div>
            <form action={saveResourceAction} className="stack">
              <input type="hidden" name="id" value={resource.id} />
              <div className="form-grid">
                <label className="field">
                  Title
                  <input name="title" defaultValue={resource.title} />
                </label>
                <label className="field">
                  Type
                  <input name="resourceType" defaultValue={resource.resourceType} />
                </label>
                <label className="field">
                  File URL / Path
                  <input name="filePath" defaultValue={resource.filePath} />
                </label>
                <label className="field">
                  Audience
                  <select name="audienceType" defaultValue={resource.audienceType}>
                    <option value="all_partners">All Partners</option>
                    <option value="selected_partners">Selected Partners</option>
                  </select>
                </label>
                <label className="field">
                  Status
                  <select name="status" defaultValue={resource.status}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="field">
                  Sort Order
                  <input name="sortOrder" defaultValue={String(resource.sortOrder)} />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Description
                  <textarea name="description" defaultValue={resource.description} />
                </label>
              </div>
              <div className="card-actions">
                <button className="button" type="submit">
                  Update Resource
                </button>
              </div>
            </form>
            <form action={deleteResourceAction}>
              <input type="hidden" name="id" value={resource.id} />
              <button className="button-muted" type="submit">
                Delete Resource
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
