import { deleteResourceAction, saveResourceAction } from "@/app/admin/resources/actions";
import { listResources } from "@/lib/services/resource-service";

export default async function AdminResourcesPage() {
  const resources = await listResources();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">Resource Library</p>
          <h1 className="section-title">Manage public and protected documents for partners.</h1>
          <p className="admin-page-lede">
            Create resources, control audience type, update file paths, and manage publish state.
          </p>
        </div>
      </div>

      <article className="panel admin-form-card">
        <div className="admin-form-section__header">
          <h3 className="admin-form-section__title">Create Resource</h3>
          <p className="admin-form-section__help">Add a new document or partner asset to the resource library.</p>
        </div>
        <form action={saveResourceAction} className="stack">
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Title</span>
              <input className="admin-input" name="title" />
            </label>
            <label className="field">
              <span className="field__label">Type</span>
              <input className="admin-input" name="resourceType" placeholder="Presentation, Rate Sheet, Brochure" />
            </label>
            <label className="field">
              <span className="field__label">File URL / Path</span>
              <input className="admin-input" name="filePath" />
            </label>
            <label className="field">
              <span className="field__label">Audience</span>
              <select className="admin-select" name="audienceType" defaultValue="all_partners">
                <option value="all_partners">All Partners</option>
                <option value="selected_partners">Selected Partners</option>
              </select>
            </label>
            <label className="field">
              <span className="field__label">Status</span>
              <select className="admin-select" name="status" defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="field">
              <span className="field__label">Sort Order</span>
              <input className="admin-input" name="sortOrder" defaultValue="0" />
            </label>
            <label className="field field--full">
              <span className="field__label">Description</span>
              <textarea className="admin-textarea" name="description" />
            </label>
          </div>
          <div className="admin-form-actions">
            <button className="admin-btn admin-btn--primary" type="submit">
              Save Resource
            </button>
          </div>
        </form>
      </article>

      <div className="stack">
        {resources.map((resource) => (
          <article className="panel admin-record-card" key={resource.id}>
            <div className="admin-record-card__header">
              <div className="admin-page-header__content">
                <p className="eyebrow">{resource.resourceType}</p>
                <h2>{resource.title}</h2>
                <p className="muted">{resource.description}</p>
              </div>
              <span className="badge">{resource.status}</span>
            </div>

            <form action={saveResourceAction} className="stack admin-form-card">
              <input type="hidden" name="id" value={resource.id} />
              <div className="form-grid">
                <label className="field">
                  <span className="field__label">Title</span>
                  <input className="admin-input" name="title" defaultValue={resource.title} />
                </label>
                <label className="field">
                  <span className="field__label">Type</span>
                  <input className="admin-input" name="resourceType" defaultValue={resource.resourceType} />
                </label>
                <label className="field">
                  <span className="field__label">File URL / Path</span>
                  <input className="admin-input" name="filePath" defaultValue={resource.filePath} />
                </label>
                <label className="field">
                  <span className="field__label">Audience</span>
                  <select className="admin-select" name="audienceType" defaultValue={resource.audienceType}>
                    <option value="all_partners">All Partners</option>
                    <option value="selected_partners">Selected Partners</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Status</span>
                  <select className="admin-select" name="status" defaultValue={resource.status}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Sort Order</span>
                  <input className="admin-input" name="sortOrder" defaultValue={String(resource.sortOrder)} />
                </label>
                <label className="field field--full">
                  <span className="field__label">Description</span>
                  <textarea className="admin-textarea" name="description" defaultValue={resource.description} />
                </label>
              </div>
              <div className="admin-form-actions">
                <button className="admin-btn admin-btn--primary" type="submit">
                  Update Resource
                </button>
              </div>
            </form>

            <form action={deleteResourceAction}>
              <input type="hidden" name="id" value={resource.id} />
              <button className="admin-btn admin-btn--danger" type="submit">
                Delete Resource
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
