import js from "@eslint/js"
import astro from "eslint-plugin-astro"
import tailwind from "eslint-plugin-tailwindcss"
import globals from "globals"
import ts from "typescript-eslint"

const tailwindConfig = new URL("./src/styles/global.css", import.meta.url)
  .pathname

export default [
  {
    ignores: [
      ".astro/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  ...tailwind.configs["flat/recommended"],
  {
    files: ["**/*.{js,ts,astro}"],
    settings: {
      tailwindcss: {
        config: tailwindConfig,
        cssConfigPath: tailwindConfig,
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.bunBuiltin,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{ts,astro}"],
    rules: {
      "no-undef": "off",
    },
  },
]
