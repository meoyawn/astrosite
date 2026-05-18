# Task Graph

This document maps the tasks defined in `Taskfile.yaml`.

Arrows point from a dependency to the task that depends on it.

```mermaid
flowchart TD
  subgraph Quality
    lint_src["lint-src<br/>bun oxlint src/"]
    lint_tooling["lint-tooling<br/>bun oxlint . --ignore-pattern 'src/**'"]
    lint["lint"]

    typecheck_src["typecheck-src<br/>bun astro check --tsconfig src/tsconfig.json"]
    typecheck_tooling["typecheck-tooling<br/>bun tsc -p tsconfig.json"]
    typecheck["typecheck"]

    test["test<br/>bun test"]

    check_src["check-src"]
    check["check"]
  end

  subgraph BuildAndDeploy["Build and Deploy"]
    build["build<br/>rm -rf dist/<br/>bun astro build"]
    test_e2e["test-e2e<br/>bun playwright test"]
    deploy["deploy<br/>bun wrangler pages deploy dist/"]
  end

  subgraph Standalone
    cursor["cursor<br/>agent --yolo"]
    dev["dev<br/>bun astro dev"]
  end

  lint_src --> lint
  lint_tooling --> lint

  typecheck_src --> typecheck
  typecheck_tooling --> typecheck

  lint_src --> check_src
  typecheck_src --> check_src

  lint --> check
  typecheck --> check
  test --> check
  test_e2e --> check

  build --> test_e2e
  check --> deploy
```

## Aggregate Tasks

- `lint` depends on `lint-src` and `lint-tooling`.
- `typecheck` depends on `typecheck-src` and `typecheck-tooling`.
- `test` runs `bun test`.
- `test-e2e` runs `bun playwright test` after `build`.
- `check-src` runs the `src/`-only lint and typecheck tasks.
- `check` runs the full lint, typecheck, `test`, and `test-e2e` tasks.
- `deploy` requires `check`.

## Standalone Tasks

- `cursor` runs `agent --yolo`.
- `dev` runs `bun astro dev`.
