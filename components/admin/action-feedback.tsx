"use client";

import { useActionState, useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAdminActionFeedback } from "@/components/admin/admin-action-feedback";
import { SubmitButton as AdminSubmitButton } from "@/components/admin/submit-button";

export type ActionState = { message?: string; error?: string } | undefined;

export function InlineSpinner() {
  return <span className="admin-button-spinner" aria-hidden="true" />;
}

export function ActionMessage({ state }: { state: ActionState }) {
  const router = useRouter();
  const { finishLatestAction } = useAdminActionFeedback();

  useEffect(() => {
    if (state?.error) {
      finishLatestAction({ title: state.error, status: "error" });
    } else if (state?.message) {
      finishLatestAction({ title: state.message, status: "success" });
      router.refresh();
    }
  }, [finishLatestAction, router, state?.error, state?.message]);

  if (state?.error) return <p className="admin-alert admin-alert--error" role="alert" data-admin-feedback-handled="true">{state.error}</p>;
  if (state?.message) return <p className="admin-alert admin-alert--success" role="status" data-admin-feedback-handled="true">{state.message}</p>;
  return null;
}

type SubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  idleLabel: string;
  pendingLabel: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "icon";
  feedbackTitle?: string;
  feedbackMessage?: string;
};

export function SubmitButton({ idleLabel, pendingLabel, icon, variant = "primary", className = "", feedbackTitle, feedbackMessage, ...props }: SubmitButtonProps) {
  const variantClass = variant === "icon" ? "admin-icon-button" : `admin-btn admin-btn--${variant}`;

  return (
    <AdminSubmitButton
      {...props}
      idleLabel={idleLabel}
      pendingLabel={pendingLabel}
      icon={icon}
      feedbackTitle={feedbackTitle}
      feedbackMessage={feedbackMessage}
      className={`${variantClass} ${className}`.trim()}
    />
  );
}

export function ActionForm({
  action,
  idleLabel,
  pendingLabel,
  hidden,
  confirmMessage,
  icon,
  variant = "primary",
  className,
  buttonClassName,
  ariaLabel,
  children,
  disabled,
  feedbackTitle,
  feedbackMessage
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  idleLabel: string;
  pendingLabel: string;
  hidden?: Record<string, string>;
  confirmMessage?: string;
  icon?: ReactNode;
  variant?: SubmitButtonProps["variant"];
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
  children?: ReactNode;
  disabled?: boolean;
  feedbackTitle?: string;
  feedbackMessage?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      className={className ?? "admin-action-form"}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {Object.entries(hidden ?? {}).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      {children}
      <SubmitButton
        idleLabel={idleLabel}
        pendingLabel={pendingLabel}
        icon={icon}
        variant={variant}
        className={buttonClassName}
        aria-label={ariaLabel}
        disabled={disabled}
        feedbackTitle={feedbackTitle}
        feedbackMessage={feedbackMessage}
      />
      <ActionMessage state={state} />
    </form>
  );
}
