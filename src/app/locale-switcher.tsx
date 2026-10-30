import { For } from "solid-js"
import { localizedRoute } from "../routes.ts"
import type { NavRouteName } from "../routes.ts"
import type { Locale } from "./i18n.ts"
import { NavigationLink } from "./navigation-link.tsx"
import { siteCopy } from "./site-copy.ts"

export interface LocaleSwitcherProps {
  currentLocale: Locale
  currentPath: NavRouteName
}

export const LocaleSwitcher = (props: LocaleSwitcherProps) => (
  <nav aria-label={siteCopy[props.currentLocale].switcherLabel}>
    <ul class="m-0 flex list-none items-center gap-0.5 p-0">
      <For each={["en", "ru", "tt"] as const}>
        {locale => (
          <li>
            <NavigationLink
              href={localizedRoute(locale, props.currentPath)}
              aria-current={
                locale === props.currentLocale ? "page" : undefined
              }
            >
              {locale.toUpperCase()}
            </NavigationLink>
          </li>
        )}
      </For>
    </ul>
  </nav>
)
