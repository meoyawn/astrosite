# AGENTS.md

- language: 100% TypeScript
- framework: [Astro](https://astro.build)

## Rules

- never add `oxlint-disable-next-line` unless explicitly asked
- never edit [package.json](package.json) unless explicitly asked
- never edit [bunfig.toml](bunfig.toml) unless explicitly asked
- never disable, skip or ignore tests

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
