# AGENTS.md

- language: 100% TypeScript
- framework: [Astro](https://astro.build)

## Dev server

- dev server port is in [astro.config.ts](astro.config.ts)
- never launch the dev server, it's already running
- when trying to debug problems, start with simple `curl` (need to escalate
  sandbox)

## Rules

- never add `oxlint-disable-next-line` unless explicitly asked
- never disable, skip or ignore tests
- never edit [tsconfig.json](tsconfig.json) unless explicitly asked

## i18n sync

- keep translations in [src/pages/ru](src/pages/ru/) and
  [src/pages/tt](src/pages/tt/) in sync with original pages in
  [src/pages](src/pages/)

## CLI tools

- never call `node`, call `nub` instead
- never call `npx` or `nubx`:
  - if a package is missing, stop and ask to add it to `package.json`
  - if a package is present, call through `nubx`
- never run code formatting unless explicitly asked
- never call `vitest` directly
- `rg`, `ast-grep`, `jq` are available for calling
- never call `wc`, call `scc` instead (both on files and folders)
- never pass multiple paths to `scc`. Single dir/file only.
- `gh` is available
- never give up/move on to alternatives when a `<cli>` is unavailable without
  trying `pkgx <cli>`
