# Plan: Collapse to 2 `tsconfig.json`s

## Goal

Reduce the repo from four TypeScript config files to two without losing:

- Astro-specific checking for app code in `src/`
- plain TypeScript checking for `astro.config.ts`, `scripts/**/*.ts`, and
  `e2e/**/*.ts`
- type-aware `oxlint` coverage for both environments

## Key Finding

The current blocker is not `tsc`. It is `oxlint` type-aware project discovery.

In the current repo:

- `bun tsc -p tsconfig.tooling.json --listFilesOnly` already proves the tooling
  project can cover `astro.config.ts`, `scripts/**/*.ts`, and `e2e/**/*.ts`
- `OXC_LOG=debug bun oxlint --type-aware astro.config.ts e2e/ scripts/` assigns
  `scripts/**/*.ts` to `scripts/tsconfig.json`
- the same `oxlint` run assigns `e2e/**/*.ts` to `e2e/tsconfig.json`
- the same `oxlint` run leaves `astro.config.ts` unmatched
- `OXC_LOG=debug bun oxlint --type-aware --tsconfig tsconfig.tooling.json astro.config.ts e2e/ scripts/`
  does not change that assignment in this repo

That means the repo cannot get down to two files by deleting only the wrapper
configs while keeping a non-standard `tsconfig.tooling.json`.

`oxlint` does not appear to have a `--listFilesOnly` equivalent. The supported
way to inspect type-aware project assignment is debug logging:

- `OXC_LOG=debug bun oxlint --type-aware ...`

Docs: https://oxc.rs/docs/guide/usage/linter/type-aware.html

## Proposed End State

Make the two real TypeScript environments the two `tsconfig.json` files that
`oxlint` can discover directly:

- root `tsconfig.json`: tooling project
- `src/tsconfig.json`: Astro app project

That gives `oxlint` a directory-local `tsconfig.json` for both environments
without needing wrapper files:

- files under `src/` resolve to `src/tsconfig.json`
- `astro.config.ts`, `scripts/**`, and `e2e/**` resolve to root `tsconfig.json`

## Target File Shape

### root `tsconfig.json`

This becomes the tooling config. Its contents should match the current
`tsconfig.tooling.json`:

- extends `astro/tsconfigs/strictest`
- keeps the current non-Astro compiler options
- includes:
  - `astro.config.ts`
  - `scripts/**/*.ts`
  - `e2e/**/*.ts`

### `src/tsconfig.json`

This becomes the Astro app config. Its contents should match the current root
`tsconfig.json`, adjusted for the new location:

- keeps `@astrojs/ts-plugin`
- keeps the current app compiler options
- changes `include` from:
  - `.astro/types.d.ts`
  - `src/`
- to:
  - `../.astro/types.d.ts`
  - `./**/*`

## Migration Steps

1. Create `src/tsconfig.json` from the current app config.
2. Replace root `tsconfig.json` with the current `tsconfig.tooling.json`
   contents.
3. Delete the three files that become redundant:
   - `tsconfig.tooling.json`
   - `scripts/tsconfig.json`
   - `e2e/tsconfig.json`
4. Update command references:
   - `typecheck:astro` should become `astro check --tsconfig src/tsconfig.json`
   - `typecheck:tooling` should become `tsc -p tsconfig.json`
5. Leave lint entrypoints unchanged unless there is another reason to change
   them:
   - `oxlint src/` should naturally bind to `src/tsconfig.json`
   - `oxlint astro.config.ts e2e/ scripts/` should naturally bind to root
     `tsconfig.json`
6. Rewrite `docs/tsconfig.md` around the new two-file model.

## Verification

### TypeScript

Verify the tooling project still covers the expected files:

```sh
bun tsc -p tsconfig.json --listFilesOnly | rg 'astro\\.config\\.ts|scripts/|e2e/'
```

Verify Astro still uses the moved app config:

```sh
bun astro check --tsconfig src/tsconfig.json
```

### `oxlint`

Use debug logging to inspect tooling project assignment first:

```sh
OXC_LOG=debug bun oxlint --type-aware astro.config.ts e2e/ scripts/
```

Success criteria:

- exactly one program is reported
- the program is root `tsconfig.json`
- `Unmatched files: 0`

Then inspect app project assignment in isolation:

```sh
OXC_LOG=debug bun oxlint --type-aware src/
```

Success criteria:

- exactly one program is reported
- the program is `src/tsconfig.json`
- `Unmatched files: 0`

Finally run an end-to-end smoke check across both environments:

```sh
OXC_LOG=debug bun oxlint --type-aware astro.config.ts e2e/ scripts/ src/
```

Success criteria:

- exactly two programs are reported
- the programs are root `tsconfig.json` and `src/tsconfig.json`
- `Unmatched files: 0`

## Evidence For The End State

A dry run in `/tmp` with this exact layout succeeded:

- `OXC_LOG=debug bun oxlint --type-aware astro.config.ts e2e/ scripts/`
  reported only root `tsconfig.json` and `Unmatched files: 0`
- `OXC_LOG=debug bun oxlint --type-aware src/`
  reported only `src/tsconfig.json` and `Unmatched files: 0`
- `OXC_LOG=debug bun oxlint --type-aware astro.config.ts e2e/ scripts/ src/`
  reported `Total programs: 2` and `Unmatched files: 0`
- `bun astro check --tsconfig src/tsconfig.json` completed successfully

So this is not just a naming cleanup. It is a layout change that matches
`oxlint`'s actual discovery model.

## Alternatives Rejected

- Keep root app `tsconfig.json`, keep non-standard `tsconfig.tooling.json`, and
  delete only `scripts/tsconfig.json` and `e2e/tsconfig.json`
  - rejected because current `oxlint` behavior still needs directory-local
    `tsconfig.json` files for those paths
- Force `oxlint` with `--tsconfig tsconfig.tooling.json`
  - rejected because the current repo probe did not change type-aware project
    assignment

## Notes

- This repo's local rules mean `package.json` should not be edited implicitly.
  If the migration is implemented, the script updates need to be part of an
  explicit human-approved package change.
