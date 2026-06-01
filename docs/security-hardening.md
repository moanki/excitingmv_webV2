# Security hardening notes

This branch moves admin access away from the legacy shared bootstrap cookie and toward Supabase Auth plus role checks.

## Admin access

- Admin API routes under `/api/admin/*` require a Supabase session and verify the user role server-side.
- Admin pages are guarded by the admin layout, which checks the current Supabase user against `user_roles` and `roles`.
- Server actions that mutate media, settings, imports, resources, users, partners, and properties now require admin roles before writing.
- Allowed admin roles are `super_admin`, `admin`, and `content_manager`, except User Access actions, which require `super_admin`.

## Required Supabase setup

1. Create the admin user in Supabase Auth.
2. Ensure `roles` contains the required role names.
3. Add a `user_roles` row for each admin user.
4. Apply `supabase/migrations/0020_security_hardening_rls.sql`.
5. Remove any old bootstrap admin password environment variables after confirming Supabase Auth login works.

## Public forms

Contact, newsletter, and partner registration routes now include:

- request validation
- honeypot handling
- in-process IP rate limiting
- optional Cloudflare Turnstile verification
- escaped HTML output before email rendering

Set these only when Turnstile is enabled:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

The in-process limiter is a safety net. For stronger production abuse protection, add a durable limiter such as Upstash/Vercel KV and/or Vercel Firewall rate limits.

## Headers

The app now sends security headers from `next.config.ts`, including `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, and a report-only CSP. Keep CSP report-only until production traffic confirms no legitimate assets or integrations are blocked.

## Storage

Media upload and signed-upload helpers now validate file type and require admin roles. The current public `site-assets` bucket remains public so existing images, logos, documents, and frontend media continue working. For private documents, create a separate private bucket and serve files through protected signed URLs.
