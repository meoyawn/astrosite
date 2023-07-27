import { type Config } from "tailwindcss"

const cfg: Config = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
}

// noinspection JSUnusedGlobalSymbols
export default cfg
