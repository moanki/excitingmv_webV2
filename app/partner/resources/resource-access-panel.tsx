"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { unlockResourcesAction, type ResourceUnlockState } from "@/app/partner/resources/actions";
import type { ResourceRecord } from "@/lib/services/resource-service";

type PublicResource = Pick<ResourceRecord, "id" | "title" | "description" | "resourceType" | "audienceType">;

type Props = {
  resources: PublicResource[];
  hasAccess: boolean;
  openOnLoad: boolean;
};

const initialState: ResourceUnlockState = { ok: false };

export function ResourceAccessPanel({ resources, hasAccess, openOnLoad }: Props) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(openOnLoad && !hasAccess);
  const [state, formAction, isPending] = useActionState(unlockResourcesAction, initialState);

  useEffect(() => {
    if (state.ok) {
      setIsModalOpen(false);
      router.refresh();
    }
  }, [router, state.ok]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => inputRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsModalOpen(false);
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isModalOpen]);

  function requestAccess() {
    if (!hasAccess) {
      setIsModalOpen(true);
    }
  }

  return (
    <>
      <div className="partner-resource-grid">
        {resources.map((resource) => (
          <article
            className={hasAccess ? "partner-resource-card" : "partner-resource-card is-locked"}
            key={resource.id}
          >
            <button
              className="partner-resource-card__lock-trigger"
              type="button"
              onClick={requestAccess}
              aria-label={hasAccess ? undefined : `Unlock ${resource.title}`}
              tabIndex={hasAccess ? -1 : 0}
            />
            <div>
              <p className="partner-resource-card__eyebrow">{resource.resourceType || "Resource"}</p>
              <h2>{resource.title}</h2>
              <p>{resource.description || "Protected partner resource prepared by the Exciting Maldives team."}</p>
            </div>
            <div className="partner-resource-card__footer">
              <span>{resource.audienceType === "selected_partners" ? "Selected partners" : "All partners"}</span>
              {hasAccess ? (
                <div className="partner-resource-card__actions">
                  <Link href={`/partner/resources/${resource.id}?mode=view`} target="_blank">
                    View
                  </Link>
                  <Link href={`/partner/resources/${resource.id}?mode=download`}>
                    Download
                  </Link>
                </div>
              ) : (
                <button type="button" onClick={requestAccess}>
                  Unlock
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {isModalOpen ? (
        <div className="resource-modal-backdrop" role="presentation" onMouseDown={() => setIsModalOpen(false)}>
          <div
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            aria-modal="true"
            className="resource-modal"
            ref={modalRef}
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="resource-modal__close" type="button" onClick={() => setIsModalOpen(false)} aria-label="Close resource access modal">
              ×
            </button>
            <p className="eyebrow">Partner Library</p>
            <h2 id={titleId}>Access Resources</h2>
            <p id={descriptionId}>
              Enter the password provided by our team to view and download partner resources.
            </p>
            <form action={formAction} className="resource-modal__form">
              <label>
                <span>Resource Password</span>
                <input
                  autoComplete="current-password"
                  name="resourcePassword"
                  placeholder="Enter password"
                  ref={inputRef}
                  required
                  type="password"
                />
              </label>
              {state.error ? <p className="resource-modal__error">{state.error}</p> : null}
              <div className="resource-modal__actions">
                <button type="submit" disabled={isPending}>
                  {isPending ? "Validating..." : "Unlock Resources"}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

