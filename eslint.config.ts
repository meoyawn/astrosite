import { readFile } from "node:fs/promises"
import { dirname, extname } from "node:path"
import js from "@eslint/js"
import { Scanner } from "@tailwindcss/oxide"
import type { Rule } from "eslint"
import astro from "eslint-plugin-astro"
import tailwind from "eslint-plugin-tailwindcss"
import globals from "globals"
import { __unstable__loadDesignSystem } from "tailwindcss"
import ts from "typescript-eslint"

const tailwindConfig = new URL("./src/styles/global.css", import.meta.url)
  .pathname
const tailwindBase = dirname(tailwindConfig)
const scanner = new Scanner({ sources: [] })

async function loadTailwindStylesheet(id: string, base: string) {
  const href =
    id === "tailwindcss"
      ? import.meta.resolve("tailwindcss/index.css")
      : import.meta.resolve(id, `file://${base}/`)
  const path = new URL(href).pathname

  return { base: dirname(path), content: await readFile(path, "utf8"), path }
}

async function loadTailwindModule(id: string, base: string) {
  const href = import.meta.resolve(id, `file://${base}/`)
  const path = new URL(href).pathname
  const mod = await import(href)

  return {
    base: dirname(path),
    module: mod.default ?? mod,
    path,
  }
}

const designSystem = await __unstable__loadDesignSystem(
  await readFile(tailwindConfig, "utf8"),
  {
    base: tailwindBase,
    loadModule: loadTailwindModule,
    loadStylesheet: loadTailwindStylesheet,
  },
)

const suggestCanonicalClasses: Rule.RuleModule = {
  meta: {
    docs: {
      description: "suggest canonical Tailwind class names",
    },
    fixable: "code",
    messages: {
      canonicalClass:
        "Tailwind class '{{className}}' can be written as '{{canonicalClassName}}'.",
    },
    schema: [],
    type: "suggestion",
  },
  create(context) {
    return {
      Program() {
        const sourceCode = context.sourceCode
        const extension = extname(context.filename).slice(1) || "html"
        const reports = new Set<string>()
        const candidates = scanner.getCandidatesWithPositions({
          content: sourceCode.text,
          extension,
        })

        for (const { candidate, position } of candidates) {
          const canonicalClassName = designSystem.canonicalizeCandidates([
            candidate,
          ])[0]

          if (
            canonicalClassName === undefined ||
            candidate === canonicalClassName ||
            sourceCode.text.slice(position, position + candidate.length) !==
              candidate
          ) {
            continue
          }

          const key = `${position}:${candidate}`
          if (reports.has(key)) {
            continue
          }
          reports.add(key)

          context.report({
            data: {
              canonicalClassName,
              className: candidate,
            },
            loc: {
              end: sourceCode.getLocFromIndex(position + candidate.length),
              start: sourceCode.getLocFromIndex(position),
            },
            messageId: "canonicalClass",
            fix(fixer) {
              return fixer.replaceTextRange(
                [position, position + candidate.length],
                canonicalClassName,
              )
            },
          })
        }
      },
    }
  },
}

export default [
  {
    ignores: [
      ".astro/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  ...tailwind.configs["flat/recommended"],
  {
    files: ["**/*.{js,ts,astro}"],
    plugins: {
      local: {
        rules: {
          suggestCanonicalClasses,
        },
      },
    },
    settings: {
      tailwindcss: {
        config: tailwindConfig,
        cssConfigPath: tailwindConfig,
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.bunBuiltin,
        ...globals.node,
      },
    },
    rules: {
      "local/suggestCanonicalClasses": "error",
      "tailwindcss/no-custom-classname": "error",
    },
  },
  {
    files: ["**/*.{ts,astro}"],
    rules: {
      "no-undef": "off",
    },
  },
]
