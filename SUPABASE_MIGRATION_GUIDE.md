# Supabase Migration Guide

Git synchronizes application code only. It does not synchronize Supabase projects.

- Database rows do not copy automatically.
- Storage buckets and files do not copy automatically.
- Auth users and identities do not copy automatically.
- CMS content and uploads created in production must remain in production.

## Schema workflow

1. Add schema changes as versioned SQL files under `supabase/migrations/`.
2. Apply and test the migration against staging first.
3. Test all affected application flows on the staging Vercel deployment.
4. Back up production before a destructive or data-changing migration.
5. Apply the tested migration to production deliberately.
6. Verify constraints, indexes, RLS policies, Auth behavior, and application reads/writes.

Do not copy staging test data into production unless that transfer is intentional and reviewed. Data, Storage, or Auth migration work must use a separate verified migration process; merging Git branches is not a migration.

## Safety

- Never commit `.env` files, database passwords, JWT secrets, anon keys, or service-role keys.
- Never use the production service-role key in staging.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
- Prefer additive, reversible migrations and take a backup before destructive production changes.
