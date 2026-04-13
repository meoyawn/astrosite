import mdx from "@astrojs/mdx"
import { defineConfig } from "astro/config"
import rehypeExternalLinks from "rehype-external-links"
import { defaultLocale, locales } from "./src/app/i18n"

/** https://astro.build/config */
export default defineConfig({
  integrations: [mdx()],
  i18n: {
    locales: [...locales],
    defaultLocale,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: "_blank", rel: "noreferrer" }],
    ],
  },
  /** https://vitejs.dev/config/ */
  vite: {
    server: {
      port: 4321,
      watch: {
        ignored: [".idea/**", ".wrangler/**", ".agents/**"],
      },
    },
  },
})
