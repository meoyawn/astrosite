# AGENTS.md

- language: 100% TypeScript
- framework: [Astro](https://astro.build)

## Dev server

- dev server port is in [astro.config.ts](astro.config.ts)
- never launch the dev server, it's already running
- never address the server through `localhost`, use ipv6 `[::1]` only
- never use dev server URL without shell quoting it (because ipv6 symbols)
- when trying to debug problems, start with simple `curl`
- take page screenshots using `scripts/screenshot.ts <url> <output-path>`

## Rules

- never add `oxlint-disable-next-line` unless explicitly asked
- never edit [package.json](package.json). Stop and ask the human
- never edit [bunfig.toml](bunfig.toml) unless explicitly asked
- never disable, skip or ignore tests
- never edit [tsconfig.json](tsconfig.json) unless explicitly asked
- never edit `src/**/*` without running `bun check` after all edits are applied

## CLI tools

- never call `node`, call `bun` instead
- never call `npx` or `bunx`:
  - if a package is missing, stop and ask to add it to `package.json`
  - if a package is present, call through `bun`
- never run code formatting unless explicitly asked
- [never call `vitest`](docs/package.jsonc), `bun test` instead
- `rg`, `ast-grep`, `jq` are available for calling
- never call `wc`, call `scc` instead (both on files and folders)
- never pass multiple paths to `scc`. A single dir or a single file only.
- `gh` is available
- never give up/move on to alternatives when a `<cli>` is unavailable without
  trying `pkgx <cli>`
