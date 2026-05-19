import type { Rule, SourceCode } from "eslint"

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

export const requireExternalAnchorSafety: Rule.RuleModule = {
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
