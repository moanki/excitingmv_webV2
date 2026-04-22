# Exciting Maldives Web V2

Production starter for the Exciting Maldives luxury B2B website and partner portal.

## Stack

- Next.js App Router
- Supabase Auth, Postgres, Storage, Realtime
- OpenAI for admin-only import and SEO assistance
- Resend or SMTP for notifications
- Vercel deployment target

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY` or `GOOGLE_API_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NOTIFICATION_EMAIL`
- `SAMOA_EXTERNAL_URL`

## Current scaffold

- public marketing pages
- partner portal shell
- admin portal shell
- typed environment and Supabase helpers
- starter validation schemas
- initial SQL schema for resorts, partners, resources, chat, import staging, RBAC, and settings

## Deployment targets

- GitHub: `https://github.com/moanki/excitingmv_webV2`
- Vercel: `https://excitingmv-web-v2.vercel.app`
- Vercel deployment: `https://excitingmv-web-v2-m55z1vanl-monkeemoan-4647s-projects.vercel.app`
- Supabase: `https://ddelyhoaflwtlzjwtihq.supabase.co`

## Important security note

Do not commit the direct database connection string or any rotated production secret to the repository. The database password shared in chat should be rotated inside Supabase before launch.
