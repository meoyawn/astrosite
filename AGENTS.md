# AGENTS.md

- language: 100% TypeScript
- framework: [SolidJS](https://www.solidjs.com/) with [Vite](https://vite.dev/)

## Dev server

- dev server port is in [vite.config.ts](vite.config.ts)
- never launch the dev server, it's already running
- when trying to debug problems, start with simple `curl` (need to escalate
  sandbox)

## Rules

- never add `oxlint-disable-next-line` unless explicitly asked
- never disable, skip or ignore tests
- never edit [tsconfig.json](tsconfig.json) unless explicitly asked

## Verification

- after every code change, run `task check` before reporting completion
- individual lint, typecheck, build, or test commands never substitute for
  `task check`
- do not report a code change as complete until `task check` exits successfully
- when `task check` fails, fix the failures and rerun the full `task check`;
  never skip, disable, or ignore a failing check

## Images

- never put images in [public](public/); every local image, including social
  previews and generated source artwork, must live under [src](src/)
- always import local images through Vite so content changes invalidate its
  cache and production builds emit content-hashed asset URLs
- use `solid-static/image` for local images: `ResponsiveImage` for HTML images
  and `getImage()` for URLs used outside image markup, including Open Graph
  metadata
- never hand-copy an optimized image into `public`; keep one source asset in
  `src` and let `solid-static` optimize, cache, and emit the derivative

## Social metadata URLs

- production and preview deployments use unpredictable domains; never hardcode
  a deployment origin in metadata
- `og:image` and `twitter:image` are the only Open Graph or Twitter fields that
  may contain URLs, and both must use root-relative `/assets/...` paths
- never emit `og:url` or any other URL-valued Open Graph or Twitter field

## Writing

- when changes are limited to [src/content/writing](src/content/writing/), never
  run `task build`, `vite build`, or any other full-site build
- validate the affected writing route through the already-running dev server
  with a targeted `curl`
- if the dev server is unavailable, report that targeted validation could not
  run; never launch it or substitute a full-site build

## i18n sync

- keep translations in [src/pages/ru](src/pages/ru/) and
  [src/pages/tt](src/pages/tt/) in sync with original pages in
  [src/pages](src/pages/)

## CLI tools

- never call `node`, call `nub` instead
- never call `npx`, call `nubx` instead
- never run code formatting unless explicitly asked
- never call `vitest` directly
- `rg`, `ast-grep`, `jq` are available for calling
- never call `wc`, call `scc` instead (both on files and folders)
- never pass multiple paths to `scc`. Single dir/file only.
- `gh` is available
- never give up/move on to alternatives when a `<cli>` is unavailable without
  trying `pkgx <cli>`
