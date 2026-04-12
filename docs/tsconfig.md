# Why We Have 4 `tsconfig.json`s

This repo has two different TypeScript environments, but four config files:

- Astro application code in `src/`
- Tooling code such as `astro.config.ts`, `scripts/**/*.ts`, and `e2e/**/*.ts`

If we only cared about the two real TypeScript projects, two configs would be
enough: one for Astro app code and one for tooling code.

At the command level, `bun run typecheck` runs two checks in parallel:

- `bun run typecheck:astro`, which runs `astro check --tsconfig tsconfig.json`
- `bun run typecheck:tooling`, which runs `tsc -p tsconfig.tooling.json`

`astro.config.ts` is covered by the tooling check, not the Astro check.

We have four files because `oxlint` type-aware linting wants directory-local
`tsconfig.json` projects for files in `scripts/` and `e2e/`, even though both
folders share the same underlying tooling compiler settings. The extra two files
are thin wrappers for that tooling requirement, not separate TypeScript
environments.

## `tsconfig.json`

This is the app config for Astro source code.

- It includes `.astro/types.d.ts` and `src/`.
- It enables the `@astrojs/ts-plugin`.
- It is the config used by `bun run typecheck:astro`.
- It does not include `astro.config.ts`, `scripts/**/*.ts`, or `e2e/**/*.ts`.

In practice, this file exists so Astro components and Astro-generated types are
checked with Astro-specific editor and compiler support, without pulling
unrelated tooling files into the same project.

## `tsconfig.tooling.json`

This is the shared base config for non-Astro TypeScript. It is the second real
TypeScript project in the repo.

- It includes `astro.config.ts`, `e2e/**/*.ts`, and `scripts/**/*.ts`.
- It keeps the strict compiler options we want for tooling code.
- It does not add the Astro TypeScript plugin or `.astro/types.d.ts`.
- It is the config used by `bun run typecheck:tooling`.
- It is the project that typechecks `astro.config.ts`.

This keeps tooling typechecking independent from the Astro app project. That
matters because these files run in a different context and do not need Astro
language-service behavior.

Because `astro.config.ts` already lives at the repo root, it can be included
directly in this shared tooling project. It does not need its own wrapper
`tsconfig.json`.

## `scripts/tsconfig.json`

This file is a thin wrapper around `../tsconfig.tooling.json`.

This file exists so `oxlint` type-aware linting can assign files in `scripts/`
to a directory-local `tsconfig.json` project while the shared compiler options
stay in `tsconfig.tooling.json`.

Without this wrapper, we would still have the right compiler settings, but we
would not have the local project file that `oxlint` expects for files in
`scripts/`.

Docs: https://oxc.rs/docs/guide/usage/linter/type-aware.html

## `e2e/tsconfig.json`

This is the same pattern as `scripts/tsconfig.json`.

- It inherits from `../tsconfig.tooling.json`.
- It narrows `include` to `e2e/**/*.ts`.

This file exists so `oxlint` type-aware linting can assign files in `e2e/` to
their own directory-local `tsconfig.json` project without duplicating the shared
tooling options.

Like `scripts/tsconfig.json`, this is an `oxlint` integration wrapper, not a
separate compiler setup.

## Where `astro.config.ts` Fits

`astro.config.ts` is tooling code, so it is part of `tsconfig.tooling.json`, not
`tsconfig.json`.

- `bun run typecheck` covers it through `bun run typecheck:tooling`
- `bun run typecheck:tooling` runs `tsc -p tsconfig.tooling.json`
- `bun tsc -p tsconfig.tooling.json --listFilesOnly` includes `astro.config.ts`

Unlike `scripts/` and `e2e/`, it does not need a wrapper config. The wrapper
files exist only so `oxlint` can treat those directories as local projects
without duplicating the shared tooling compiler settings.

## Why Not Just Have 2 Files?

Because two files would solve only the compiler side:

- Astro app code that needs Astro-specific types and plugin support
- Tooling and test code that should stay plain TypeScript

But type-aware `oxlint` also wants folder-local `tsconfig.json` files for
`scripts/` and `e2e/`.

So the actual shape is:

- one Astro app config
- one shared tooling config
- two tiny wrapper configs that let `oxlint` treat `scripts/` and `e2e/` as
  their own local projects

That is why this repo has four `tsconfig` files even though it only has two real
TypeScript environments.
