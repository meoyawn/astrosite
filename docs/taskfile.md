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

    test_src["test-src<br/>bun test src/"]
    test_tooling["test-tooling<br/>bun test scripts/"]
    test["test"]

    check_src["check-src"]
    check["check"]
  end

  subgraph BuildAndDeploy["Build and Deploy"]
    build["build<br/>rm -rf dist/<br/>bun astro build"]
    test_e2e["test-e2e<br/>bun test e2e/"]
    deploy["deploy<br/>bun wrangler pages deploy dist/"]
  end

  subgraph Standalone
    cursor["cursor<br/>agent --yolo"]
    dev["dev<br/>bun astro dev"]
    test_coverage["test-coverage<br/>bun test --coverage"]
  end

  lint_src --> lint
  lint_tooling --> lint

  typecheck_src --> typecheck
  typecheck_tooling --> typecheck

  test_src --> test
  test_tooling --> test

  lint_src --> check_src
  typecheck_src --> check_src
  test_src --> check_src

  lint --> check
  typecheck --> check
  test --> check

  build --> test_e2e
  test_e2e --> deploy
```

## Aggregate Tasks

- `lint` depends on `lint-src` and `lint-tooling`.
- `typecheck` depends on `typecheck-src` and `typecheck-tooling`.
- `test` depends on `test-src` and `test-tooling`.
- `check-src` runs the `src/`-only lint, typecheck, and test tasks.
- `check` runs the full lint, typecheck, and test aggregates.
- `deploy` requires `test-e2e`, which requires `build`.

## Standalone Tasks

- `cursor` runs `agent --yolo`.
- `dev` runs `bun astro dev`.
- `test-coverage` runs `bun test --coverage`.
