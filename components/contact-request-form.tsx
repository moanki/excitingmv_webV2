"use client";

import { useState } from "react";

export function ContactRequestForm({ propertyName, onSuccess }: { propertyName?: string; onSuccess?: () => void } = {}) {
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setMessage(undefined);
    setError(undefined);

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      propertyName,
      website: String(formData.get("website") ?? "")
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.error ?? "Failed to send your message.");
      setMessage("Thank you. Your message has been sent to the Exciting Maldives team.");
      onSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send your message.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="newsletter-form public-request-form">
      <div className="newsletter-form__grid">
        {propertyName ? <label className="newsletter-field newsletter-field--full"><span>Property</span><input value={propertyName} readOnly /></label> : null}
        <label className="newsletter-field">
          <span>Name</span>
          <input name="name" autoComplete="name" minLength={2} maxLength={200} placeholder="Your full name" required />
        </label>
        <label className="newsletter-field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@agency.com" required />
        </label>
        <label className="newsletter-field newsletter-field--full">
          <span>Message</span>
          <textarea name="message" minLength={10} maxLength={5000} placeholder={propertyName ? "Tell us your travel dates, number of guests, and preferences." : "Tell us how we can help."} required />
        </label>
      </div>
      <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <button className="newsletter-form__submit" type="submit" disabled={pending}>
        {pending ? "Sending..." : propertyName ? "Submit Inquiry" : "Send Message"}
      </button>
      {message ? <p className="auth-note" role="status">{message}</p> : null}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
    </form>
  );
}
