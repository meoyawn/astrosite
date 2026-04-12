# Why We Have 4 `tsconfig.json`s

This repo has four TypeScript config files because it has two different TypeScript environments:

- Astro application code in `src/`
- Tooling code such as `astro.config.ts`, `scripts/**/*.ts`, and `e2e/**/*.ts`

Those environments do not need exactly the same TypeScript behavior, so we keep them separate and then add thin directory-local wrappers where that makes navigation and tooling clearer.

## `tsconfig.json`

This is the app config for Astro source code.

- It includes `.astro/types.d.ts` and `src/`.
- It enables the `@astrojs/ts-plugin`.
- It is the config used by `bun run typecheck:astro`.

In practice, this file exists so Astro components and Astro-generated types are checked with Astro-specific editor and compiler support, without pulling unrelated tooling files into the same project.

## `tsconfig.tooling.json`

This is the shared base config for non-Astro TypeScript.

- It includes `astro.config.ts`, `e2e/**/*.ts`, and `scripts/**/*.ts`.
- It keeps the strict compiler options we want for tooling code.
- It does not add the Astro TypeScript plugin or `.astro/types.d.ts`.
- It is the config used by `bun run typecheck:tooling`.

This keeps tooling typechecking independent from the Astro app project. That matters because these files run in a different context and do not need Astro language-service behavior.

## `scripts/tsconfig.json`

This file is a thin wrapper around `../tsconfig.tooling.json`.

- It inherits the shared tooling options.
- It narrows `include` to `scripts/**/*.ts`.

The point is not different compiler rules. The point is to give the `scripts/` directory its own local config entrypoint while keeping the actual tooling settings centralized in one place.

## `e2e/tsconfig.json`

This is the same pattern as `scripts/tsconfig.json`.

- It inherits from `../tsconfig.tooling.json`.
- It narrows `include` to `e2e/**/*.ts`.

That keeps e2e files on the shared tooling baseline without duplicating options.

## Why Not Collapse Them Into One File?

Because one file would mix two separate concerns:

- Astro app code that needs Astro-specific types and plugin support
- Tooling and test code that should stay plain TypeScript

The current split gives us:

- a clean Astro project for `src/`
- a clean tooling project for config, scripts, and e2e code
- directory-local `tsconfig.json` files in `scripts/` and `e2e/` without duplicating the real compiler settings

So the four files are really:

- one Astro app config
- one shared tooling config
- two small wrappers for folder-local tooling ergonomics
