# Exciting Maldives Web V2

Production starter for the Exciting Maldives luxury B2B website and partner portal.

## Stack

- Next.js App Router
- Supabase Auth, Postgres, Storage, Realtime
- Vercel AI Gateway for admin-only import and resort SEO assistance
- Resend or SMTP for notifications
- Vercel deployment target

## Environment

Copy `.env.example` to `.env.local` and set:

- `APP_ENV`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

See `ENVIRONMENT_VARIABLES.md` for optional integrations and the separate staging/production values.

## Current scaffold

- public marketing pages
- partner portal shell
- admin portal shell
- typed environment and Supabase helpers
- starter validation schemas
- initial SQL schema for resorts, partners, resources, chat, import staging, RBAC, and settings

## Deployment targets

The same GitHub repository deploys to separate staging and production Vercel projects. See `DEPLOYMENT_WORKFLOW.md` and `ENVIRONMENT_VARIABLES.md` for the required project-specific configuration.

## Important security note

Do not commit the direct database connection string or any rotated production secret to the repository. The database password shared in chat should be rotated inside Supabase before launch.
