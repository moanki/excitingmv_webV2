"use client";

import { useState } from "react";

export function NewsletterSignupForm({ markets }: { markets: string[] }) {
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setMessage(undefined);
    setError(undefined);

    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      agencyName: String(formData.get("agencyName") ?? ""),
      countryOfOrigin: String(formData.get("countryOfOrigin") ?? ""),
      contactNumber: String(formData.get("contactNumber") ?? ""),
      email: String(formData.get("email") ?? ""),
      primaryMarket: String(formData.get("primaryMarket") ?? ""),
      additionalNotes: String(formData.get("additionalNotes") ?? ""),
      source: "homepage"
    };

    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await response.json().catch(() => null);

    if (!response.ok) {
      setError(json?.error ?? "Failed to submit the form.");
      setPending(false);
      return;
    }

    setMessage("Thank you. Your details have been saved for the Exciting Maldives team.");
    setPending(false);
  }

  return (
    <form action={onSubmit} className="stack">
      <div className="form-grid">
        <label className="field">
          Full Name
          <input name="fullName" required />
        </label>
        <label className="field">
          Travel Agency / Tour Operator Name
          <input name="agencyName" required />
        </label>
        <label className="field">
          Country of Origin
          <input name="countryOfOrigin" required />
        </label>
        <label className="field">
          Contact Number
          <input name="contactNumber" required />
        </label>
        <label className="field">
          Email Address
          <input name="email" type="email" required />
        </label>
        <label className="field">
          Primary Market
          <select name="primaryMarket" defaultValue={markets[0] ?? ""} required>
            {markets.map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>
        </label>
        <label className="field" style={{ gridColumn: "1 / -1" }}>
          Additional Notes
          <textarea name="additionalNotes" />
        </label>
      </div>
      <p className="muted">
        Only thoughtful updates we believe are worth sharing. By submitting this form, you agree
        to receive relevant updates and offers from Exciting Maldives. You may opt out at any
        time.
      </p>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Stay In Touch"}
      </button>
      {message ? <p className="auth-note">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </form>
  );
}
