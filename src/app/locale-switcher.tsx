import { For } from "solid-js"
import type { Locale } from "./i18n.ts"
import { siteCopy } from "./site-copy.ts"

export interface LocaleSwitcherProps {
  currentLocale: Locale
  currentPath: "consulting" | "cv" | "home"
}

const hrefFor = (locale: Locale, path: LocaleSwitcherProps["currentPath"]): string => {
  const localePrefix = locale === "en" ? "" : `/${locale}`

  return path === "home" ? `${localePrefix}/` : `${localePrefix}/${path}/`
}

export const LocaleSwitcher = (props: LocaleSwitcherProps) => (
  <nav aria-label={siteCopy[props.currentLocale].switcherLabel} class="m-0">
    <ul class="m-0 flex list-none gap-1 p-0 text-sm font-medium">
      <For each={["en", "ru", "tt"] as const}>
        {locale => {
          const isCurrent = locale === props.currentLocale

          return (
            <li>
              <a
                href={hrefFor(locale, props.currentPath)}
                aria-current={isCurrent ? "page" : undefined}
                class={`rounded border px-3 py-1 no-underline transition-colors ${
                  isCurrent
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900"
                }`}
              >
                {locale.toUpperCase()}
              </a>
            </li>
          )
        }}
      </For>
    </ul>
  </nav>
)

export { hrefFor as localeHrefFor }
