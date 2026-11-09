# Upcoming resort calendar

Public route: `/upcoming-resorts`. Admin: `/admin/upcoming-resorts` (Content → Upcoming Resorts).

The `site.upcomingResorts` row in the existing `site_settings` table stores the entire page as draft/published content, including SEO, hero, images, labels, statistics, year sections, guidance and resort cards. There is no runtime seed or static content fallback. Missing or disabled content returns 404; database failures surface as errors. Existing settings continue to manage the global navigation, footer and Team page.

Staff can add, duplicate, hide, reorder and remove resorts, add/reorder year sections, edit free-text opening statuses, and upload or select media. Dates support a year, exact optional launch day and separate display wording. Exact days must match the opening year. Statistics can calculate from visible entries or use an editorial override. Empty official/source URLs hide those links; populated URLs display their full address. Publishing is explicit; saving a draft preserves the public version. Revision checks reject stale edits.

Initial content and the image-source manifest are local deployment artifacts under `.vercel/`, not application defaults. The content was initialized only in testing Supabase `ddelyhoaflwtlzjwtihq`. No schema migration is required.

The **Feature on homepage** tab controls the section below the homepage stats. Publishing displays every selected resort that is visible on the published calendar. The collage arranges the selected resorts in list order and adapts to the available space. If none are featured, the section shows an editable link to the calendar.

## Direction contract

THESIS: The provided opening calendar is the composition authority: opening targets form a readable year-by-year timeline.

OWN-WORLD: Inherit Playfair Display/Inter, dark lagoon ink, muted teal, warm ivory, restrained gold and the existing global navigation/footer. White image-and-copy cards align with a vertical timeline.

STORY: Scan the launch window, read brief highlights, inspect the official/source URLs, then ask the team. Staff edit ordinary labelled fields, not JSON.

FIRST VIEWPORT: Full-width photographic hero with left-aligned serif title, year line, introduction and year jump links. The next year heading appears immediately below. An empty statistics list leaves no strip or gap. Mobile stacks cards and keeps all links visible.

FORM: Supplied reference, no random public-page direction substituted. Admin framed-sheet direction seed 1544730287, adapted within the incumbent shell. Signature interaction: jump directly to a year. Motion is limited to hover feedback and respects reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
