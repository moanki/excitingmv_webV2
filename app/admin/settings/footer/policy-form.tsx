"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ActionMessage } from "@/components/admin/action-feedback";
import { savePolicyAction } from "./policy-actions";
import { policyPaths, type PolicyId, type SitePolicy } from "@/lib/site-policies";

export function PolicyForm({ id, policy }: { id: PolicyId; policy: SitePolicy }) {
  const [state, action, pending] = useActionState(savePolicyAction, undefined);
  return <section className="panel">
    <div className="section-heading">
      <div><p className="eyebrow">Footer / {id === "privacy" ? "Privacy Policy" : "Cookie Policy"}</p>
        <h2>{id === "privacy" ? "Privacy Policy" : "Cookie Policy"}</h2>
        <p className="admin-page-lede">Add your policy wording, save a draft, then publish it to the website.</p>
      </div>
      <Link className="button-muted" href={policyPaths[id]} target="_blank" rel="noreferrer">View published page</Link>
    </div>
    <form action={action} className="stack">
      <input type="hidden" name="policyId" value={id} />
      <div className="form-grid">
        <label className="field">Page title<input name="title" defaultValue={policy.title} maxLength={160} required /></label>
        <label className="field">Effective date<input name="effectiveDate" type="date" defaultValue={policy.effectiveDate} /></label>
      </div>
      <label className="field">Policy content
        <textarea name="body" defaultValue={policy.body} rows={22} maxLength={100_000} placeholder="Paste your policy wording here." />
        <span className="field__help">Plain text. Use blank lines between paragraphs; line breaks are preserved. Drafts are private until published.</span>
      </label>
      {id === "cookies" ? <fieldset className="panel panel-soft stack">
        <legend>First-visit cookie notice</legend>
        <label className="field"><span><input type="checkbox" name="noticeEnabled" defaultChecked={policy.noticeEnabled} /> Show the notice at the bottom of the website</span></label>
        <label className="field">Notice text<textarea name="noticeText" defaultValue={policy.noticeText} rows={3} maxLength={1000} /></label>
        <p className="field__help">This is an essential-cookie notice with a “Got it” button. It remembers acknowledgement for 180 days. If you add analytics or advertising cookies, those services must be connected to consent controls before they run.</p>
      </fieldset> : null}
      <div className="admin-form-actions">
        <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>{pending ? "Saving..." : "Save Draft"}</button>
        <button className="button" type="submit" name="intent" value="publish" disabled={pending}>{pending ? "Saving..." : "Save & Publish"}</button>
      </div>
      <ActionMessage state={state} />
    </form>
  </section>;
}
