import type { ResourceRecord } from "@/lib/services/resource-service";

import { saveResourceAction } from "@/app/admin/resources/actions";
import { MediaField, type MediaLibraryItem } from "@/components/media-field";

type Props = {
  resource?: ResourceRecord | null;
  mediaLibrary?: MediaLibraryItem[];
};

export function ResourceEditorForm({ resource, mediaLibrary = [] }: Props) {
  const isEditing = Boolean(resource);

  return (
    <form action={saveResourceAction} className="stack admin-form-card">
      {resource ? <input type="hidden" name="id" value={resource.id} /> : null}

      <section className="admin-form-section">
        <div className="admin-form-section__header">
          <h3 className="admin-form-section__title">Resource Details</h3>
        </div>
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Resource Name</span>
            <input className="admin-input" name="title" defaultValue={resource?.title ?? ""} />
          </label>
          <label className="field">
            <span className="field__label">Resource Type</span>
            <select className="admin-select" name="resourceType" defaultValue={resource?.resourceType ?? "PDF"}>
              <option value="PDF">PDF</option>
              <option value="Brochure">Brochure</option>
              <option value="Rate Sheet">Rate Sheet</option>
              <option value="Contract">Contract</option>
              <option value="Image">Image</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">Visibility</span>
            <select className="admin-select" name="audienceType" defaultValue={resource?.audienceType ?? "all_partners"}>
              <option value="all_partners">All Partners</option>
              <option value="selected_partners">Selected Partners</option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">Status</span>
            <select className="admin-select" name="status" defaultValue={resource?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Active</option>
              <option value="archived">Disabled</option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">Sort Order</span>
            <input className="admin-input" name="sortOrder" type="number" defaultValue={String(resource?.sortOrder ?? 0)} />
          </label>
          <label className="field field--full">
            <span className="field__label">Description</span>
            <textarea className="admin-textarea" name="description" defaultValue={resource?.description ?? ""} />
          </label>
        </div>
        <MediaField
          label="Upload or select document"
          inputName="filePath"
          fileName="resourceFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,video/mp4,video/webm,video/quicktime"
          value={resource?.filePath ?? ""}
          library={mediaLibrary}
          helper="Upload documents, images, videos, or select an existing file from the media library."
        />
      </section>

      <div className="admin-form-actions">
        <button className="admin-btn admin-btn--primary" type="submit">
          {isEditing ? "Save Resource" : "Add Resource"}
        </button>
      </div>
    </form>
  );
}
