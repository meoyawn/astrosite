import mdx from "@astrojs/mdx"
import { defineConfig } from "astro/config"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeExternalLinks from "rehype-external-links"
import rehypeSlug from "rehype-slug"
import { defaultLocale, locales } from "./src/app/i18n"

/** https://astro.build/config */
export default defineConfig({
  integrations: [mdx()],
  trailingSlash: "always",
  server: {
    host: true,
    port: 4321,
  },
  i18n: {
    locales: [...locales],
    defaultLocale,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        { behavior: "wrap", test: ["h2", "h3", "h4", "h5", "h6"] },
      ],
      [rehypeExternalLinks, { target: "_blank", rel: "noreferrer" }],
    ],
  },
  /** https://vitejs.dev/config/ */
  vite: {
    server: {
      watch: {
        ignored: [".idea/**", ".wrangler/**", ".agents/**"],
      },
    },
  },
})
