# Migration Review

`bun check` passes on this branch, so this is not a "the migration is broken" note. This is a guide-alignment review against:

- Astro v5 to v6: https://docs.astro.build/en/guides/upgrade-to/v6/
- Tailwind v3 to v4: https://tailwindcss.com/docs/upgrade-guide

## Important follow-up items

- Astro content collections are not in the final v6 shape yet.
  `src/content.config.ts` still uses `type: "content"` and does not define a `loader`.
  The Astro v6 guide says the v6 form is `loader: glob(...)` in `src/content.config.ts`, with `z` imported from `astro/zod`.
  This branch already did the `astro/zod` import and file rename, but not the explicit `glob()` loader step.
  Current file: `src/content.config.ts`

- Astro v6 requires Node `22.12.0` or higher, but the repo does not pin or document that anywhere.
  I did not find `.nvmrc`, `.node-version`, or a package `engines.node` entry.
  If local/dev/CI/deploy are all Bun-only this may not bite immediately, but the Astro upgrade guide explicitly calls out pinning the Node baseline.

## Tailwind v4 leftovers

- `tailwind.config.ts` looks like dead code now and is the best delete candidate in this PR.
  Tailwind v4 does not auto-detect JavaScript config files anymore unless they are loaded with `@config`.
  This repo does not use `@config`, and the only remaining config values are already expressed elsewhere:
  `@tailwindcss/typography` is loaded in `src/styles/global.css`.
  The custom `date` color is also defined in `src/styles/global.css` via `@theme`.
  That means `tailwind.config.ts` is very likely unused and can probably be deleted outright.

- `autoprefixer` is still installed and configured even though the Tailwind v4 guide says imports and vendor prefixing are handled automatically now.
  Current config: `.postcssrc.json`
  Current dependency: `package.json`
  This is not breaking anything, but it is migration residue and can be removed unless there is a deliberate reason to keep running Autoprefixer separately.

- Optional, not urgent: because Astro uses Vite, Tailwind's v4 guide now recommends the dedicated `@tailwindcss/vite` plugin instead of the PostCSS plugin.
  The current setup is valid, so I would treat this as a later cleanup rather than part of this PR.

## Small cleanup

- `src/app/cv/Org.astro` has `space-y-0`, which is effectively a no-op and can be deleted.
  This is minor, but Tailwind v4 also changed the selector used by `space-*` utilities, and the guide generally points people toward `gap-*` for flex/grid layouts anyway.

## Bottom line

- The migration works.
- The two items I would still track are:
  the unfinished Astro content-layer migration in `src/content.config.ts`
  the leftover Tailwind v4 migration residue (`tailwind.config.ts`, and probably `autoprefixer`)
