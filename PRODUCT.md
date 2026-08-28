# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are technical readers and engineering peers arriving through
search, direct links, or project references. They use the writing and shipped
work to evaluate Adel Nizamutdinov's practical engineering judgment.

Potential consulting clients use the site to decide whether Adel fits a focused
software problem and to prepare a useful first contact. Recruiters, ATS tools,
and AI-assisted CV screening systems use the CV to understand senior product
engineering experience. Collaborators use product links, GitHub, and writing to
find relevant shared work.

## Product Purpose

This personal site builds technical writing credibility, supports search
discovery, and turns firsthand engineering work into a durable public record.
It publishes focused software engineering arguments, presents selected products
and career evidence, explains Adel's consulting scope, and provides a direct
route to contact.

Success means visitors can find a page that matches their question, understand
Adel's position and evidence quickly, and continue naturally to related writing,
consulting contact, products, GitHub, or the CV. Career evidence must remain easy
for both people and screening systems to parse without keyword stuffing.

## Positioning

The site is Adel's firsthand field record: technical arguments, products he
builds, consulting judgment, and career evidence live together under his name.
Its authority comes from concrete work and explicit tradeoffs rather than a
separate portfolio brand or generic software-agency claims.

## Operating Context

- Visitors commonly enter on a focused writing page, the homepage, a product
  reference, the consulting page, or the CV rather than following one fixed
  funnel.
- Consulting inquiries move through the contact page or direct email and should
  include the problem, constraints, prior attempts, and desired outcome.
- Business is conducted through Pneuma LLC.
- English is the source language. Matching homepage, consulting, and CV surfaces
  also exist in Russian and Tatar and must remain structurally aligned.
- The CV serves browser reading, printing, recruiters, ATS extraction, and AI
  screening.
- The travel timeline and now page provide personal context without replacing
  the site's technical and consulting focus.

## Capabilities and Constraints

- The site is a statically rendered SolidJS and Vite application built with
  `solid-static`; pages must remain crawlable and usable without relying on a
  client-only application shell.
- Long-form writing is authored from Markdown and rendered at stable,
  topic-specific routes.
- The site includes product links, consulting and contact information, a
  structured multilingual CV, and an interactive travel timeline.
- Search clarity matters: titles, descriptions, headings, and internal routes
  must describe their actual topic without keyword stuffing.
- CV content must preserve semantic structure, direct dates, recognizable role
  titles, company and product names, and concrete skills tied to real work.
- Translated counterparts must stay in sync with their English source surfaces.

## Brand Commitments

The public identity is Adel Nizamutdinov. The site is his personal brand and
working record; Pneuma LLC is the disclosed business entity for consulting.

Voice is direct, pragmatic, technically sharp, calm, and unsentimental. Copy
explains what matters, why it matters, and what to do next without hype.

Avoid generic SaaS positioning, decorative AI-editorial tropes, portfolio gloss,
and claims or flourishes that compete with reading, search clarity, or technical
credibility.

## Evidence on Hand

- Shipped products named on the homepage and CV: Listenbox
  (`https://listenbox.app`), Arrowbox (`https://arrowbox.co`), and ResponsibleAPI
  (`https://responsibleapi.com`).
- Technical writing under `src/content/writing/`.
- Structured career, product, education, award, and skills evidence in
  `src/pages/cv.yaml`, with Russian and Tatar counterparts.
- Consulting scope and engagement expectations in `src/pages/consulting.mdx`
  and `src/pages/contact.md`.
- Public code and professional context through GitHub and LinkedIn links.
- Dated travel evidence in `src/app/travel/travels.json` and current context in
  `src/pages/now.tsx`.

No consulting testimonials, client case studies, rate card, or performance
benchmarks are present. Future work must not fabricate them.

## Product Principles

- Reading is the product: help visitors understand a technical position without
  ceremony or distraction.
- Specificity earns trust: prefer concrete claims, named tools, shipped work,
  code-shaped evidence, and explicit tradeoffs.
- Search entry pages must stand alone and provide a useful next path.
- Career claims must remain traceable to real roles, products, and outcomes and
  parsable by both people and machines.
- Multilingual counterparts must preserve the same product truth and structure.

## Accessibility & Inclusion

Target WCAG AA. Preserve keyboard navigation, readable contrast, semantic
headings, useful link text, reduced-motion alternatives, narrow-screen
readability, and a clear print-oriented CV.
