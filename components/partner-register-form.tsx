"use client";

import { useState } from "react";

export function PartnerRegisterForm() {
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setMessage(undefined);
    setError(undefined);

    const payload = {
      agencyName: String(formData.get("agencyName") ?? ""),
      contactName: String(formData.get("contactName") ?? ""),
      email: String(formData.get("email") ?? ""),
      market: String(formData.get("market") ?? ""),
      notes: String(formData.get("notes") ?? "")
    };

    const response = await fetch("/api/partner-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await response.json().catch(() => null);

    if (!response.ok) {
      setError(json?.error ?? "Failed to submit partner request.");
      setPending(false);
      return;
    }

    setMessage("Partner request submitted. Our team will review it shortly.");
    setPending(false);
  }

  return (
    <form action={onSubmit} className="stack">
      <div className="form-grid">
        <label className="field">
          Agency Name
          <input name="agencyName" placeholder="Agency or company name" />
        </label>
        <label className="field">
          Contact Name
          <input name="contactName" placeholder="Primary contact" />
        </label>
        <label className="field">
          Business Email
          <input name="email" type="email" placeholder="name@agency.com" />
        </label>
        <label className="field">
          Market
          <input name="market" placeholder="Country or region" />
        </label>
        <label className="field" style={{ gridColumn: "1 / -1" }}>
          Notes
          <textarea name="notes" placeholder="Tell us about your market and partner requirements." />
        </label>
      </div>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Apply To Become A Partner"}
      </button>
      {message ? <p className="auth-note">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </form>
  );
}
