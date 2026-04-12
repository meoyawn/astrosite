# TSC And Oxlint Unification Plan

## Goal

Unify `e2e`, `scripts`, and [astro.config.ts](/Users/adelnizamutdinov/Projects/astrosite/astro.config.ts) around one tooling-oriented TypeScript and linting shape, while keeping `src` on its own Astro-focused path.

## Desired End State

- `src` keeps using the root [tsconfig.json](/Users/adelnizamutdinov/Projects/astrosite/tsconfig.json) and `astro check`.
- `e2e`, `scripts`, and [astro.config.ts](/Users/adelnizamutdinov/Projects/astrosite/astro.config.ts) share one `tsc` base config for CLI typechecking.
- `e2e/tsconfig.json` and `scripts/tsconfig.json` stay as thin local wrappers for editor scope.
- Oxlint keeps one shared rule block for `e2e`, `scripts`, and [astro.config.ts](/Users/adelnizamutdinov/Projects/astrosite/astro.config.ts), with only narrow per-folder exceptions.
- `src` stays separate from the tooling files in both `tsc` and oxlint entrypoints.

## TSC Shape

1. Keep [tsconfig.scripts.json](/Users/adelnizamutdinov/Projects/astrosite/tsconfig.scripts.json) as the shared CLI project for `e2e/**/*.ts`, `scripts/**/*.ts`, and [astro.config.ts](/Users/adelnizamutdinov/Projects/astrosite/astro.config.ts).
2. Keep [e2e/tsconfig.json](/Users/adelnizamutdinov/Projects/astrosite/e2e/tsconfig.json) and [scripts/tsconfig.json](/Users/adelnizamutdinov/Projects/astrosite/scripts/tsconfig.json) as wrapper configs with local `include` globs.
3. Keep [tsconfig.json](/Users/adelnizamutdinov/Projects/astrosite/tsconfig.json) limited to Astro app concerns: `.astro/types.d.ts` and `src/`, rather than mixing app code with config/tooling files.
4. If [astro.config.ts](/Users/adelnizamutdinov/Projects/astrosite/astro.config.ts) needs config-specific compiler options later, add them in the shared tooling config instead of broadening the app config.
5. If the naming becomes confusing, rename `tsconfig.scripts.json` to something like `tsconfig.tooling.json` in a separate change and update the package script at the same time.

## Oxlint Shape

1. Extract the duplicated TypeScript rule set in [.oxlintrc.jsonc](/Users/adelnizamutdinov/Projects/astrosite/.oxlintrc.jsonc) into one shared override for all TypeScript-bearing paths that should behave the same.
2. Keep a separate `src` override for app-specific paths such as `src/**/*.ts` and `src/**/*.astro`.
3. Keep a separate tooling override for `e2e/**/*.ts`, `scripts/**/*.ts`, and [astro.config.ts](/Users/adelnizamutdinov/Projects/astrosite/astro.config.ts).
4. Keep a separate `scripts` override only for narrow exceptions such as `no-console`.
5. Keep the test-file override for `**/*.test.ts` as a targeted exception, not a second shared rules block.

## Rollout

1. Land the shared `tsc` config first.
2. Extend the shared tooling `tsc` config to cover [astro.config.ts](/Users/adelnizamutdinov/Projects/astrosite/astro.config.ts).
3. Verify `bun run typecheck:scripts` covers `e2e`, `scripts`, and [astro.config.ts](/Users/adelnizamutdinov/Projects/astrosite/astro.config.ts).
4. Collapse the duplicated oxlint overrides into one shared block.
5. Run `bun run check` only if lint changes expand beyond config-only validation needs; otherwise verify with the narrower lint command.

## Open Questions

- Whether the shared `e2e` and `scripts` config should eventually get a more general name.
- Whether any future oxlint rule differences between `e2e` and `scripts` are substantial enough to justify separate overrides again.
