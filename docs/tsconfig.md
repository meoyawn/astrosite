# Current `tsconfig` Setup

This repo currently has two TypeScript project configs:

- root `tsconfig.json` for tooling code
- `src/tsconfig.json` for Astro app code

## Root `tsconfig.json`

The root config is the plain TypeScript tooling project.

- It extends `astro/tsconfigs/strictest`.
- It includes `astro.config.ts`, `scripts/**/*.ts`, and `e2e/**/*.ts`.
- It does not enable `@astrojs/ts-plugin`.
- It does not include `.astro/types.d.ts`.

This is the config that should be used for non-Astro typechecking and for
type-aware `oxlint` on `astro.config.ts`, `scripts/`, and `e2e/`.

Direct command:

- `bun tsc -p tsconfig.json`

## `src/tsconfig.json`

The `src/tsconfig.json` file is the Astro app project.

- It extends `astro/tsconfigs/strictest`.
- It enables `@astrojs/ts-plugin`.
- It includes `../.astro/types.d.ts` and `./**/*`.
- It is intended for files under `src/`.

This is the config that should be used for Astro-specific checking and for
type-aware `oxlint` on `src/`.

Direct command:

- `bun astro check --tsconfig src/tsconfig.json`

## `oxlint` Assignment

With the current layout, type-aware `oxlint` should discover projects like this:

- `bun oxlint --type-aware src/` resolves to `src/tsconfig.json`
- `bun oxlint --type-aware astro.config.ts e2e/ scripts/` resolves to the root
  `tsconfig.json`

That keeps Astro app code and plain TypeScript tooling code in separate programs
without extra wrapper configs.
