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
    <form action={onSubmit} className="newsletter-form">
      <div className="newsletter-form__grid">
        <label className="newsletter-field">
          <span>Full Name *</span>
          <input name="fullName" placeholder="Your name" required />
        </label>
        <label className="newsletter-field">
          <span>Agency *</span>
          <input name="agencyName" placeholder="Company name" required />
        </label>
        <label className="newsletter-field">
          <span>Country *</span>
          <input name="countryOfOrigin" placeholder="Country" required />
        </label>
        <label className="newsletter-field">
          <span>Phone *</span>
          <input name="contactNumber" placeholder="+00" required />
        </label>
        <label className="newsletter-field">
          <span>Email *</span>
          <input name="email" type="email" placeholder="name@agency.com" required />
        </label>
        <label className="newsletter-field">
          <span>Market *</span>
          <select name="primaryMarket" defaultValue="" required>
            <option value="" disabled>
              Select a market
            </option>
            {markets.map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>
        </label>
        <label className="newsletter-field newsletter-field--full">
          <span>Notes</span>
          <textarea name="additionalNotes" placeholder="Optional context" />
        </label>
      </div>
      <p className="newsletter-form__microcopy">
        Thoughtful partner updates only. You may opt out at any time.
      </p>
      <button className="newsletter-form__submit" type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Stay In Touch"}
      </button>
      {message ? <p className="auth-note">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </form>
  );
}
