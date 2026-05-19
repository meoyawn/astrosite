import js from "@eslint/js"
import astro from "eslint-plugin-astro"
import * as mdx from "eslint-plugin-mdx"
import tailwind from "eslint-plugin-tailwindcss"
import globals from "globals"
import ts from "typescript-eslint"
import { requireExternalAnchorSafety } from "./eslint/require-external-anchor-safety.ts"
import { suggestCanonicalClasses } from "./eslint/suggest-canonical-classes.ts"

const tailwindConfig = new URL("./src/styles/global.css", import.meta.url)
  .pathname

function namedAstroConfig(name: string) {
  const config = astro.configs.base.find(config => config.name === name)

  if (config === undefined) {
    throw new Error(`Missing ${name} ESLint config.`)
  }

  return config
}

const astroPlugin = namedAstroConfig("astro/base/plugin")
const astroBase = namedAstroConfig("astro/base")
const astroProcessorConfigs = astro.configs.base.filter(
  config => config.name !== "astro/base/plugin" && config.name !== "astro/base",
)
const astroRecommended = astro.configs.recommended.find(
  config => config.name === "astro/recommended",
) ?? { rules: {} }

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
  astroPlugin,
  ...tailwind.configs["flat/recommended"],
  {
    settings: {
      tailwindcss: {
        config: tailwindConfig,
        cssConfigPath: tailwindConfig,
      },
    },
  },
  {
    ...astroBase,
    ...astroRecommended,
    settings: {
      ...astroBase.settings,
      ...astroRecommended.settings,
    },
    rules: {
      ...astroBase.rules,
      ...astroRecommended.rules,
    },
  },
  ...astroProcessorConfigs,
  {
    ...mdx.flat,
    files: ["**/*.mdx"],
  },
  {
    files: ["**/*.{js,ts,astro,mdx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.bunBuiltin,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{astro,mdx}"],
    plugins: {
      local: {
        rules: {
          requireExternalAnchorSafety,
          suggestCanonicalClasses,
        },
      },
    },
    rules: {
      "local/requireExternalAnchorSafety": "error",
      "local/suggestCanonicalClasses": "error",
      "tailwindcss/no-custom-classname": "error",
    },
  },
  {
    files: ["**/*.{ts,astro}"],
    rules: {
      "no-undef": "off",
    },
  },
]
