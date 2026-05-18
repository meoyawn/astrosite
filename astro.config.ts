import { cpSync, existsSync, rmSync } from "node:fs"
import { fileURLToPath } from "node:url"
import mdx from "@astrojs/mdx"
import { defineConfig } from "astro/config"
import rehypeExternalLinks from "rehype-external-links"
import { defaultLocale, locales } from "./src/app/i18n"

const mapDefaultLocaleToBareRoutes = () => ({
  name: "map-default-locale-to-bare-routes",
  hooks: {
    "astro:build:done": ({ dir }: { dir: URL }) => {
      const distPath = fileURLToPath(dir)
      const defaultLocalePath = `${distPath}${defaultLocale}`

      if (!existsSync(defaultLocalePath)) {
        return
      }

      cpSync(defaultLocalePath, distPath, { recursive: true })
      rmSync(defaultLocalePath, { recursive: true })
    },
  },
})

/** https://astro.build/config */
export default defineConfig({
  integrations: [mdx(), mapDefaultLocaleToBareRoutes()],
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
