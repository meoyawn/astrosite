---
name: Astrosite
description:
  A prose-first personal technical site for writing, consulting, products, and
  CV evidence.
colors:
  background: "#ffffff"
  ink: "#09090b"
  primary: "#0f172a"
  secondary-text: "#334155"
  body-muted: "#52525b"
  metadata: "#71717a"
  date: "#6b7280"
  rule: "#e4e4e7"
  chip-border: "#cbd5e1"
  cv-link: "#0284c7"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.111
    letterSpacing: "0"
  headline:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0"
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: "0"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0"
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.714
    letterSpacing: "0"
rounded:
  none: "0"
  chip: "4px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  page-x: "24px"
  page-x-wide: "32px"
  section: "48px"
  header-wide: "64px"
components:
  hover-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0"
  locale-chip:
    backgroundColor: "{colors.background}"
    textColor: "{colors.secondary-text}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "4px 12px"
  locale-chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "4px 12px"
  writing-list-item:
    backgroundColor: "{colors.background}"
    textColor: "{colors.primary}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "16px 0"
  cv-icon-link:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0"
  cv-org-meta-link:
    backgroundColor: "transparent"
    textColor: "{colors.cv-link}"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
    rounded: "{rounded.none}"
    padding: "0"
---

# Design System: Astrosite

## 1. Overview

**Creative North Star: "The Plaintext Field Notebook"**

Astrosite is a calm technical notebook, not a portfolio campaign. The system
should feel like a working engineer's public record: plain page, strong titles,
compact navigation, readable prose, and just enough structure to make writing,
consulting context, products, and CV evidence easy to scan.

The visual language is intentionally flat. White space, text weight, dividers,
link underlines, and print-aware layout do the work that cards, shadows, hero
panels, and decorative imagery would normally try to do. This restraint serves
search clarity and long-form reading, while still leaving enough typographic
contrast for a visitor to understand hierarchy quickly.

The system explicitly rejects the PRODUCT.md anti-references: generic SaaS
landing-page patterns, decorative AI-generated editorial tropes, portfolio
gloss, and visual flourishes that compete with reading, search clarity, or
technical credibility.

**Key Characteristics:**

- Prose-first pages with narrow reading width and comfortable line-height.
- Dense but calm hierarchy: bold headings, medium navigation, muted dates.
- Flat surfaces: dividers and typographic weight replace cards and shadows.
- Multilingual parity: English, Russian, and Tatar pages keep the same
  structure.
- Print-aware CV: compact, readable, and low-chrome when printed.

## 2. Colors

The palette is restrained monochrome with one functional blue for CV prose links
and a single custom metadata gray.

### Primary

- **Slate Title** (`primary`): Used for headings, active language chips, active
  nav underlines, and high-emphasis links. It is the site's main visible accent
  because saturated brand color would compete with reading.

### Secondary

- **CV Sky** (`cv-link`): Used by the CV page through `prose-sky` and manual
  CV link classes. Keep it local to the CV surface or clearly link-heavy
  contexts.

### Neutral

- **White Page** (`background`): The body background. It keeps article pages
  direct and print-friendly.
- **Zinc Ink** (`ink`): The default body text color. It must remain near-black
  for long-form contrast.
- **Reading Slate** (`secondary-text`): Inactive language chip text and
  secondary UI text.
- **Muted Body Zinc** (`body-muted`): Teaser copy and supporting descriptions.
- **Metadata Zinc** (`metadata`): Article and writing-list dates that use
  Tailwind `text-zinc-500`.
- **Date Gray** (`date`): CV dates that use the project token defined in
  `src/styles/global.css` as `--color-date`.
- **Rule Zinc** (`rule`): Article list dividers and borders.
- **Soft Slate Border** (`chip-border`): Locale chip borders.

### Named Rules

**The Ink First Rule.** Body text stays near-black on white. Do not soften prose
into pale gray for elegance.

**The Accent Is Evidence Rule.** Color only appears when it carries state,
links, dates, or CV-specific link affordance. Do not add decorative accent
fills.

## 3. Typography

**Display Font:** system sans (`ui-sans-serif, system-ui, sans-serif`) **Body
Font:** system sans (`ui-sans-serif, system-ui, sans-serif`) **Label/Mono
Font:** none

**Character:** The type is practical and system-native. It favors speed,
readability, and platform familiarity over custom-brand display behavior.

### Hierarchy

- **Display** (800, `2.25rem`, `1.111`): Page and article `h1` text through
  Tailwind Typography. It should stay compact and readable, never hero-scale.
- **Headline** (700, `1.5rem`, `1`): Section headers such as the Writing list
  title.
- **Title** (600, `1.125rem`, `1.333`): Writing list titles and emphasized
  links.
- **Body** (400, `1rem`, `1.75`): Long-form article and page prose. Keep the
  prose measure around the existing `max-w-3xl` and Typography plugin rhythm.
- **Label** (500, `0.875rem`, `1.714`, no letter spacing): Dates, metadata, and
  language chips. Use tabular numbers for dates.

### Named Rules

**The Reading Is The Product Rule.** Do not introduce ornamental display faces,
italic editorial treatments, or tracked uppercase section labels. The writing
must remain the strongest signal.

**The No Negative Tracking Rule.** Letter spacing stays at `0`. This site does
not use compressed display typography.

## 4. Elevation

The system is flat. There are no shadows in the scanned source. Depth is
conveyed through vertical rhythm, typographic weight, dividers, active
underlines, and filled active language chips.

### Named Rules

**The No Shadow Rule.** Do not add card shadows, glass panels, or soft glow
effects. If a surface needs separation, use a divider, spacing, or a filled
state.

**The Divider Over Card Rule.** Writing lists use `border-y` and `divide-y`;
they are not card grids.

## 5. Components

### Buttons

No button system exists in the current code. Do not invent campaign buttons for
ordinary navigation. When an action truly needs a button, derive it from the
locale chip pattern: 4px radius, medium text, direct border or filled active
state.

### Chips

- **Style:** Locale chips use a small rounded rectangle (`4px`) with `1px`
  border, `4px 12px` padding, medium `0.875rem` text, and no shadow.
- **State:** Active chips fill with Slate Title and white text. Inactive chips
  stay white with Soft Slate Border and Reading Slate text.

### Cards / Containers

- **Corner Style:** No card radius is used for content containers.
- **Background:** Content stays on White Page.
- **Shadow Strategy:** No shadows.
- **Border:** Writing lists use Rule Zinc dividers. Locale chips use Soft Slate
  Border.
- **Internal Padding:** Repeated list rows use `16px 0`; page gutters use `24px`
  on narrow screens and `32px` from `sm`.

### Inputs / Fields

No input system exists in the current code. If fields are added later, keep them
flat, white, 4px radius, and visibly focused with border color instead of
shadow.

### Navigation

Navigation is compact and text-first. The main nav is a flex row with wrapping,
`16px` horizontal link gaps, `8px` row gaps, and `12px` between nav and locale
switcher. Current nav links use a 2px underline with `3px` offset. Inactive
links use the shared hover underline utility, which starts at 25% currentColor
and resolves to full currentColor on hover.

### Writing List

Writing rows are separated by top and bottom borders plus row dividers. Dates
are `0.875rem`, medium, tabular, and muted. Titles are `1.125rem`, semibold, and
underlined on hover. Teasers cap around `44ch`.

### CV Link Row

CV contact links use a 16px icon, `4px` icon-to-text gap, and direct text. The
contact grid uses one column by default and two columns from `sm`, with `32px`
column gap and `6px` row gap for breathing room. Print keeps the same two-column
shape with tighter `16px` column and `2px` row gaps. The CV content area is
print-aware and drops extra chrome through print utilities.

### CV Links

CV prose, product, company, education, and award links use CV Sky with the
shared `hover-underline` treatment. Company and award organization metadata
links use medium weight (`500`) to match Tailwind Typography prose links. Links
inside title/headline contexts inherit the surrounding title weight instead of
forcing a lighter link style.

## 6. Do's and Don'ts

### Do:

- **Do** keep long prose on a narrow measure with the existing `prose` rhythm.
- **Do** use `hover-underline` for normal prose and navigation links.
- **Do** preserve multilingual parity across English, Russian, and Tatar
  surfaces.
- **Do** use dividers and typographic weight before adding containers.
- **Do** keep CV changes print-readable, compact, and low-chrome.

### Don't:

- **Don't** use generic SaaS landing-page patterns.
- **Don't** use decorative AI-generated editorial tropes.
- **Don't** add portfolio gloss.
- **Don't** add visual flourishes that compete with reading, search clarity, or
  technical credibility.
- **Don't** add card grids, hero metrics, gradient text, glass panels, or
  ornamental imagery to article pages.
- **Don't** use repeated tiny uppercase tracked labels above section headings.
- **Don't** soften body copy below WCAG AA contrast.
