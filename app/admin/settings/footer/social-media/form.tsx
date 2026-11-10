"use client";

import { useActionState, useState } from "react";
import { ActionMessage } from "@/components/admin/action-feedback";
import { footerSocialPlatforms, type FooterSocialMedia } from "@/lib/footer-social-media";
import { saveFooterSocialMediaAction } from "./actions";

export function SocialMediaForm({ links }: { links: FooterSocialMedia }) {
  const [state, action, pending] = useActionState(saveFooterSocialMediaAction, undefined);
  const [values, setValues] = useState(links);

  return (
    <section className="panel">
      <div className="section-heading">
        <div className="policy-editor-heading">
          <p className="eyebrow">Footer / Social Media</p>
          <h2>Social Media</h2>
        </div>
      </div>
      <form action={action} className="stack" aria-describedby="footer-social-media-help">
        <p className="field__help" id="footer-social-media-help">
          Enter the full URL for each footer icon. Leave a URL blank to hide its icon when you publish.
        </p>
        <div className="form-grid">
          {footerSocialPlatforms.map(({ key, label }) => (
            <label className="field" key={key}>
              {label} URL
              <input
                name={key}
                type="url"
                value={values[key]}
                onChange={(event) => setValues({ ...values, [key]: event.target.value })}
                maxLength={2048}
              />
            </label>
          ))}
        </div>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Saving..." : "Save & Publish"}
          </button>
        </div>
        <ActionMessage state={state} />
      </form>
    </section>
  );
}
