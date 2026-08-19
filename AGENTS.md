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
