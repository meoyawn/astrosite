import typo from "@tailwindcss/typography"
import { type Config } from "tailwindcss"

// noinspection JSUnusedGlobalSymbols
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
  },
  plugins: [typo],
} satisfies Config
