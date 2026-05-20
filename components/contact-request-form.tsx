"use client";

import { useState } from "react";

export function ContactRequestForm() {
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
      message: String(formData.get("message") ?? "")
    };

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await response.json().catch(() => null);

    if (!response.ok) {
      setError(json?.error ?? "Failed to send your message.");
      setPending(false);
      return;
    }

    setMessage("Thank you. Your message has been sent to the Exciting Maldives team.");
    setPending(false);
  }

  return (
    <form action={onSubmit} className="stack">
      <div className="form-grid">
        <label className="field">
          Name
          <input name="name" placeholder="Your full name" required />
        </label>
        <label className="field">
          Email
          <input name="email" type="email" placeholder="you@agency.com" required />
        </label>
        <label className="field" style={{ gridColumn: "1 / -1" }}>
          Message
          <textarea name="message" placeholder="Tell us how we can help." required />
        </label>
      </div>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send Message"}
      </button>
      {message ? <p className="auth-note">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </form>
  );
}
