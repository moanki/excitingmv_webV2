"use client";

import { useActionState } from "react";

import { deleteResortAction, saveResortAction, seedResortsAction } from "@/app/admin/resorts/actions";
import type { ResortRecord } from "@/lib/services/resort-service";

function StatusMessage({ message, error }: { message?: string; error?: string }) {
  if (error) {
    return <p className="auth-error">{error}</p>;
  }

  if (message) {
    return <p className="auth-note">{message}</p>;
  }

  return null;
}

function ResortEditor({
  resort,
  title,
  description
}: {
  resort: Partial<ResortRecord> & { id?: string; name?: string };
  title: string;
  description: string;
}) {
  const [state, action, pending] = useActionState(saveResortAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{title}</p>
          <h2>{resort.name || "Draft property"}</h2>
          <p className="muted">{description}</p>
        </div>
        {resort.id ? (
          <form action={deleteResortAction}>
            <input type="hidden" name="id" value={resort.id} />
            <button className="button-muted" type="submit">
              Delete
            </button>
          </form>
        ) : null}
      </div>
      <form action={action} className="stack">
        {resort.id ? <input type="hidden" name="id" value={resort.id} /> : null}
        <div className="form-grid">
          <label className="field">
            Property Name
            <input name="name" defaultValue={resort.name ?? ""} />
          </label>
          <label className="field">
            Slug
            <input name="slug" defaultValue={resort.slug ?? ""} />
          </label>
          <label className="field">
            Atoll / Location
            <input name="location" defaultValue={resort.location ?? ""} />
          </label>
          <label className="field">
            Category
            <input name="category" defaultValue={resort.category ?? ""} />
          </label>
          <label className="field">
            Transfer Type
            <input name="transferType" defaultValue={resort.transferType ?? ""} />
          </label>
          <label className="field">
            Status
            <select name="status" defaultValue={resort.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Description
            <textarea name="description" defaultValue={resort.description ?? resort.summary ?? ""} />
          </label>
          <label className="field">
            Highlights
            <textarea
              name="highlights"
              defaultValue={(resort.highlights ?? []).join("\n")}
              placeholder="One highlight per line"
            />
          </label>
          <label className="field">
            Meal Plans
            <textarea
              name="mealPlans"
              defaultValue={(resort.mealPlans ?? []).join("\n")}
              placeholder="One meal plan per line"
            />
          </label>
          <label className="field">
            SEO Title
            <input name="seoTitle" defaultValue={resort.seoTitle ?? resort.name ?? ""} />
          </label>
          <label className="field">
            SEO Description
            <textarea name="seoDescription" defaultValue={resort.seoDescription ?? resort.summary ?? ""} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            SEO Summary
            <textarea name="seoSummary" defaultValue={resort.seoSummary ?? resort.summary ?? ""} />
          </label>
        </div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Property"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function CreateResortForm() {
  return (
    <ResortEditor
      resort={{ status: "draft" }}
      title="Create Property"
      description="Add a new resort record directly from the admin portal and publish it when ready."
    />
  );
}

export function ExistingResortForms({ resorts }: { resorts: ResortRecord[] }) {
  return (
    <div className="stack">
      {resorts.map((resort) => (
        <ResortEditor
          key={resort.id}
          resort={resort}
          title="Edit Property"
          description="Update the live property record, metadata, commercial fields, and publish state."
        />
      ))}
    </div>
  );
}

export function SeedResortsButton() {
  return (
    <form action={seedResortsAction}>
      <button className="button-muted" type="submit">
        Seed Starter Properties
      </button>
    </form>
  );
}
