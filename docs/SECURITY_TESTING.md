# Security fixes — testing only

This branch is based on staging. Deploy it as a feature-branch Preview connected only to Supabase ddelyhoaflwtlzjwtihq. Do not deploy main or modify rlbdzvblntcnyxhzlvll as part of this change.

## Database and files

Apply 20261025151731_app_security_hardening.sql and 20261025155504_harden_security_helper_permissions.sql to testing before deploying. It adds server-only revocable sessions, moves password hashes out of partner notes, adds a status/password access-version trigger, creates an atomic database rate limiter, creates the private partner-resources bucket, and narrows email configuration policies. Existing partner credentials are preserved; future passwords require 12–256 characters.

Partner unlocking now requires the partner email plus password. All selected resources are checked against protected_resources. Sessions are random opaque tokens stored hashed server-side. Changing status/password invalidates existing sessions, including disable/re-enable cycles. Signed file links expire after 60 seconds; an already issued link can remain usable until expiry.

Existing partner documents must be moved from public storage. The admin resource editor has a migration button. Verify references first. Migration moves the object to private storage, updates resource references and attempts to restore the source if the database update fails. Confirm the old public URL is no longer accessible. Do not make the general website asset bucket private.

## Other boundaries

Imports allow only HTTPS Google Drive/Googleusercontent and the configured project Storage host. Both runtimes validate DNS addresses and redirects, pin connections, and cap response sizes. Python also checks archive expansion and PDF page counts. CSV formulas are neutralized. Email administration uses the same role restrictions in the API, page and RLS; encrypted credentials stay on the server.

Public forms have a 64 KB JSON limit, a shared database rate limit and Turnstile verification. Admin and resource password attempts have separate per-IP and per-account shared limits. Rate-limit database failures deny attempts. Production CAPTCHA configuration is mandatory; only an explicit local-development bypass is supported. CSP uses per-request nonces and is enforced; its report receiver stores only a directive and blocked origin in server logs.

## Preview configuration

Set APP_ENV and NEXT_PUBLIC_APP_ENV to staging. Verify /api/health reports databaseProject ddelyhoaflwtlzjwtihq. Public Supabase URL/key must match that project; the existing Preview service-role secret must belong to it.

The security preview uses Cloudflare documented test CAPTCHA keys to test the widget and validation path. They are not human/bot protection and must never be used for a production release. Real site/secret keys and their allowed hostnames are required before promotion. Do not copy secrets into this document or commit environment files.

## Verification

- TypeScript and a clean production build.
- node --test tests/security.test.cjs tests/brochure-import.test.cjs tests/error-message.test.cjs
- npx tsx --test tests/homepage-why-us.test.ts lib/property-overview.test.ts lib/resort-map-csv.test.ts lib/resort-map.test.mjs lib/travel-guide-utils.test.mjs lib/site-content.test.ts
- python -m pytest tests/test_markitdown.py
- npm audit --omit=dev
- Test two partner identities, another partner's selected resource, status/password revocation, direct private-object denial, public-source removal, content-manager email denial, real shared-limit expiry, and missing CAPTCHA rejection.
- Confirm public pages render, nonce-bearing scripts match CSP, maps/workers load, admin save/publish, private uploads, downloads, Excel fixtures and email settings still work. Use staging fixtures and remove temporary auth users/data after testing. Production remains untouched.
