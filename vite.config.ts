import mdx from "@mdx-js/rollup"
import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype"
import tailwindcss from "@tailwindcss/postcss"
import type { Root } from "hast"
import type { Root as MdastRoot } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeExternalLinks from "rehype-external-links"
import rehypeSlug from "rehype-slug"
import rehypeStringify from "rehype-stringify"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"
import type { Options as RemarkParseOptions } from "remark-parse"
import remarkRehype from "remark-rehype"
import { type Plugin, unified } from "unified"
import { defineConfig } from "vite"
import { defaultLocale, locales } from "./src/app/i18n.ts"
import { externalLinkOptions } from "./src/app/markdown-options.ts"
import { collections } from "./src/content.config.ts"
import { staticSite } from "solid-static"

const codeTheme = "github-dark-default"
const codeColors = {
  attribute: "#79C0FF",
  comment: "#8B949E",
  foreground: "#C9D1D9",
  identifier: "#79C0FF",
  keyword: "#FF7B72",
  literal: "#D2A8FF",
  operator: "#FF7B72",
  punctuation: "#C9D1D9",
  string: "#A5D6FF",
  tag: "#D2A8FF",
  type: "#79C0FF",
}
const codeHighlightOptions: RehypeShikiOptions = {
  includeExplanation: true,
  theme: codeTheme,
  transformers: [
    {
      name: "apply-deep-cool-palette",
      tokens(lines) {
        for (const line of lines) {
          const explainedTokens = line.flatMap((token) => {
            if (!token.explanation || token.explanation.length < 2) {
              return [token]
            }

            let contentOffset = 0
            let tokenOffset = token.offset
            const tokenSegments = []
            for (const explanation of token.explanation) {
              if (!explanation.content) {
                continue
              }

              const explanationOffset = token.content.indexOf(
                explanation.content,
                contentOffset,
              )
              if (explanationOffset === -1) {
                return [token]
              }
              if (explanationOffset > contentOffset) {
                const gap = token.content.slice(
                  contentOffset,
                  explanationOffset,
                )
                tokenSegments.push({
                  ...token,
                  content: gap,
                  explanation: [],
                  offset: tokenOffset,
                })
                tokenOffset += gap.length
              }

              tokenSegments.push({
                ...token,
                content: explanation.content,
                explanation: [explanation],
                offset: tokenOffset,
              })
              contentOffset = explanationOffset + explanation.content.length
              tokenOffset += explanation.content.length
            }
            if (contentOffset < token.content.length) {
              tokenSegments.push({
                ...token,
                content: token.content.slice(contentOffset),
                explanation: [],
                offset: tokenOffset,
              })
            }
            return tokenSegments
          })
          line.splice(0, line.length, ...explainedTokens)

          for (const token of line) {
            const scopeNames =
              token.explanation?.flatMap((explanation) =>
                explanation.scopes.map((scope) => scope.scopeName),
              ) ?? []
            function hasScope(prefix: string): boolean {
              return scopeNames.some((scopeName) =>
                scopeName.startsWith(prefix),
              )
            }

            if (hasScope("comment")) {
              token.color = codeColors.comment
            } else if (hasScope("string")) {
              token.color = codeColors.string
            } else if (hasScope("entity.name.tag")) {
              token.color = codeColors.tag
            } else if (hasScope("entity.other.attribute-name")) {
              token.color = codeColors.attribute
            } else if (
              hasScope("variable") ||
              hasScope("entity.name.function") ||
              hasScope("support.function")
            ) {
              token.color = codeColors.identifier
            } else if (
              hasScope("entity.name.type") ||
              hasScope("entity.name.class") ||
              hasScope("storage.type") ||
              hasScope("support.type")
            ) {
              token.color = codeColors.type
            } else if (hasScope("constant")) {
              token.color = codeColors.literal
            } else if (hasScope("keyword.operator")) {
              token.color = codeColors.operator
            } else if (
              hasScope("keyword") ||
              hasScope("storage.modifier")
            ) {
              token.color = codeColors.keyword
            } else if (hasScope("punctuation")) {
              token.color = codeColors.punctuation
            }

            token.htmlStyle = {
              ...token.htmlStyle,
              color: token.color ?? codeColors.foreground,
            }
          }
        }
      },
    },
  ],
}

const autolinkWritingHeadings = rehypeAutolinkHeadings({
  behavior: "wrap",
  test: ["h2", "h3", "h4", "h5", "h6"],
})

const isWritingContentPath = (path: string): boolean =>
  path.includes("/src/content/writing/")

const rehypeWritingAutolinkHeadings: Plugin<[], Root> = () => (tree, file) => {
  if (isWritingContentPath(file.path)) {
    autolinkWritingHeadings(tree)
  }
}

const remarkParsePlugin: Plugin<
  [(Readonly<RemarkParseOptions> | null | undefined)?],
  string,
  MdastRoot
> = function (options) {
  this.parser = document =>
    fromMarkdown(document, {
      ...this.data("settings"),
      ...options,
      extensions: this.data("micromarkExtensions") ?? [],
      mdastExtensions: this.data("fromMarkdownExtensions") ?? [],
    })
}

const markdownProcessor = unified()
  .use(remarkParsePlugin)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug)
  .use(rehypeWritingAutolinkHeadings)
  .use(rehypeExternalLinks, externalLinkOptions)
  .use(rehypeShiki, codeHighlightOptions)
  .use(rehypeStringify, { allowDangerousHtml: true })

const mdxPlugin = mdx({
  include: /\.mdx?$/,
  jsxImportSource: "solid-jsx",
  rehypePlugins: [
    rehypeSlug,
    [rehypeExternalLinks, externalLinkOptions],
    [rehypeShiki, codeHighlightOptions],
  ],
  remarkPlugins: [
    remarkFrontmatter,
    [remarkMdxFrontmatter, { name: "frontmatter" }],
  ],
})

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "dist",
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  plugins: [
    staticSite({
      collections,
      i18n: {
        defaultLocale,
        locales: [...locales],
        routing: {
          prefixDefaultLocale: false,
        },
      },
      integrations: [mdxPlugin],
      markdown: {
        processor: markdownProcessor,
      },
      trailingSlash: "always",
    }),
  ],
  server: {
    host: true,
    port: 4321,
    watch: {
      ignored: [".idea/**", ".wrangler/**", ".agents/**"],
    },
  },
})
