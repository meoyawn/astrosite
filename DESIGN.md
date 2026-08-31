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
  cv-link: "oklch(58.8% 0.158 241.966)"
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
    lineHeight: 1.75
    letterSpacing: "-0.01em"
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
    letterSpacing: "0"
  small:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    letterSpacing: "0"
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: "1.25rem"
    letterSpacing: "0.05em"
rounded:
  none: "0"
  focus: "2px"
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
---

# Design System: Astrosite

## Overview

**Creative North Star: "The Working Index"**

Astrosite is a sparse author index for shipped software and recent technical
thinking. It uses a white field, near-black zinc ink, and a quiet hierarchy so
the author's work remains legible without portfolio ceremony. Type, links, and
space carry the identity; there is no decorative layer competing with reading
or search clarity.

The system pairs a system-serif display voice with system-sans prose and utility
text. Plain underlines, one-pixel rules, muted dates, and restrained responsive
spacing provide structure while keeping the page close to a well-set document.
The shared shell is text-first and multilingual, with route-specific surfaces
remaining free to express their own interaction needs without changing the
global author-index language.

**Key Characteristics:**

- Flat white field with near-black zinc ink and a muted gray hierarchy.
- System-serif display type with system-sans prose, utility, and metadata text.
- Underlined text links and one-pixel rules provide state and separation.
- Narrow reading measures with responsive 20px and 32px gutters.
- Plain, keyboard-visible multilingual links rather than chips or controls.

## Colors

The palette is near-monochrome: white and zinc neutrals carry the interface,
with blue reserved for the CV's link-heavy prose treatment.

### Primary

- **Heading Zinc** (`oklch(21% 0.006 285.885)`): Headings, shell navigation,
  project links, and writing titles use this near-black zinc instead of a
  saturated brand color.

### Secondary

- **CV Sky** (`oklch(58.8% 0.158 241.966)`): The CV's `prose-sky` links use this
  functional blue for product, company, education, and award references.

### Neutral

- **White Field** (`#ffffff`): The page and content background.
- **Ink Zinc** (`oklch(14.1% 0.005 285.823)`): The default body ink from
  `text-zinc-950`.
- **Muted Zinc** (`oklch(44.2% 0.017 285.786)`): Supporting copy, section labels,
  and other secondary text from `text-zinc-600`.
- **Quiet Zinc** (`oklch(55.2% 0.016 285.938)`): Dates and quiet utility links
  from `text-zinc-500`.
- **Faint Zinc** (`oklch(70.5% 0.015 286.067)`): The subtle heading-anchor marker
  color from `text-zinc-400`.
- **Rule Zinc** (`oklch(92% 0.004 286.32)`): One-pixel borders and dividers from
  `border-zinc-200`.
- **Focus Ink** (`#18181b`): Selection and keyboard focus treatment.
- **Date Gray** (`#6b7280`): The named `--color-date` token used by CV date
  metadata.

### Named Rules

**The Ink First Rule.** Keep body and primary reading text near-black on white;
muted color is reserved for metadata and supporting utility text.

**The Functional Accent Rule.** Blue is evidence-bearing CV link affordance,
not a decorative fill or general brand accent.

## Typography

**Display Font:** Tailwind `font-serif` (`ui-serif, Georgia, Cambria, "Times
New Roman", Times, serif`)

**Body Font:** Tailwind `font-sans` (`-apple-system, BlinkMacSystemFont,
"Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif`, with
the system emoji fallbacks)

**Label/Mono Font:** No distinct label face; code uses the Tailwind system
`font-mono` stack where rendered by the writing pipeline.

**Character:** The pairing is native, practical, and quietly editorial. Serif
is a deliberate signal for large page titles; sans keeps navigation, prose,
dates, and project metadata familiar and fast to scan.

### Hierarchy

- **Display** (400, `clamp(2.3rem, 9vw, 6rem)`, `0.96`): The large serif index
  title.
- **Headline** (400, `clamp(3.25rem, 8vw, 4.75rem)`, `0.98`): Inner-route serif
  `h1` headings in the shared prose shell.
- **Title** (500, `1.125rem`, `1.5rem`): Recent-writing titles, with `-0.01em`
  tracking and a hover-revealed underline.
- **Body** (400, `1.0625rem`, `1.75`): Long-form shell prose. The default page
  body establishes `15px` text, `24px` line-height, and `-0.01em` tracking;
  reading surfaces widen the type slightly for sustained reading.
- **Utility** (400, `0.9375rem`, `1.5rem`): Shared shell navigation and brand
  links.
- **Label** (600, `0.8125rem`, `1.25rem`, `0.05em`, uppercase): The recent-writing
  section label.
- **Small** (400, `0.875rem`, `1.25rem`): Locale links and quiet profile links;
  dates use the same size with tabular numerals where needed.

### Named Rules

**The Serif Signal Rule.** Use the system serif for display and inner-page
headings; keep utility text, prose, titles, and metadata in the system sans.

## Layout

The site uses a centered max-width model with Tailwind utilities as the layout
source of truth. The outer page measure is `64rem` (`max-w-5xl`), with `1.25rem`
horizontal gutters on narrow screens and `2rem` from the `sm` breakpoint
(`640px`). Shared prose and shell content use a `48rem` (`max-w-3xl`) measure;
the recent-writing list uses a narrower `42.5rem` (`680px`) measure.

The shell header and content follow responsive clamp-based vertical spacing. The
navigation is a wrapping flex row with a compact utility group, and locale links
stay inline with plain text. The writing list uses a single vertical column;
rows are separated by rhythm and link state rather than cards. CV content is
print-aware and uses its own print density while retaining the same typography
and link language.

## Elevation & Depth

The global shell and reading surfaces are flat: they use no shadows, gradients,
or layered cards. Depth comes from whitespace, one-pixel rules, near-black versus
muted ink, and underlines that reveal state. The interactive travel island has
scoped map-control styling of its own; those surface-local shadows and colors
are deliberately not global primitives.

### Named Rules

**The Flat by Default Rule.** Keep shell and prose surfaces flat. Use spacing,
rules, type weight, and link state to establish hierarchy before adding any
surface treatment.

## Shapes

The text system has a square, document-like silhouette: shell links, locale
links, writing rows, and prose links have no radius and no filled container.
Underlines are one pixel, offset `3px`, with a muted decoration at rest where
the implementation uses `hover-underline`. Rules are one pixel in Rule Zinc.

Keyboard focus is explicit and consistent: a `2px` Focus Ink outline with a
`4px` offset and a `2px` radius. There is no clipping, pill geometry, or chip
language in the shared author index.

## Components

### Navigation

The shared shell navigation is a text-first flex row. The site-title brand and
Consulting/CV links use `0.9375rem` system-sans text, near-black ink, a muted
one-pixel underline at rest, and a current-color underline on hover. The active
route keeps the underline and adds medium weight. The group wraps on narrow
screens with `1rem` horizontal gaps and `0.625rem` row gaps; the wider layout
uses `1.5rem` gaps.

### Locale links

Locale switching is plain text (`EN`, `RU`, `TT`) in a three-item inline list.
Links are `0.875rem`, quiet zinc, and have no container or border. The current
locale becomes near-black with a one-pixel underline and `3px` offset; hover
only changes the text to near-black. The list gap is `0.75rem`.

### Recent writing rows

The recent-writing list is a narrow, single-column index. Each row is a block
link with `0.375rem` vertical padding; its date is `0.8125rem`, `1.25rem`
line-height, quiet zinc, and tabular numerals. The title is `1.125rem`, medium
weight, `1.5rem` line-height, and `-0.01em` tracking. Its underline is hidden at
rest and resolves to current color when the row is hovered.

### Prose links and focus

Normal prose links use the shared `hover-underline` treatment: one-pixel
underline, `3px` offset, decoration mixed from `25%` current color at rest, and
full current color on hover. Global keyboard focus uses the Focus Ink outline
with a `4px` offset. Heading anchors in prose additionally reveal a muted `#`
marker on hover or focus without changing the surrounding heading weight.

## Do's and Don'ts

- Do use Tailwind `font-serif`, `font-sans`, and `font-mono` system stacks; do
  not add font packages, remote font stylesheets, or `@font-face` rules.
- Do let Tailwind utilities own component layout, spacing, typography, color,
  responsive behavior, and interaction states.
- Do keep the field white, the reading ink near-black, and muted tones for
  dates, labels, and supporting links.
- Do use one-pixel underlines, rules, and the shared focus treatment to express
  state.
- Do preserve the `20px`/`32px` responsive gutters and the `42.5rem` recent
  writing measure where those patterns apply.
- Do keep language switching as accessible, underlined text rather than chips.
- Don't add generic SaaS hero panels, portfolio ceremony, gradient text, glass
  surfaces, or ornamental imagery to the text-first shell.
- Don't add cards, shadows, pills, or invented buttons and inputs where the
  shipped surface has no such primitive.
- Don't use low-contrast gray for body copy or treat a functional CV accent as
  decoration.
- Don't promote a single route's composition into a global component rule; use
  the matching surface brief for route-specific structure.
