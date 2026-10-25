"use client";

import { useActionState } from "react";
import type { ResourceRecord } from "@/lib/services/resource-service";

import { saveResourceAction } from "@/app/admin/resources/actions";
import type { MediaLibraryItem } from "@/components/media-field";
import { PrivateResourceFileField } from "@/components/private-resource-file-field";
import { ActionMessage, SubmitButton } from "@/components/admin/action-feedback";

type Props = {
  resource?: ResourceRecord | null;
  mediaLibrary?: MediaLibraryItem[];
};

export function ResourceEditorForm({ resource, mediaLibrary = [] }: Props) {
  const isEditing = Boolean(resource);
  const [state, action] = useActionState(saveResourceAction, undefined);

  return (
    <form action={action} className="stack admin-form-card">
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
        <PrivateResourceFileField value={resource?.filePath ?? ""} resourceId={resource?.id} />
      </section>

      <div className="admin-form-actions">
        <SubmitButton
          idleLabel={isEditing ? "Save Resource" : "Add Resource"}
          pendingLabel={isEditing ? "Saving..." : "Adding..."}
          feedbackTitle={isEditing ? "Saving resource..." : "Adding resource..."}
        />
      </div>
      <ActionMessage state={state} />
    </form>
  );
}
