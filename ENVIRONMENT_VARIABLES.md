# Environment Variables

Configure each Vercel project independently. Do not copy one project's Supabase keys into the other project.

## A) Staging / Personal Vercel

Project: <https://vercel.com/monkeemoan-4647s-projects/excitingmv-web-v2/>

```dotenv
APP_ENV=staging
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=<staging deployment URL>
NEXT_PUBLIC_SUPABASE_URL=https://ddelyhoaflwtlzjwtihq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging anon key from Supabase>
SUPABASE_SERVICE_ROLE_KEY=<staging service role key>
```

Set these values for the Vercel environments used by staging. The service-role key is required for the admin portal, CMS writes, Auth administration, and Storage administration.

## B) Production / Exciting Maldives Vercel

Team: <https://vercel.com/exciting-maldives-projects/>

```dotenv
APP_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=<production website URL>
NEXT_PUBLIC_SUPABASE_URL=https://rlbdzvblntcnyxhzlvll.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production anon key from Supabase>
SUPABASE_SERVICE_ROLE_KEY=<production service role key>
```

Set these values only inside the Exciting Maldives production Vercel project.

## Other variables used by the application

| Variable | Scope | Purpose |
| --- | --- | --- |
| `AI_GATEWAY_API_KEY` | Server | Vercel AI Gateway authentication when OIDC is unavailable. |
| `VERCEL_OIDC_TOKEN` | Server | Vercel-managed AI Gateway authentication. |
| `AI_GATEWAY_PREFERRED_MODELS` | Server | Optional comma-separated ordered AI model list. |
| `AI_GATEWAY_IMPORT_MODELS` | Server | Optional comma-separated import-processing model list. |
| `EMAIL_CONFIG_ENCRYPTION_KEY` | Server | Encrypts saved SMTP credentials. |
| `EMAIL_PROVIDER` | Server | Selects the email configuration source. |
| `SAMOA_EXTERNAL_URL` | Server | Optional Samoa integration URL. |
| `BOOTSTRAP_ADMIN_EMAIL` | Server | Optional bootstrap administrator email. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Server | Optional bootstrap administrator password. |
| `TURNSTILE_SECRET_KEY` | Server | Optional Cloudflare Turnstile secret. |

`APP_ENV` and `NEXT_PUBLIC_APP_ENV` are deployment labels; the runtime does not currently branch on them. `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `SUPABASE_JWT_SECRET`, and `DATABASE_URL` are also not read by the current application runtime. Add server secrets only if a future server-only feature explicitly requires them.

## Safety

- Never commit `.env` files.
- Never commit Supabase service-role keys.
- Production keys belong only in the Exciting Maldives Vercel project.
- Staging keys belong only in the personal staging Vercel project.
- Browser code uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix and is restricted to server-side modules.
