# GSAP scroll experiment

This branch starts at the exact testing deployment revision `bca2127af8039cdb7ac1cc36b42a2339be448b58`. It is a standalone visual comparison and should stay on `experiment/gsap-scroll-animation`.

Adjust distances, opacity, duration, scrub and stagger in `components/experiment-scroll-presets.ts`. Desktop has the homepage scrub and detail image parallax; touch/mobile gets short reveals. Reduced motion skips loading GSAP. The enhancement adds no wrapping markup and cleans up on navigation.

Only deploy to the **Preview** environment of the independent `excitingmv-gsap-experiment` Vercel project. Automatic Git deployments are disabled for this branch so a push cannot start builds on the two projects connected to this repository. Use an explicit Preview deployment from the clean experiment worktree.

The Preview environment needs these settings:

- `NEXT_PUBLIC_APP_URL`: an HTTPS URL for the isolated project.
- `NEXT_PUBLIC_SUPABASE_URL`: `https://ddelyhoaflwtlzjwtihq.supabase.co` (staging only).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `preview-no-auth` (placeholder; browser auth is disabled).
- `EXPERIMENT_STAGING_READ_KEY`: the server-only staging credential for reading published content. Set as a sensitive Preview variable. Do not set the ordinary service-role variable or add email, integration or production credentials.

The application pins the data endpoint to staging, allows only table reads from the server Supabase client, rejects submissions and server actions, and ignores authentication cookies. Existing login and form views can be reviewed, and protected areas stay locked. No migrations are needed.
