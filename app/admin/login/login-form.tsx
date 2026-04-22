"use client";

import { useActionState } from "react";

import { loginToAdmin } from "@/app/admin/login/actions";

export function AdminLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginToAdmin, undefined);

  return (
    <form action={action} className="stack admin-auth-form">
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span className="field__label">Email address</span>
        <input className="admin-input" name="email" type="email" placeholder="name@excitingmv.com" required />
      </label>
      <label className="field">
        <span className="field__label">Password</span>
        <input className="admin-input" name="password" type="password" placeholder="Enter your password" required />
      </label>
      <button type="submit" className="admin-btn admin-btn--primary admin-primary-button" disabled={pending}>
        {pending ? "Signing In..." : "Sign In"}
      </button>
      {state?.error ? <p className="admin-alert admin-alert--error">{state.error}</p> : null}
    </form>
  );
}
