"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COOKIE_NOTICE_EVENT, COOKIE_NOTICE_STORAGE_KEY, hasCurrentCookieAcknowledgement } from "@/lib/site-policies";

export function ShowCookieNotice() {
  return <button type="button" className="cookie-notice-link" onClick={() => window.dispatchEvent(new Event(COOKIE_NOTICE_EVENT))}>Show cookie notice</button>;
}

export function CookieNotice({ enabled, text }: { enabled: boolean; text: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!enabled || !text.trim()) { setVisible(false); return; }
    const reopen = () => setVisible(true);
    const read = () => {
      try { setVisible(!hasCurrentCookieAcknowledgement(localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY), text)); }
      catch { setVisible(true); }
    };
    read();
    window.addEventListener(COOKIE_NOTICE_EVENT, reopen);
    window.addEventListener("storage", read);
    return () => { window.removeEventListener(COOKIE_NOTICE_EVENT, reopen); window.removeEventListener("storage", read); };
  }, [enabled, text]);

  function acknowledge() {
    try { localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, JSON.stringify({ text, at: Date.now() })); } catch { /* A blocked store must not prevent dismissal. */ }
    setVisible(false);
  }

  if (!enabled || !text.trim() || !visible) return null;
  return <section className="cookie-notice" role="region" aria-labelledby="cookie-notice-title">
    <p className="cookie-notice__copy"><strong id="cookie-notice-title">Cookies.</strong> {text}</p>
    <div className="cookie-notice__actions">
      <div className="cookie-notice__links"><Link href="/cookie-policy">Cookie Policy</Link><Link href="/privacy-policy">Privacy Policy</Link></div>
      <button type="button" className="cookie-notice__dismiss" onClick={acknowledge}>OK</button>
    </div>
  </section>;
}
