import { readFile } from "node:fs/promises"
import { dirname, extname } from "node:path"
import js from "@eslint/js"
import { Scanner } from "@tailwindcss/oxide"
import type { Rule, SourceCode } from "eslint"
import astro from "eslint-plugin-astro"
import * as mdx from "eslint-plugin-mdx"
import tailwind from "eslint-plugin-tailwindcss"
import globals from "globals"
import { __unstable__loadDesignSystem } from "tailwindcss"
import ts from "typescript-eslint"

const tailwindConfig = new URL("./src/styles/global.css", import.meta.url)
  .pathname
const tailwindBase = dirname(tailwindConfig)
const scanner = new Scanner({ sources: [] })

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function propertyOf(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined
}

function nodeType(value: unknown): string | undefined {
  const type = propertyOf(value, "type")

  return typeof type === "string" ? type : undefined
}

function nodeText(sourceCode: SourceCode, node: unknown): string | undefined {
  const range = propertyOf(node, "range")

  if (
    !Array.isArray(range) ||
    typeof range[0] !== "number" ||
    typeof range[1] !== "number"
  ) {
    return undefined
  }

  return sourceCode.text.slice(range[0], range[1])
}

function identifierName(value: unknown): string | undefined {
  if (nodeType(value) !== "Identifier") {
    return undefined
  }

  const name = propertyOf(value, "name")

  return typeof name === "string" ? name : undefined
}

function jsxName(value: unknown): string | undefined {
  if (nodeType(value) !== "JSXIdentifier") {
    return undefined
  }

  const name = propertyOf(value, "name")

  return typeof name === "string" ? name : undefined
}

function jsxAttributes(value: unknown): unknown[] {
  const attributes = propertyOf(value, "attributes")

  return Array.isArray(attributes) ? attributes : []
}

function jsxAttributeName(value: unknown): string | undefined {
  return jsxName(propertyOf(value, "name"))
}

function jsxAttributeValue(value: unknown): unknown {
  return propertyOf(value, "value")
}

function literalString(value: unknown): string | undefined {
  if (nodeType(value) !== "Literal") {
    return undefined
  }

  const literalValue = propertyOf(value, "value")

  return typeof literalValue === "string" ? literalValue : undefined
}

function templateLiteralString(value: unknown): string | undefined {
  if (nodeType(value) !== "TemplateLiteral") {
    return undefined
  }

  const expressions = propertyOf(value, "expressions")
  const quasis = propertyOf(value, "quasis")

  if (
    !Array.isArray(expressions) ||
    expressions.length !== 0 ||
    !Array.isArray(quasis) ||
    quasis.length !== 1
  ) {
    return undefined
  }

  const quasiValue = propertyOf(quasis[0], "value")
  const cooked = propertyOf(quasiValue, "cooked")

  if (typeof cooked === "string") {
    return cooked
  }

  const raw = propertyOf(quasiValue, "raw")

  return typeof raw === "string" ? raw : undefined
}

function expressionFromContainer(value: unknown): unknown {
  return nodeType(value) === "JSXExpressionContainer"
    ? propertyOf(value, "expression")
    : undefined
}

function staticString(value: unknown): string | undefined {
  return literalString(value) ?? templateLiteralString(value)
}

function staticAttributeString(
  attribute: unknown,
  knownStringValues: Map<string, string>,
): string | undefined {
  const value = jsxAttributeValue(attribute)
  const expression = expressionFromContainer(value)
  const direct = staticString(value)

  if (direct !== undefined) {
    return direct
  }

  if (expression === undefined) {
    return undefined
  }

  const expressionValue = staticString(expression)

  if (expressionValue !== undefined) {
    return expressionValue
  }

  const name = identifierName(expression)

  return name === undefined ? undefined : knownStringValues.get(name)
}

function findAttribute(attributes: unknown[], name: string): unknown {
  return attributes.find(attribute => jsxAttributeName(attribute) === name)
}

function isExternalURL(value: string): boolean {
  return /^https?:\/\//u.test(value)
}

function isURLLikeExpression(sourceCode: SourceCode, expression: unknown) {
  const name = identifierName(expression)

  if (name !== undefined && /URL$/u.test(name)) {
    return true
  }

  const text = nodeText(sourceCode, expression)

  return text === undefined ? false : /(?:^|\.)url$/iu.test(text)
}

function relHasNoreferrer(value: string | undefined): boolean {
  return value?.split(/\s+/u).includes("noreferrer") ?? false
}

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

const requireExternalAnchorSafety: Rule.RuleModule = {
  meta: {
    docs: {
      description: "require safe attributes for external anchor links",
    },
    messages: {
      externalAnchor:
        'External <a> hrefs must include target="_blank" and rel="noreferrer".',
    },
    schema: [],
    type: "problem",
  },
  create(context) {
    const knownStringValues = new Map<string, string>()

    return {
      VariableDeclarator(node) {
        const id = propertyOf(node, "id")
        const init = propertyOf(node, "init")
        const name = identifierName(id)
        const value = staticString(init)

        if (name !== undefined && value !== undefined) {
          knownStringValues.set(name, value)
        }
      },
      JSXOpeningElement(node: Rule.Node) {
        if (jsxName(propertyOf(node, "name")) !== "a") {
          return
        }

        const attributes = jsxAttributes(node)
        const href = findAttribute(attributes, "href")

        if (href === undefined) {
          return
        }

        const hrefValue = staticAttributeString(href, knownStringValues)
        const expression = expressionFromContainer(jsxAttributeValue(href))
        const isExternal =
          hrefValue === undefined
            ? isURLLikeExpression(context.sourceCode, expression)
            : isExternalURL(hrefValue)

        if (!isExternal) {
          return
        }

        const targetValue = staticAttributeString(
          findAttribute(attributes, "target"),
          knownStringValues,
        )
        const relValue = staticAttributeString(
          findAttribute(attributes, "rel"),
          knownStringValues,
        )

        if (targetValue === "_blank" && relHasNoreferrer(relValue)) {
          return
        }

        context.report({
          messageId: "externalAnchor",
          node,
        })
      },
    }
  },
}

const localPlugin = {
  rules: {
    requireExternalAnchorSafety,
    suggestCanonicalClasses,
  },
}

const astroRecommended = astro.configs.recommended.find(
  config => config.name === "astro/recommended",
) ?? { rules: {} }

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
  ...astro.configs.base,
  ...tailwind.configs["flat/recommended"],
  {
    ...astroRecommended,
    files: ["**/*.astro"],
    settings: {
      tailwindcss: {
        config: tailwindConfig,
        cssConfigPath: tailwindConfig,
      },
    },
    rules: {
      ...astroRecommended.rules,
    },
  },
  {
    ...mdx.flat,
    files: ["**/*.mdx"],
    settings: {
      tailwindcss: {
        config: tailwindConfig,
        cssConfigPath: tailwindConfig,
      },
    },
    plugins: {
      ...mdx.flat.plugins,
      local: localPlugin,
    },
    rules: {
      ...mdx.flat.rules,
      "local/requireExternalAnchorSafety": "error",
    },
  },
  {
    files: ["**/*.{js,ts,astro}"],
    plugins: {
      local: localPlugin,
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
      "local/requireExternalAnchorSafety": "error",
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
