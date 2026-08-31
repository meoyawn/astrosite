import { For } from "solid-js"
import { localizedRoute } from "../routes.ts"
import type { NavRouteName } from "../routes.ts"
import type { Locale } from "./i18n.ts"
import { siteCopy } from "./site-copy.ts"

export interface LocaleSwitcherProps {
  currentLocale: Locale
  currentPath: NavRouteName
}

export const LocaleSwitcher = (props: LocaleSwitcherProps) => (
  <nav aria-label={siteCopy[props.currentLocale].switcherLabel}>
    <ul class="m-0 flex list-none items-center gap-3 p-0">
      <For each={["en", "ru", "tt"] as const}>
        {locale => (
          <li>
            <a
              href={localizedRoute(locale, props.currentPath)}
              aria-current={
                locale === props.currentLocale ? "page" : undefined
              }
              class="text-sm text-zinc-500 no-underline transition-colors hover:text-zinc-900"
              classList={{
                "text-zinc-900 underline decoration-1 underline-offset-3":
                  locale === props.currentLocale,
              }}
            >
              {locale.toUpperCase()}
            </a>
          </li>
        )}
      </For>
    </ul>
  </nav>
)
