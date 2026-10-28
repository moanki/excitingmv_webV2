"use client";

import { CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { ContactRequestForm } from "@/components/contact-request-form";

export function PropertyInquiry({ name }: { name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  function showInquiry() {
    setSubmitted(false);
    setOpen(true);
    dialog.current?.showModal();
  }

  return (
    <>
      <button type="button" className="property-detail-overview__button property-inquiry-trigger" onClick={showInquiry}>
        Inquire Now
      </button>
      <dialog ref={dialog} className="property-inquiry-dialog" aria-labelledby={headingId} onClose={() => setOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <div className="property-inquiry-dialog__panel">
          <button type="button" className="partner-modal-close property-inquiry-dialog__close" aria-label="Close inquiry" onClick={() => dialog.current?.close()}>
            <X size={20} aria-hidden="true" />
          </button>
          {submitted ? (
            <div className="property-inquiry-success" role="status">
              <CheckCircle2 size={72} aria-hidden="true" />
              <h2 id={headingId}>Inquiry sent</h2>
              <p>Thank you. Your inquiry for {name} has been successfully sent. Our team will get back to you as soon as possible.</p>
              <p>For immediate or urgent inquiries, please contact our <Link href="/contact">regional managers</Link>.</p>
              <button type="button" className="newsletter-form__submit" autoFocus onClick={() => dialog.current?.close()}>Close</button>
            </div>
          ) : (
            <>
              <h2 id={headingId}>Inquire about {name}</h2>
              {open ? <ContactRequestForm propertyName={name} onSuccess={() => setSubmitted(true)} /> : null}
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
