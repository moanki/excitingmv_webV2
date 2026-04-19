"use client";

import { useActionState } from "react";

import {
  publishFeaturesAction,
  publishFooterAction,
  publishHeroAction,
  saveFeaturesDraftAction,
  saveFooterDraftAction,
  saveHeroDraftAction
} from "@/app/admin/settings/actions";
import type { FooterContent, HomepageFeatureCard, HomepageHeroContent } from "@/lib/site-content";

function StatusMessage({ message, error }: { message?: string; error?: string }) {
  if (error) {
    return <p className="auth-error">{error}</p>;
  }

  if (message) {
    return <p className="auth-note">{message}</p>;
  }

  return null;
}

export function HeroSettingsForm({ hero }: { hero: HomepageHeroContent }) {
  const [state, action, pending] = useActionState(saveHeroDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Homepage Hero</p>
          <h2>Control the premium first impression.</h2>
        </div>
        <form action={publishHeroAction}>
          <button className="button-muted" type="submit">
            Publish Hero
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="form-grid">
          <label className="field">
            Eyebrow
            <input name="eyebrow" defaultValue={hero.eyebrow} />
          </label>
          <label className="field">
            Primary CTA Label
            <input name="primaryCtaLabel" defaultValue={hero.primaryCtaLabel} />
          </label>
          <label className="field">
            Primary CTA Link
            <input name="primaryCtaHref" defaultValue={hero.primaryCtaHref} />
          </label>
          <label className="field">
            Secondary CTA Label
            <input name="secondaryCtaLabel" defaultValue={hero.secondaryCtaLabel} />
          </label>
          <label className="field">
            Secondary CTA Link
            <input name="secondaryCtaHref" defaultValue={hero.secondaryCtaHref} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Hero Title
            <textarea name="title" defaultValue={hero.title} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Hero Description
            <textarea name="description" defaultValue={hero.description} />
          </label>
        </div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Hero Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function FeaturesSettingsForm({ features }: { features: HomepageFeatureCard[] }) {
  const [state, action, pending] = useActionState(saveFeaturesDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Feature Cards</p>
          <h2>Edit the operational story on the homepage.</h2>
        </div>
        <form action={publishFeaturesAction}>
          <button className="button-muted" type="submit">
            Publish Features
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="stack">
          {features.map((feature, index) => (
            <div className="panel" key={`${feature.title}-${index}`}>
              <p className="eyebrow">Card {index + 1}</p>
              <div className="form-grid">
                <label className="field">
                  Eyebrow
                  <input name={`feature_${index}_eyebrow`} defaultValue={feature.eyebrow} />
                </label>
                <label className="field">
                  Title
                  <input name={`feature_${index}_title`} defaultValue={feature.title} />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Description
                  <textarea
                    name={`feature_${index}_description`}
                    defaultValue={feature.description}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Feature Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function FooterSettingsForm({ footer }: { footer: FooterContent }) {
  const [state, action, pending] = useActionState(saveFooterDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Footer & Contact</p>
          <h2>Publish brand copy and contact details to the front end.</h2>
        </div>
        <form action={publishFooterAction}>
          <button className="button-muted" type="submit">
            Publish Footer
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="form-grid">
          <label className="field">
            Company Label
            <input name="companyLabel" defaultValue={footer.companyLabel} />
          </label>
          <label className="field">
            Contact Email
            <input name="contactEmail" defaultValue={footer.contactEmail} />
          </label>
          <label className="field">
            Contact Phone
            <input name="contactPhone" defaultValue={footer.contactPhone} />
          </label>
          <label className="field">
            Samoa URL
            <input name="samoaUrl" defaultValue={footer.samoaUrl} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Footer Description
            <textarea name="description" defaultValue={footer.description} />
          </label>
        </div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Footer Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}
