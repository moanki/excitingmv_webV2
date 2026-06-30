"use client";

import { useActionState } from "react";

import { saveCatalogueSettingsAction } from "@/app/admin/settings/catalogue/actions";
import { ActionMessage, SubmitButton } from "@/components/admin/action-feedback";
import { MediaField, type MediaLibraryItem } from "@/components/media-field";
import type { CatalogueContent, CatalogueKind } from "@/lib/site-content";

const catalogueLabels: Record<CatalogueKind, string> = {
  resorts: "Resort Catalogue",
  hotels: "Hotel Catalogue",
  liveaboards: "Liveaboard Catalogue"
};

export function CatalogueSettingsForm({
  catalogues,
  mediaLibrary
}: {
  catalogues: Record<CatalogueKind, CatalogueContent>;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action] = useActionState(saveCatalogueSettingsAction, undefined);

  return (
    <form action={action} className="stack admin-form-card">
      <div className="admin-page-intro">
        <h1>Catalogue Banners</h1>
        <p>Manage the desktop hero image and copy for each public catalogue page.</p>
      </div>

      {(Object.keys(catalogueLabels) as CatalogueKind[]).map((kind) => (
        <section className="admin-form-section" key={kind}>
          <div className="admin-form-section__header">
            <h2 className="admin-form-section__title">{catalogueLabels[kind]}</h2>
          </div>
          <div className="form-grid">
            <label className="field field--full">
              <span className="field__label">Banner Title</span>
              <input className="admin-input" name={`${kind}Title`} defaultValue={catalogues[kind].title ?? ""} />
            </label>
            <label className="field field--full">
              <span className="field__label">Banner Description</span>
              <textarea className="admin-textarea" name={`${kind}Body`} defaultValue={catalogues[kind].body ?? ""} />
            </label>
          </div>
          <MediaField
            label="Catalogue Banner Image"
            inputName={`${kind}HeroImageUrl`}
            fileName={`${kind}HeroImageFile`}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            value={catalogues[kind].heroImageUrl}
            library={mediaLibrary}
            helper="Upload an image, choose one from the Media Library, or paste an image URL."
          />
        </section>
      ))}

      <div className="admin-form-actions">
        <SubmitButton idleLabel="Save & Publish Catalogue Banners" pendingLabel="Publishing..." />
      </div>
      <ActionMessage state={state} />
    </form>
  );
}
