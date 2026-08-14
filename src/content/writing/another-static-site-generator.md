---
title: Another static site generator
description: Why I left Astro and built solid-static on Vite and SolidJS
teaser: Astro-inspired static sites with a faster, simpler toolchain
published_at: 2026-08-14
---

I’m abandoning [Astro](https://astro.build/).

Astro is stuck on slow TypeScript 6 and ESLint while the tooling has moved on
to fast TypeScript 7 and Oxlint. That lag is structural: `.astro` is a custom
language, so every new compiler and linting tool needs a bespoke integration.
Its tooling will always lag behind. I wanted a static-site stack that could
move with the rest of my toolchain, so I built
[solid-static](https://github.com/meoyawn/solid-static).

It is an Astro-inspired static site generator built as a Vite plugin with
SolidJS and TSX. It supports all the Astro niceties, including content
collections and optimized images. `.tsx` is a standard at this point, and
SolidJS has the lowest mental overhead of any `.tsx` framework I know: the same
components and primitives work for static pages and dynamic UI, without
introducing a second mental model.

Codex even vibed a nice API for JavaScript islands: fully Vite-powered
`?island` imports.

```tsx
import counterIsland from "../app/counter-island.tsx?island"

<script type="module" src={counterIsland} />
```

Vite serves the source entry during development, then emits hashed JavaScript
and CSS assets for production.

All my personal static sites are now built with `solid-static`:
[adelnz.com](https://adelnz.com/), [Listenbox](https://listenbox.app/), and
[ResponsibleAPI](https://responsibleapi.com/).

This very page you’re reading was built using solid-static.
