"use client";

import { useActionState } from "react";

import { deleteResortAction, saveResortAction, seedResortsAction } from "@/app/admin/resorts/actions";
import { MediaField, type MediaLibraryItem } from "@/components/media-field";
import type { ResortRecord } from "@/lib/services/resort-service";

function StatusMessage({ message, error }: { message?: string; error?: string }) {
  if (error) {
    return <p className="admin-alert admin-alert--error">{error}</p>;
  }

  if (message) {
    return <p className="admin-alert admin-alert--success">{message}</p>;
  }

  return null;
}

function ResortEditor({
  resort,
  title,
  description,
  mediaLibrary
}: {
  resort: Partial<ResortRecord> & { id?: string; name?: string };
  title: string;
  description: string;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveResortAction, undefined);

  return (
    <div className="panel">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">{title}</p>
          <h2>{resort.name || "Draft property"}</h2>
          <p className="admin-page-lede">{description}</p>
        </div>
      </div>

      <form action={action} className="stack admin-form-card">
        {resort.id ? <input type="hidden" name="id" value={resort.id} /> : null}

        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">Basic Information</h3>
            <p className="admin-form-section__help">Core identity, location, category, and publish status.</p>
          </div>
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Property Name</span>
              <input className="admin-input" name="name" defaultValue={resort.name ?? ""} />
            </label>
            <label className="field">
              <span className="field__label">Slug</span>
              <input className="admin-input" name="slug" defaultValue={resort.slug ?? ""} />
            </label>
            <label className="field">
              <span className="field__label">Atoll / Location</span>
              <input className="admin-input" name="location" defaultValue={resort.location ?? ""} />
            </label>
            <label className="field">
              <span className="field__label">Category</span>
              <input className="admin-input" name="category" defaultValue={resort.category ?? ""} />
            </label>
            <label className="field">
              <span className="field__label">Transfer Type</span>
              <input className="admin-input" name="transferType" defaultValue={resort.transferType ?? ""} />
            </label>
            <label className="field">
              <span className="field__label">Status</span>
              <select className="admin-select" name="status" defaultValue={resort.status ?? "draft"}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="field field--full">
              <span className="field__label">Description</span>
              <textarea
                className="admin-textarea"
                name="description"
                defaultValue={resort.description ?? resort.summary ?? ""}
              />
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">Commercial Details</h3>
            <p className="admin-form-section__help">Keep sales highlights and board plans easy to review.</p>
          </div>
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Highlights</span>
              <textarea
                className="admin-textarea"
                name="highlights"
                defaultValue={(resort.highlights ?? []).join("\n")}
                placeholder="One highlight per line"
              />
            </label>
            <label className="field">
              <span className="field__label">Meal Plans</span>
              <textarea
                className="admin-textarea"
                name="mealPlans"
                defaultValue={(resort.mealPlans ?? []).join("\n")}
                placeholder="One meal plan per line"
              />
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">SEO</h3>
            <p className="admin-form-section__help">Prepare clean metadata for the public resort page.</p>
          </div>
          <div className="form-grid">
            <label className="field">
              <span className="field__label">SEO Title</span>
              <input className="admin-input" name="seoTitle" defaultValue={resort.seoTitle ?? resort.name ?? ""} />
            </label>
            <label className="field">
              <span className="field__label">SEO Description</span>
              <textarea
                className="admin-textarea"
                name="seoDescription"
                defaultValue={resort.seoDescription ?? resort.summary ?? ""}
              />
            </label>
            <label className="field field--full">
              <span className="field__label">SEO Summary</span>
              <textarea
                className="admin-textarea"
                name="seoSummary"
                defaultValue={resort.seoSummary ?? resort.summary ?? ""}
              />
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">Media</h3>
            <p className="admin-form-section__help">Hero visuals and gallery assets for resort cards and detail pages.</p>
          </div>

          <MediaField
            label="Hero photo"
            inputName="heroImageUrl"
            fileName="heroImageFile"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            value={resort.heroImageUrl ?? ""}
            library={mediaLibrary}
            helper="Main image used for resort cards and gallery cover."
          />

          <div className="form-grid">
            <label className="field field--full">
              <span className="field__label">Gallery image URLs</span>
              <textarea
                className="admin-textarea"
                name="galleryMediaUrls"
                defaultValue={(resort.galleryMediaUrls ?? []).join("\n")}
                placeholder="One image URL per line, or upload new files below."
              />
            </label>
            <label className="field field--full">
              <span className="field__label">Upload gallery images</span>
              <input
                className="admin-file-input"
                name="galleryMediaFiles"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                multiple
              />
            </label>
          </div>
        </section>

        <div className="admin-form-actions">
          {resort.id ? (
            <button className="admin-btn admin-btn--danger" type="submit" form={`delete-resort-${resort.id}`}>
              Delete Property
            </button>
          ) : null}
          <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Property"}
          </button>
        </div>

        <StatusMessage message={state?.message} error={state?.error} />
      </form>

      {resort.id ? (
        <form id={`delete-resort-${resort.id}`} action={deleteResortAction}>
          <input type="hidden" name="id" value={resort.id} />
        </form>
      ) : null}
    </div>
  );
}

export function CreateResortForm({ mediaLibrary }: { mediaLibrary: MediaLibraryItem[] }) {
  return (
    <ResortEditor
      resort={{ status: "draft" }}
      title="Create Property"
      description="Add a new resort record directly from the admin portal and publish it when ready."
      mediaLibrary={mediaLibrary}
    />
  );
}

export function ExistingResortForms({
  resorts,
  mediaLibrary
}: {
  resorts: ResortRecord[];
  mediaLibrary: MediaLibraryItem[];
}) {
  return (
    <div className="stack">
      {resorts.map((resort) => (
        <ResortEditor
          key={resort.id}
          resort={resort}
          title="Edit Property"
          description="Update the live property record, metadata, commercial fields, and publish state."
          mediaLibrary={mediaLibrary}
        />
      ))}
    </div>
  );
}

export function SeedResortsButton() {
  return (
    <form action={seedResortsAction}>
      <button className="admin-btn admin-btn--secondary" type="submit">
        Seed Starter Properties
      </button>
    </form>
  );
}
