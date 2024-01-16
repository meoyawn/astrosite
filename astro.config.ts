import mdx from "@astrojs/mdx"
import tailwind from "@astrojs/tailwind"
import { defineConfig } from "astro/config"
import rehypeExternalLinks from "rehype-external-links"

// https://astro.build/config
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  integrations: [tailwind(), mdx()],
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: "_blank", rel: "noreferrer" }],
    ],
  },
  image: {
    // service: sharpImageService(),
  },
  /** https://vitejs.dev/config/ */
  vite: {
    server: {
      watch: {
        ignored: ["**/.idea/**"],
      },
    },
  },
})
