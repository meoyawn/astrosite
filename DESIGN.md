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
  link: "oklch(22.64% 0 0)"
  link-underline: "oklch(61.67% 0 0)"
  cv-link: "oklch(50% 0.134 242.749)"
  selection: "oklch(96.42% 0 0)"
  selection-ink: "oklch(24.35% 0 0)"
  navigation-ink: "oklch(37% 0.013 285.805)"
  cv-ink: "oklch(27.4% 0.006 286.033)"
  code-background: "#0d1117"
  code-foreground: "#e6edf3"
  code-punctuation: "#C9D1D9"
  code-comment: "#8B949E"
  code-identifier: "#79C0FF"
  code-keyword: "#FF7B72"
  code-string: "#A5D6FF"
  code-literal: "#D2A8FF"
  code-inline-background: "#f4f4f5"
  code-inline-ink: "#18181b"
  travel-blue: "#0369a1"
  travel-ink: "#07111f"
  travel-muted: "#687383"
typography:
  display:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "clamp(2.5rem, 9vw, 6rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  headline:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "clamp(2.5rem, 5.5vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  base:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "1.5rem"
    letterSpacing: "-0.01em"
  body:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "0px"
  content-link:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "inherit"
    fontWeight: 600
    lineHeight: "inherit"
    letterSpacing: "inherit"
  code:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "0px"
  title:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "0px"
  utility:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: "1.5rem"
    letterSpacing: "0px"
  brand:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  small:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    letterSpacing: "-0.15px"
  date:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    letterSpacing: "-0.15px"
  label:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: "1.25rem"
    letterSpacing: "0.05em"
rounded:
  none: "0px"
  focus: "2px"
  code: "0.5rem"
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
    textColor: "{colors.navigation-ink}"
    typography: "{typography.utility}"
    rounded: "{rounded.none}"
    padding: "0.5rem"
  locale-link:
    backgroundColor: "transparent"
    textColor: "{colors.navigation-ink}"
    typography: "{typography.utility}"
    rounded: "{rounded.none}"
    padding: "0.5rem"
  writing-row:
    backgroundColor: "{colors.background}"
    textColor: "{colors.heading-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0.5rem 0"
  prose-link:
    backgroundColor: "transparent"
    textColor: "{colors.link}"
    typography: "{typography.content-link}"
    rounded: "{rounded.none}"
    padding: "0"
  cv-contact:
    backgroundColor: "transparent"
    textColor: "{colors.cv-link}"
    typography: "{typography.utility}"
    rounded: "{rounded.none}"
    padding: "0"
  code-block:
    backgroundColor: "{colors.code-background}"
    textColor: "{colors.code-foreground}"
    typography: "{typography.code}"
    rounded: "{rounded.code}"
    padding: "1.25rem"
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

Bold system-sans titles connect the homepage, reading pages, CV, and navigation.
Semibold links, offset gray underlines, muted dates, and relaxed reading rhythm
keep the page open and approachable. Plain text navigation and pale gray text
selection carry the same restrained personality. The CV adds blue links to the
shared typography and keeps a compact print layout. Syntax highlighting and the
travel map retain their functional palettes.

**Key Characteristics:**

- Flat white field with near-black zinc ink and a muted gray hierarchy.
- Bold system-sans display and reading titles with a consistent navigation hierarchy.
- Semibold black content links and clearly offset underlines identify destinations.
- Narrow reading measures, with fixed homepage gutters and responsive prose gutters.
- Plain, keyboard-visible multilingual links rather than chips or controls.
- A small monochrome timepiece, with motion paused when hidden or unwanted.

The shared type, navigation, link, and selection treatments were updated on
2026-10-30, following the
[Listenbox guide](https://listenbox.app/guides/import-youtube-as-a-podcast/).
Shared evidence lives in `src/styles/global.css`, `src/layouts/html-root.tsx`,
`src/layouts/site-shell.tsx`, and the navigation, locale, and writing-list
components in `src/app/`. Surface evidence lives in the home components,
`src/pages/writing/[...slug].tsx`, `src/app/cv/`, `src/app/travel/`, and
`vite.config.ts` for syntax-role mapping and `src/styles/global.css` for colors.
Frontmatter records observed values;
`cv-`, `code-`, and `travel-` prefixes limit their scope. Layout descriptions
record current behavior, not mandatory compositions for future routes.

## Colors

White and zinc neutrals carry the shared interface. Black content links use
weight and gray underlines for recognition. Blue identifies CV links and travel selection;
syntax colors distinguish technical meaning inside code.
Color names below refer to the normative frontmatter values.

### Primary

- **Heading Zinc** (`heading-ink`): Display titles, reading text, shell
  navigation, heading anchors, and writing titles.

### Secondary

- **Link Ink** (`link`): The shared near-black content-link color, defined as
  `--color-link` in `src/styles/global.css` and exposed through `text-link`.
  It applies to reading prose and homepage project links in every locale.
  The CV scopes this same role to its blue accent token.
- **Link Underline** (`link-underline`): A solid neutral gray, independent of
  text opacity, for persistent content-link underlines.
- **CV Blue** (`cv-link`): The sky accent for CV content and contact links.
  Weight, underline, and focus behavior remain shared with the rest of the site.
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
- **Quiet Zinc** (`quiet-ink`): Publication dates and supporting metadata.
- **Navigation Ink** (`navigation-ink`): Utility, profile, and locale links at rest.
- **Faint Zinc** (`faint-ink`): Heading-anchor markers and the timepiece spring.
- **Rule Zinc** (`rule`): Dividers between grouped information.
- **Focus Ink** (`focus-ink`): Global keyboard outlines.
- **Selection / Selection Ink** (`selection`, `selection-ink`): Listenbox's pale
  neutral-gray highlight and dark selected text.
- **Date Gray** (`date`): The custom `--color-date` token for CV date and location metadata.
- **CV Ink** (`cv-ink`): The CV's professional subtitle.
- **Code Field / Code Foreground** (`code-background`, `code-foreground`):
  Dark code containers and unclassified text. Highlighted punctuation has its
  separate configured token.
- **Inline Code** (`code-inline-background`, `code-inline-ink`): A pale neutral
  surface and dark text for short identifiers inside prose.
- **Travel Ink / Travel Muted** (`travel-ink`, `travel-muted`): Place headings,
  date previews, and supporting map status or tooltip text.

### Named Rules

**The Ink First Rule.** Keep body and primary reading text near-black on white;
muted color is reserved for metadata and supporting utility text.

**The Functional Accent Rule.** Content links use semibold text and clear
underlines: black for reading pages and homepage projects, blue for the CV.
Navigation, locale switches, writing-index titles, and heading anchors retain
their own hierarchy. Keep code and travel colors attached to their documented roles.

## Typography

**Display Font:** Tailwind's system `font-sans` stack, shared by the homepage,
reading titles, CV, brand, and body text. No serif role is currently used.

**Body Font:** Tailwind's system `font-sans` stack, recorded in the base and
reading tokens, including system emoji fallbacks.

**Label/Mono Font:** Labels share sans; code uses the system `font-mono` stack.
There are no loaded webfonts. The travel stylesheet currently names `Inter`
before system fallbacks; this legacy declaration is an implementation exception,
not permission to add a font dependency.

**Character:** Native, direct, and approachable. Bold sans titles establish
hierarchy; relaxed prose supports sustained reading across pages and the CV.

### Hierarchy

- **Display:** The bold, balanced homepage title, scaling from 40px to 96px with
  1.04 leading and tight tracking.
- **Headline:** The shared bold sans h1 for reading pages, including writing,
  work together, now, and the CV. `text-reading-title` scales from 40px to 64px, with
  1.12 leading, `tracking-tight`, and balanced wrapping. Articles use this same
  role without a separate size override.
- **Title:** Semibold 18px recent-writing titles, with normal tracking and a
  hover-revealed underline.
- **Base:** Default body typography and inherited tracking. Descendants inherit
  the computed tracking length unless they explicitly override it.
- **Body:** Reading prose uses unitless 1.8 leading (30.6px at 17px), exposed as
  `leading-reading`, and normal tracking. The homepage project sentence uses
  tighter leading (24px) and
  reduces its size below `sm` (16px).
- **Content Link:** Semibold at the surrounding text size, shared across reading
  prose, homepage projects, and the CV. Only the CV link color differs.
- **CV:** Uses the shared Headline and Body roles on screen. Section headings
  use h2; role, education, and award headings use h3. Print has explicit density
  overrides for a compact document layout.
- **Brand:** Bold 18px site-title link, with tight tracking.
- **Utility:** Semibold 15px navigation, profile, locale, and CV contact links;
  current navigation links become bold.
- **Small:** Supporting metadata. Article publication dates use this size with
  medium weight and looser leading (24px).
- **Date:** Smaller recent-writing dates, with tabular numerals.
- **Label:** Uppercase recent-writing label, semibold and deliberately tracked out.
- **Code:** System monospace at 15px/1.6 with medium weight and normal tracking.
  Inline code stays at 0.875em, also medium weight, with a pale background and
  no decorative backticks. Preserve whitespace and indentation in blocks.

### Named Rules

**The Reading Type Rule.** Use bold system sans for display and reading titles.
The CV shares the same screen typography and reading measure; blue links are
its accent. Compact print typography is a deliberate medium-specific exception.

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
token with a 60px override below `sm`. Navigation stacks the brand above the
utilities below `sm`; at wider sizes the utilities can wrap alongside it.
Locale links remain together.

The main content is a grid item in a single-column wrapper. This contains
WebKit's native selection painting to selected text lines instead of filling
page margins and paragraph gaps. Print restores normal block flow for pagination.

The CV uses the same centered reading measure and gutters as article pages.
Contact links change from one column to two at `sm`; organization rows reserve
a logo column and let text shrink and wrap. Print removes navigation, width
constraints, and outer spacing, reduces body text to
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
container. Content, navigation, and writing-row underlines use the browser's
automatic thickness and a 4px offset. Keyboard focus is a
2px Focus Ink outline, offset 4px, with the focus radius. This is distinct
from hover and remains visible across shared components.

Code blocks use the code radius. CV organization images are square crops
(48px, reduced to 32px in print) with separate screen and print radii. Travel
thumbs and focus dots are circles; tooltips use the travel-tooltip radius,
while the date preview has its own smaller curve (0.35rem). These shapes do
not define a general card or pill system.

## Components

### Navigation

A bold site-title link accompanies Work together/CV utilities. Navigation,
homepage profiles, and locale links share `NavigationLink`: 15px semibold text,
44px minimum height, 8px padding, and an underline revealed on hover or current
state. Current links become bold. Backgrounds remain transparent with no pill
shapes. Keyboard focus uses the shared outline.

The brand stacks above the utility group below `sm`. The group has 16px
horizontal gaps and 8px row gaps; links within a list have a 4px gap.
There is no hamburger menu. Homepage profiles form a centered row.

### Locale links

Three plain links, EN/RU/TT, with a 2px gap between padded targets. They share
the navigation treatment: the current locale becomes bold and underlined.
Hover darkens the ink and reveals the gray underline.
Locale switching appears on the home, consulting, and CV surfaces. The
homepage separates it from profile links with a one-pixel vertical rule.

### Recent writing rows

A date and title form one block link. Compact vertical padding comes from
the writing-row token, with a 2px gap after the date. Dates use the Date role;
titles use Title. The title's underline is transparent at rest and visible
when the row is hovered. Keyboard focus outlines the entire link. Rows have
no card backgrounds or dividers; spacing gives the list its rhythm.

### Prose links and anchors

Content links use semibold Link Ink with a persistent gray underline, offset by
4px. Thickness follows the browser's automatic text-decoration sizing. The
underline uses Link Underline at rest and becomes full current color on hover.
Homepage project links share this treatment. The CV scopes `--color-link` to
`--color-cv-link`, preserving the same semibold weight and underline behavior
with a blue accent across every locale.

Heading fragment links are block-level, inherit heading color and weight, and
reveal a muted # marker just outside the text on hover or keyboard focus.
Hover also reveals the underline; focus adds an outline.
Underline-color and marker-opacity transitions use the sidecar's default link timing.
Content-link underline transitions turn off when reduced motion is requested.
Document scrolling is smooth, switching to automatic with reduced motion.

### CV contacts and organization rows

Contact links pair a fixed monochrome icon (16px) with wrapping blue text.
They use semibold weight and an 8px gap, reducing to 6px in print. Contact text
is 15px on screen and 12px in print. Organization rows pair
a logo with role, company, dates, location, and prose. Their screen grid is
48px plus flexible text with a 16px gap; print uses 32px and a 10px gap.
Dates and locations stay visually subordinate. Blue links remain underlined.

### Code blocks

Dark containers retain the original cool syntax palette, with medium-weight
system monospace at 15px/24px, normal tracking, 20px padding, and 8px corners.
Syntax colors come from shared CSS tokens; Shiki maps grammatical roles to
those tokens. Long lines scroll horizontally and preserve indentation.
Inline code uses medium-weight monospace on a pale neutral surface, with no
decorative backticks. Long inline identifiers wrap within the reading column;
code blocks retain their indentation and horizontal scrolling. Quotes, tables,
and lists retain their document styling.

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
- Do use shared link tokens across locales, with the documented CV accent.
- Do keep text selection within selected lines in WebKit and Chromium.
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
- Don't replace the CV's shared screen typography with a separate type system.
- Don't replace the homepage timepiece with a broad decorative animation system.
- Don't promote one route's composition into a requirement for every page.
