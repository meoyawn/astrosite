import tailwind from "@astrojs/tailwind"
import { defineConfig, sharpImageService } from "astro/config"
import rehypeExternalLinks from "rehype-external-links"

// https://astro.build/config
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  integrations: [tailwind()],
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: "_blank", rel: "noreferrer" }],
    ],
  },
  image: {
    service: sharpImageService(),
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
