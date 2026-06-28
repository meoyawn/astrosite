declare module "eslint-plugin-tailwindcss" {
  import type { Linter } from "eslint"

  const plugin: {
    configs: {
      recommended: Linter.Config
    }
    rules: NonNullable<Linter.Plugin["rules"]>
  }

  export default plugin
}
