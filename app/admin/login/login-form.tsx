"use client";

import { useActionState } from "react";

import { loginToAdmin } from "@/app/admin/login/actions";

export function AdminLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginToAdmin, undefined);

  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next} />
      <label className="field">
        Email
        <input name="email" type="email" placeholder="superadmin@excitingmaldives.com" required />
      </label>
      <label className="field">
        Password
        <input name="password" type="password" placeholder="Enter your password" required />
      </label>
      <button type="submit" className="button" disabled={pending}>
        {pending ? "Signing In..." : "Login To Admin"}
      </button>
      {state?.error ? <p className="auth-error">{state.error}</p> : null}
    </form>
  );
}
