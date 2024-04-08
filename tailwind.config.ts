import typo from "@tailwindcss/typography"
import { type Config } from "tailwindcss"
import colors from "tailwindcss/colors"

// noinspection JSUnusedGlobalSymbols
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    colors: {
      date: colors.gray[500],
    },
  },
  plugins: [typo],
} satisfies Config
