"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { useAdminActionFeedback } from "@/components/admin/admin-action-feedback";

type SubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  idleLabel: string;
  pendingLabel: string;
  icon?: ReactNode;
  feedbackTitle?: string;
  feedbackMessage?: string;
};

function pendingTitle(pendingLabel: string, idleLabel: string, ariaLabel: unknown) {
  if (pendingLabel.trim()) return pendingLabel;
  const label = String(ariaLabel || idleLabel || "Action").trim();
  if (/^delete\b/i.test(label)) return label.replace(/^delete\b/i, "Deleting") + "...";
  return `${label}...`;
}

export function SubmitButton({ idleLabel, pendingLabel, icon, feedbackTitle, feedbackMessage, className = "admin-btn admin-btn--primary", ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const { dismissAction, startAction } = useAdminActionFeedback();
  const actionId = useRef<string | null>(null);
  const ariaLabel = props["aria-label"];

  useEffect(() => {
    if (pending && !actionId.current) {
      actionId.current = startAction({
        title: feedbackTitle || pendingTitle(pendingLabel, idleLabel, ariaLabel),
        message: feedbackMessage
      });
      return;
    }

    if (!pending && actionId.current) {
      const completedId = actionId.current;
      actionId.current = null;
      const timer = setTimeout(() => dismissAction(completedId), 5000);
      return () => clearTimeout(timer);
    }
  }, [ariaLabel, dismissAction, feedbackMessage, feedbackTitle, idleLabel, pending, pendingLabel, startAction]);

  return (
    <button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      aria-disabled={pending || props.disabled || undefined}
      className={className}
      data-admin-pending-label={pendingLabel}
      data-admin-feedback-managed="true"
    >
      {pending ? <span className="admin-submit-spinner" aria-hidden="true" /> : icon}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
