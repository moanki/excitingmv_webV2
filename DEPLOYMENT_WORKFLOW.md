# Deployment Workflow

The same GitHub repository deploys to two separate Vercel projects.

| Branch | Vercel project | Supabase project | Purpose |
| --- | --- | --- | --- |
| `staging` | Personal `excitingmv-web-v2` | `ddelyhoaflwtlzjwtihq` | Testing and approval |
| `main` | Exciting Maldives client project | `rlbdzvblntcnyxhzlvll` | Production |

## Workflow

1. Create a feature branch from `staging`.
2. Implement and verify the change on the feature branch.
3. Merge the feature branch into `staging`.
4. Test the personal Vercel deployment against staging Supabase.
5. After approval, merge `staging` into `main`.
6. Confirm the Exciting Maldives Vercel project deploys `main` with production Supabase variables.

In Vercel, connect both projects to the same GitHub repository and set each project's production branch accordingly. Environment variables are configured per Vercel project, not in source control. See `ENVIRONMENT_VARIABLES.md`.

Before promoting to `main`, verify login, admin writes, media uploads, public content, email configuration, and any schema-dependent feature on staging.
