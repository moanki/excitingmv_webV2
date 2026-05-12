"use client";

import { useActionState } from "react";
import { Eye, LogIn, Lock, Mail } from "lucide-react";

import { loginToAdmin } from "@/app/admin/login/actions";

export function AdminLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginToAdmin, undefined);

  return (
    <form action={action} className="stack admin-auth-form">
      <input type="hidden" name="next" value={next} />
      <label className="field admin-auth-field">
        <span className="field__label">Email address</span>
        <span className="admin-auth-input-wrap">
          <Mail size={20} strokeWidth={1.9} />
          <input className="admin-input" name="email" type="email" placeholder="Email address" required />
        </span>
      </label>
      <label className="field admin-auth-field">
        <span className="field__label">Password</span>
        <span className="admin-auth-input-wrap">
          <Lock size={20} strokeWidth={1.9} />
          <input className="admin-input" name="password" type="password" placeholder="Password" required />
          <Eye size={20} strokeWidth={1.9} aria-hidden="true" />
        </span>
      </label>
      <div className="admin-auth-form-row">
        <label className="admin-auth-remember">
          <input type="checkbox" name="remember" defaultChecked />
          <span>Remember me</span>
        </label>
        <a href="mailto:admin@excitingmaldives.com">Forgot password?</a>
      </div>
      <button type="submit" className="admin-btn admin-btn--primary admin-primary-button" disabled={pending}>
        <LogIn size={20} strokeWidth={2} />
        {pending ? "Signing In..." : "Sign In"}
      </button>
      {state?.error ? <p className="admin-alert admin-alert--error">{state.error}</p> : null}
    </form>
  );
}
