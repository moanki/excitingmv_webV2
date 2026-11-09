---
name: Exciting Maldives
description: Incumbent identity with a reference-led opening calendar and a scoped content editor.
colors:
  brand-paper: "#f8f5f0"
  brand-navy: "#0f172a"
  brand-teal: "#4fd1c5"
  brand-gold: "#e8b44b"
  white: "#ffffff"
  opening-ink: "#123638"
  opening-muted: "#526e70"
  opening-accent: "#137b7c"
  opening-gold: "#b89b53"
  opening-ground: "#f4f6f5"
  opening-line: "#d9d2c6"
  cal-ink: "#203333"
  cal-muted: "#5d6c6d"
  cal-line: "#dce3e3"
typography:
  opening-display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.75rem, 4.2vw, 3.5rem)"
    fontWeight: 100
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  opening-card-title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "16.5px"
    fontWeight: 500
    lineHeight: 1.22
  opening-card-body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    lineHeight: 1.7
  cal-body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
rounded:
  opening-card: "21px"
  opening-card-mobile: "17px"
  opening-pill: "40px"
  cal-sheet: "9px"
  cal-button: "6px"
  cal-field: "5px"
spacing:
  opening-card-body: "25px 28px 18px"
  opening-card-body-mobile: "23px 20px 18px"
  cal-sheet: "24px"
components:
  opening-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.opening-ink}"
    rounded: "{rounded.opening-card}"
  cal-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.cal-ink}"
    rounded: "{rounded.cal-field}"
    padding: "10px 11px"
  cal-button-secondary:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.cal-button}"
    padding: "8px 13px"
---

# Design System: Exciting Maldives

## Overview

**Creative North Star: "The Opening Calendar"**

This documents an extension of the established Exciting Maldives identity. Preserve the logo, Playfair Display/Inter pairing, public navigation and footer, and existing admin shell. The supplied `A · Opening Calendar@2x.png` governs the composition of `/upcoming-resorts`; it does not authorize a redesign of other pages.

The public extension pairs a dark photographic teal hero with warm paper, serif dates and white image-and-copy cards. The admin extension uses the incumbent shell with restrained framed sheets and ordinary labelled fields. These route-specific treatments are documented separately from the global brand primitives.

**Key Characteristics:**
- Photographic lagoon hero and restrained gold accents.
- Year-grouped vertical timeline with paired image and content cards.
- Practical, labelled editing inside the existing admin identity.

Evidence: `PRODUCT.md`, the direction contract in `docs/upcoming-resorts.md`, `app/layout.tsx`, `app/globals.css`, `app/upcoming-resorts/upcoming-resorts.css`, and `app/admin/upcoming-resorts/calendar-editor.css`. This is a scoped implementation record, not a complete audit of legacy pages.

## Colors

### Primary

The incumbent brand teal and gold remain global primitives. The calendar uses its own muted lagoon accent for timeline markers, dark ink for text, and restrained gold for focus and editorial emphasis. These are the `opening-*` tokens, scoped to the opening-calendar surface.

### Neutral

Brand paper and navy remain the existing global values. The calendar uses the cool gray Resorts listing surface on desktop and mobile, with white cards. Only the guidance band uses sandy beige (`#eee9d9`). The `cal-*` ink, muted text and line tokens belong to the calendar editor, whose sheets sit on the existing admin canvas.

**The Scope Rule.** Apply opening and calendar-editor tokens only to their documented surfaces; retain existing page-specific palettes elsewhere.

## Typography

`app/layout.tsx` loads Inter through `--font-sans` and Playfair Display through `--font-serif`. The calendar banner uses the shared catalogue and Team title styles. Calendar dates, descriptions, controls, sources and editor fields use Inter. Year and guidance headings use the site's shared section styles; resort names use the catalogue's serif card scale.

The display and card-title roles above describe desktop defaults. From 769px to 900px the banner title is 1.95rem. At widths up to 768px, it uses `clamp(1.72rem, 7.4vw, 2rem)` with a 1.06 line height; resort titles are 14px. Editor text is 14px, with a 25px semibold toolbar title that becomes 22px up to 720px. Small source captions preserve full addresses and wrap anywhere rather than truncate.

## Layout

The public content wrapper is 80% wide with a 1320px cap; above 1700px its cap is 1440px. At 1000px it becomes 88%; at 650px it leaves 20px gutters. The desktop timeline assigns 21% to opening dates, then a 26px gap to cards; cards split imagery and copy 44/56. At 1000px those ratios become 18% and 40/60. At 650px the date moves above the stacked card, with a 22px inset for the timeline and a 1.65 image aspect ratio. Statistics change from four columns to two. Guidance changes from two columns to one.

The editor has a 1600px maximum width. Its desktop workspace pairs a 290px list and flexible detail sheet with a 28px gap. At 1100px the list becomes 240px and the gap 16px. At 720px list and sheet stack, the list scroll region caps at 245px, and form fields become one column. The route-scoped admin shell switches to full-width content and a collapsible navigation at 980px; it hides the desktop sidebar/topbar and gives the canvas 16px padding. This shell adaptation belongs only to the calendar editor.

## Elevation & Depth

Calendar cards and editor sheets use borders and surface contrast rather than drop shadows. Hero depth comes from photography beneath two dark gradient overlays. The circular timeline marker uses a ground-colored ring to clear the line behind it. Preserve the existing global shell's independent elevation treatments.

Card images scale to 1.025 on hover over 450ms with `cubic-bezier(.16,1,.3,1)`; jump links use a 180ms ease-out background transition. Reduced-motion preference disables transitions within the calendar.

## Shapes

Public cards use rounded, clipped image-and-copy containers; links and editorial status badges use pills. Editor sheets have smaller corners, compact rectangular buttons and lightly rounded fields. Do not transplant public card radii into the admin controls.

## Components

- **Year jump links:** outlined translucent hero pills, wrapping naturally; minimum height 48px desktop and 44px mobile. Gold 3px focus outline with 5px offset.
- **Resort card:** image, status, serif name, location, highlights, compact details and two source columns. Source addresses wrap; empty source links are omitted. The team action leads to the existing team page.
- **Opening status badge:** compact warm badge beside the date, distinct from the quieter card status line.
- **Editor actions:** dark teal publish action, outlined save action, visible disabled state and 2px teal focus outline. Buttons become at least 44px high up to 720px.
- **Editor fields and tabs:** labelled inputs, editable multiline text, horizontal tab overflow, and an underline plus stronger text for the selected tab. Fields become one column on mobile.

All public calendar text is database-backed and editable in the admin. Treat copy shown in previews as sample content, not a design-system default. Draft and published versions remain distinct; this visual record does not alter their workflow.

## Do's and Don'ts

- Do retain the incumbent logo, fonts, public navigation/footer and admin identity.
- Do follow the supplied opening-calendar reference for this calendar surface.
- Do keep full source addresses readable and mobile controls usable.
- Do preserve database-backed editable public text.
- Don't apply the calendar palette or composition across unrelated legacy pages.
- Don't replace labelled editor fields with a JSON editing interface.
- Don't turn uncertain opening targets into visually authoritative confirmed dates.
