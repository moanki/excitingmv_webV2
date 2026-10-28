"use client";

import { CheckCircle2, X } from "lucide-react";
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
      <div className="mobile-sticky-inquiry">
        <button type="button" onClick={showInquiry}>Inquire Now</button>
      </div>
      <dialog ref={dialog} className="property-inquiry-dialog" aria-labelledby={headingId} onClose={() => setOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <div className="property-inquiry-dialog__panel">
          <button type="button" className="partner-modal-close property-inquiry-dialog__close" aria-label="Close inquiry" onClick={() => dialog.current?.close()}>
            <X size={20} aria-hidden="true" />
          </button>
          {submitted ? (
            <div className="property-inquiry-success" role="status">
              <CheckCircle2 size={72} aria-hidden="true" />
              <h2 id={headingId}>Submitted</h2>
              <p>Your inquiry for {name} has been submitted.</p>
              <p>You can close this window to view more properties.</p>
              <button type="button" className="button" autoFocus onClick={() => dialog.current?.close()}>Close</button>
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
