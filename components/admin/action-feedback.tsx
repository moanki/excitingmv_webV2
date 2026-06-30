"use client";

import { useActionState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export type ActionState = { message?: string; error?: string } | undefined;

export function InlineSpinner() {
  return <span className="admin-button-spinner" aria-hidden="true" />;
}

export function ActionMessage({ state }: { state: ActionState }) {
  if (state?.error) return <p className="admin-alert admin-alert--error" role="alert">{state.error}</p>;
  if (state?.message) return <p className="admin-alert admin-alert--success" role="status">{state.message}</p>;
  return null;
}

type SubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  idleLabel: string;
  pendingLabel: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "icon";
};

export function SubmitButton({ idleLabel, pendingLabel, icon, variant = "primary", className = "", ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const variantClass = variant === "icon" ? "admin-icon-button" : `admin-btn admin-btn--${variant}`;

  return (
    <button {...props} type="submit" disabled={pending || props.disabled} className={`${variantClass} ${className}`.trim()}>
      {pending ? <InlineSpinner /> : icon}
      {pending ? pendingLabel : idleLabel}
    </button>
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
  disabled
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
      />
      <ActionMessage state={state} />
    </form>
  );
}
