---
name: Astrosite
description: A sparse personal index for shipped software and recent technical writing.
colors:
  background: "#ffffff"
  ink: "oklch(14.1% 0.005 285.823)"
  heading-ink: "oklch(21% 0.006 285.885)"
  muted-ink: "oklch(44.2% 0.017 285.786)"
  quiet-ink: "oklch(55.2% 0.016 285.938)"
  faint-ink: "oklch(70.5% 0.015 286.067)"
  rule: "oklch(92% 0.004 286.32)"
  focus-ink: "#18181b"
  date: "#6b7280"
  cv-link: "oklch(50% 0.134 242.749)"
  cv-ink: "oklch(27.4% 0.006 286.033)"
  code-background: "#0d1117"
  code-foreground: "#e6edf3"
  code-punctuation: "#C9D1D9"
  code-comment: "#8B949E"
  code-identifier: "#79C0FF"
  code-keyword: "#FF7B72"
  code-string: "#A5D6FF"
  code-literal: "#D2A8FF"
  travel-blue: "#0369a1"
  travel-ink: "#07111f"
  travel-muted: "#687383"
typography:
  display:
    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
    fontSize: "clamp(2.3rem, 9vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: "-0.03em"
  headline:
    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
    fontSize: "clamp(3.25rem, 8vw, 4.75rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  base:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "1.5rem"
    letterSpacing: "-0.01em"
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: "1.75rem"
    letterSpacing: "-0.15px"
  article-title:
    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  cv-body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.15px"
  code:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    fontSize: "0.875em"
    fontWeight: 400
    lineHeight: 1.7142857
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: "1.5rem"
    letterSpacing: "-0.01em"
  utility:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.5rem"
    letterSpacing: "-0.15px"
  small:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    letterSpacing: "-0.15px"
  date:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    letterSpacing: "-0.15px"
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: "1.25rem"
    letterSpacing: "0.05em"
rounded:
  none: "0px"
  focus: "2px"
  code: "0.375rem"
  cv-logo: "0.75rem"
  cv-logo-print: "0.25rem"
  travel-tooltip: "0.5rem"
spacing:
  unit: "0.25rem"
  narrow-gutter: "1.25rem"
  wide-gutter: "2rem"
  text-gap: "1.25rem"
  group-gap: "1.5rem"
  recent-max: "42.5rem"
  prose-max: "48rem"
  page-max: "64rem"
  shell-top: "clamp(4.5rem, 9vw, 7rem)"
components:
  site-nav:
    backgroundColor: "transparent"
    textColor: "{colors.heading-ink}"
    typography: "{typography.utility}"
    rounded: "{rounded.none}"
    padding: "0"
  locale-link:
    backgroundColor: "transparent"
    textColor: "{colors.quiet-ink}"
    typography: "{typography.small}"
    rounded: "{rounded.none}"
    padding: "0"
  writing-row:
    backgroundColor: "{colors.background}"
    textColor: "{colors.heading-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0.375rem 0"
  prose-link:
    backgroundColor: "transparent"
    textColor: "{colors.heading-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0"
  cv-contact:
    backgroundColor: "transparent"
    textColor: "{colors.cv-link}"
    rounded: "{rounded.none}"
    padding: "0"
  code-block:
    backgroundColor: "{colors.code-background}"
    textColor: "{colors.code-foreground}"
    typography: "{typography.code}"
    rounded: "{rounded.code}"
    padding: "0.8571429em 1.1428571em"
  home-timepiece:
    backgroundColor: "transparent"
    textColor: "{colors.heading-ink}"
    width: "4.5rem"
    height: "3.5rem"
  travel-visit:
    backgroundColor: "transparent"
    textColor: "#445064"
    padding: "0.12rem 0"
  travel-visit-active:
    backgroundColor: "transparent"
    textColor: "{colors.travel-blue}"
    padding: "0.12rem 0"
  travel-timeline:
    backgroundColor: "transparent"
    textColor: "{colors.travel-ink}"
---

# Design System: Astrosite

## Overview

**Creative North Star: "The Working Index"**

Astrosite is a sparse author index for shipped software and recent technical
thinking. It uses a white field, near-black zinc ink, and a quiet hierarchy so
the author's work remains legible without portfolio ceremony. Type, links, and
space carry the identity. A small mechanical timepiece above the homepage title
adds a restrained moving signature without taking over the reading surface.

The system pairs system-serif display type with system-sans prose and utility
text. Plain underlines, one-pixel rules, muted dates, and restrained responsive
spacing keep the page close to a well-set document. The CV is a denser sans-serif
document; syntax highlighting and the travel map have functional palettes and
interaction needs of their own.

**Key Characteristics:**

- Flat white field with near-black zinc ink and a muted gray hierarchy.
- System-serif display type with system-sans prose, utility, and metadata text.
- Underlined text links and one-pixel rules provide state and separation.
- Narrow reading measures, with fixed homepage gutters and responsive prose gutters.
- Plain, keyboard-visible multilingual links rather than chips or controls.
- A small monochrome timepiece, with motion paused when hidden or unwanted.

This refresh records current source and the local site inspected on 2026-09-14.
Shared evidence lives in `src/styles/global.css`, `src/layouts/html-root.tsx`,
`src/layouts/site-shell.tsx`, and the navigation, locale, and writing-list
components in `src/app/`. Surface evidence lives in the home components,
`src/pages/writing/[...slug].tsx`, `src/app/cv/`, `src/app/travel/`, and
`vite.config.ts` for syntax colors. Frontmatter records observed values;
`cv-`, `code-`, and `travel-` prefixes limit their scope. Layout descriptions
record current behavior, not mandatory compositions for future routes.

## Colors

White and zinc neutrals carry the shared interface. Blue identifies CV links
and travel selection; syntax colors distinguish technical meaning inside code.
Color names below refer to the normative frontmatter values.

### Primary

- **Heading Zinc** (`heading-ink`): Display titles, reading text, shell
  navigation, and writing titles. Homepage project links inherit Muted Zinc
  from their supporting sentence.

### Secondary

- **CV Sky** (`cv-link`): The darker sky tone explicitly applied to CV contact,
  product, company, education, and award links. It overrides the typography
  plugin's default sky link color.
- **Travel Blue** (`travel-blue`): Selected stays, timeline fill and thumb,
  and keyboard focus within the travel island.
- **Code syntax** (`code-*`): Identifier blue also covers attributes and types;
  keyword coral also covers operators; literal violet also covers tags.
  Pale blue marks strings, muted gray marks comments, and light gray marks
  punctuation. These belong to the configured GitHub Dark code treatment.

### Neutral

- **White Field** (`background`): Page and content background.
- **Ink Zinc** (`ink`): Base body ink and primary CV headings.
- **Muted Zinc** (`muted-ink`): Supporting copy, section labels, and location text.
- **Quiet Zinc** (`quiet-ink`): Dates, quiet profile links, and inactive locales.
- **Faint Zinc** (`faint-ink`): Heading-anchor markers and the timepiece spring.
- **Rule Zinc** (`rule`): Dividers and resting navigation underlines.
- **Focus Ink** (`focus-ink`): Global keyboard outlines and selection background;
  selected text becomes white.
- **Date Gray** (`date`): The custom `--color-date` token for CV date and location metadata.
- **CV Ink** (`cv-ink`): CV body and subtitle.
- **Code Field / Code Foreground** (`code-background`, `code-foreground`):
  Dark code containers and unclassified text. Highlighted punctuation has its
  separate configured token.
- **Travel Ink / Travel Muted** (`travel-ink`, `travel-muted`): Place headings,
  date previews, and supporting map status or tooltip text.

### Named Rules

**The Ink First Rule.** Keep body and primary reading text near-black on white;
muted color is reserved for metadata and supporting utility text.

**The Functional Accent Rule.** Keep CV, code, and travel colors attached to
their documented information and interaction roles.

## Typography

**Display Font:** Tailwind's system `font-serif` stack, recorded in the display,
headline, and article-title tokens.

**Body Font:** Tailwind's system `font-sans` stack, recorded in the base and
reading tokens, including system emoji fallbacks.

**Label/Mono Font:** Labels share sans; code uses the system `font-mono` stack.
There are no loaded webfonts. The travel stylesheet currently names `Inter`
before system fallbacks; this legacy declaration is an implementation exception,
not permission to add a font dependency.

**Character:** Native, practical, and quietly editorial. Serif signals the
homepage display and prose-page title; sans supports scanning and sustained
reading. The CV keeps its name and every heading in sans.

### Hierarchy

- **Display:** The large, fluid, balanced homepage title.
- **Headline:** The fluid serif h1 in the default prose shell, including
  consulting and now. **Article Title** overrides its size while keeping the
  same serif, normal weight, tracking, and tight leading.
- **Title:** Medium-weight recent-writing titles with a hover-revealed underline.
- **Base:** Default body typography and inherited tracking. Descendants inherit
  the computed tracking length unless they explicitly override it.
- **Body:** Reading prose uses fixed leading from its token, not a unitless
  multiplier. The homepage project sentence uses tighter leading (24px) and
  reduces its size below `sm` (16px).
- **CV Body:** Denser sans prose with its own leading. The name is semibold
  (32px; 36px from `sm`), section titles are semibold (20px/28px), and role
  titles are semibold (18px with snug leading).
- **Utility:** Shared shell navigation and brand links.
- **Small:** Locale and quiet profile links. Article publication metadata uses
  this size with medium weight and looser leading (24px).
- **Date:** Smaller recent-writing dates, with tabular numerals.
- **Label:** Uppercase recent-writing label, semibold and deliberately tracked out.
- **Code:** Block monospace size is relative to its reading container. Inline
  code stays in the prose flow and uses the typography plugin's code treatment.

### Named Rules

**The Serif Signal Rule.** Use system serif for the homepage display and
prose-page h1; keep prose subheadings, the CV, utilities, and metadata in sans.

## Layout

Tailwind utilities are the layout source of truth. The homepage uses the page
measure and narrow gutter at every width. Its centered introduction leads into
the narrower, left-aligned recent-writing list. Below `sm`, top padding is
72px and the section gap is 48px. From `sm`, the page has a minimum height of
100svh, centers its contents vertically, uses 96px top padding, and scales the
section gap with viewport height (`clamp(3rem, 8svh, 5rem)`).

The shared prose shell uses the prose measure, including padding. It switches
from the narrow to the wide gutter at `sm` (640px). Header top padding scales
with viewport width (`clamp(2rem, 7vw, 5rem)`); main content uses the shell-top
token with a 60px override below `sm`. The navigation's utility group wraps
while the brand stays separate. Locale links remain inline.

The CV body is full-width with narrow gutters on mobile, 48px horizontal
margins from `sm`, and 64px margins from `md` (768px). Only its navigation is
centered in a prose-width container. Contact links change from one column to
two at `sm`; organization rows reserve a logo column and let text shrink and
wrap. Print removes navigation and outer spacing, reduces body text to
12px/1.35, keeps organization rows together, and uses two columns for contacts
and skills. Print names are 24px bold; section titles are 13.5px and role
titles are 13px bold.

The travel island fills the viewport and suppresses page scrolling. On wide
screens the timeline and place details overlay the upper left of the globe;
navigation moves toward the upper right from 1000px. At 820px and below, the
information becomes a top stack, the globe widens behind it, the timeline
touch track grows, and alternate year labels hide to preserve legibility.

## Elevation & Depth

The global shell and reading surfaces are flat, with no shadows, gradients,
or layered cards. Space, rules, ink hierarchy, and underlines establish depth.
Dark code blocks are reading containers, not elevated panels. The travel
island uses pale globe geometry and white gradient scrims to keep overlay text
readable; its shadows are surface-local exceptions.

### Shadow Vocabulary

- **Travel tooltip:** A diffuse shadow (`0 0.65rem 1.7rem rgb(15 23 42 / 12%)`)
  lifts route information above the map.
- **Travel date preview:** A smaller shadow (`0 0.35rem 1rem rgb(15 23 42 / 16%)`)
  separates the dark date label from the timeline.
- **Travel focus halo:** A soft ring (`0 0 0 0.34rem rgb(2 132 199 / 8%)`)
  surrounds the current-place dot.

### Named Rules

**The Flat by Default Rule.** Keep shell and prose surfaces flat. Use spacing,
rules, type weight, and link state to establish hierarchy before adding surface treatment.

## Shapes

Shared text links and writing rows have square silhouettes with no filled
container. Underlines are one pixel with a 3px offset. Keyboard focus is a
2px Focus Ink outline, offset 4px, with the focus radius. This is distinct
from hover and remains visible across shared components.

Code blocks use the code radius. CV organization images are square crops
(48px, reduced to 32px in print) with separate screen and print radii. Travel
thumbs and focus dots are circles; tooltips use the travel-tooltip radius,
while the date preview has its own smaller curve (0.35rem). These shapes do
not define a general card or pill system.

## Components

### Navigation

A text-first row with a site-title link and Consulting/CV utilities. Near-black
text uses pale resting underlines that darken on hover; the current page keeps
the dark underline and adds medium weight. The utility group wraps with 24px
horizontal gaps and 12px row gaps, reducing to 16px and 10px below `sm`.
There is no hamburger menu. The homepage uses its own centered profile row.

### Locale links

Three plain links, EN/RU/TT, with a 12px gap. Inactive locales use Quiet Zinc;
the current locale uses Heading Zinc and an underline. Hover darkens the ink.
Locale switching appears on the home, consulting, and CV surfaces. The
homepage separates it from profile links with a one-pixel vertical rule.

### Recent writing rows

A date and title form one block link. Compact vertical padding comes from
the writing-row token, with a 2px gap after the date. Dates use the Date role;
titles use Title. The title's underline is transparent at rest and visible
when the row is hovered. Keyboard focus outlines the entire link. Rows have
no card backgrounds or dividers; spacing gives the list its rhythm.

### Prose links and anchors

Prose links use an underline mixed from 25% current color at rest and full
current color on hover. Heading fragment links are block-level, inherit heading
color and weight, and reveal a muted # marker just outside the text on hover
or keyboard focus. Hover also reveals the underline; focus adds an outline.
Link-color and marker-opacity transitions use the sidecar's default link timing.
Document scrolling is smooth, switching to automatic with reduced motion.

### CV contacts and organization rows

Contact links pair a fixed monochrome icon (16px) with wrapping blue text.
They use medium weight and an 8px gap, reducing to 6px in print. Contact text
is 14px on mobile, 15px from `sm`, and 12px in print. Organization rows pair
a logo with role, company, dates, location, and prose. Their screen grid is
48px plus flexible text with a 16px gap; print uses 32px and a 10px gap.
Dates and locations stay visually subordinate. Blue links remain underlined.

### Code blocks

Dark, softly rounded containers with system monospace text and scoped syntax
colors. In the standard reading shell, the relative code token resolves to
14.875px text with 25.5px leading; padding scales with that type size. Long
lines scroll horizontally. Quotes, tables, lists, and inline code retain the
typography plugin's document styling rather than becoming independent cards.

### Homepage timepiece

A small, non-interactive inline SVG, sized by the home-timepiece token and
centered 8px above the title. Near-black outlines and a faint spring form two
mechanical wheels. The balance oscillates between -40 and 40 degrees over
two seconds; the driver advances in twelve steps over twelve seconds. The
client island synchronizes their phase, pauses them offscreen or in a hidden
tab, and fixes them at the initial frame when reduced motion is requested.
The artwork is hidden from assistive technology and never replaces page text.

### Travel visit buttons and timeline

Visit buttons are transparent, left-aligned dates with a bottom rule revealed
by hover or selection. Selection changes ink to Travel Blue and strengthens
weight; `aria-pressed` carries the state. Their focus outline uses Travel Blue
with a 5px offset. They are map controls, not general call-to-action buttons.

The timeline uses a three-pixel rail and blue fill with a white circular thumb
(24px, three-pixel blue border). Year ticks support scanning; the date preview
appears immediately during dragging and fades away with a small movement.
The Kobalte slider supplies pointer and keyboard behavior and a spoken date
and place value. The track is 1.2rem high on desktop and 2.75rem at 820px and
below. Map focus movements take 850ms, becoming immediate with reduced motion;
date-preview transitions also turn off for reduced motion.

## Do's and Don'ts

### Do:

- Do use Tailwind's system font-sans, font-serif, and font-mono stacks.
- Do let Tailwind utilities own component layout, spacing, typography, color, responsive behavior, and interaction states.
- Do keep the field white, reading ink near-black, and muted tones for supporting text.
- Do preserve distinct homepage, prose, CV, and travel layout behavior.
- Do use underlines, semantic current-state attributes, and visible keyboard focus.
- Do retain CV print density, wrapping contact text, and organization-row grouping.
- Do preserve reduced-motion behavior and pause the timepiece when hidden.
- Do keep local images under src and import them through Vite and solid-static/image.

### Don't:

- Don't add font packages, remote font stylesheets, or self-hosted webfonts.
- Don't add generic SaaS panels, gradient text, glass surfaces, or ornamental hero imagery to the text-first shell.
- Don't turn travel shadows, blue controls, or CV logo rounding into global component rules.
- Don't replace plain navigation or locale links with chips, pills, or invented buttons.
- Don't use muted metadata colors for sustained body reading.
- Don't treat article, CV, and default prose headings as one interchangeable type role.
- Don't replace the homepage timepiece with a broad decorative animation system.
- Don't promote one route's composition into a requirement for every page.
