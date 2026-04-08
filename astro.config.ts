import mdx from "@astrojs/mdx"
import { defineConfig } from "astro/config"
import rehypeExternalLinks from "rehype-external-links"

/** https://astro.build/config */
export default defineConfig({
  integrations: [mdx()],
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: "_blank", rel: "noreferrer" }],
    ],
  },
  /** https://vitejs.dev/config/ */
  vite: {
    server: {
      watch: {
        ignored: [".idea/**"],
      },
    },
  },
})
