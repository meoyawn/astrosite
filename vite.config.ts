import mdx from "@mdx-js/rollup"
import tailwindcss from "@tailwindcss/postcss"
import type { Root } from "hast"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeExternalLinks from "rehype-external-links"
import rehypeSlug from "rehype-slug"
import rehypeStringify from "rehype-stringify"
import remarkFrontmatter from "remark-frontmatter"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"
import type { Plugin } from "unified"
import { defineConfig } from "vite"
import { defaultLocale, locales } from "./src/app/i18n.ts"
import { externalLinkOptions } from "./src/app/markdown-options.ts"
import { collections } from "./src/content.config.ts"
import { staticSite } from "vite-static-site"
import { createMarkdownProcessor } from "vite-static-site/markdown"

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

const markdownProcessor = createMarkdownProcessor()
  .use(rehypeSlug)
  .use(rehypeWritingAutolinkHeadings)
  .use(rehypeExternalLinks, externalLinkOptions)
  .use(rehypeStringify)

const mdxPlugin = mdx({
  include: /\.mdx?$/,
  jsxImportSource: "solid-jsx",
  rehypePlugins: [rehypeSlug, [rehypeExternalLinks, externalLinkOptions]],
  remarkPlugins: [
    remarkFrontmatter,
    [remarkMdxFrontmatter, { name: "frontmatter" }],
  ],
})

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: process.env.DIST_DIR ?? "dist-vite",
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
