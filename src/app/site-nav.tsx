import { createMemo, For, Show } from "solid-js"
import { localizedRoute } from "../routes.ts"
import type { NavRouteName } from "../routes.ts"
import type { Locale } from "./i18n.ts"
import { LocaleSwitcher } from "./locale-switcher.tsx"
import { NavigationLink } from "./navigation-link.tsx"
import { siteCopy } from "./site-copy.ts"

export interface SiteNavProps {
  currentLocale: Locale
  currentPath: NavRouteName | undefined
}

const shellRouteNames = ["workTogether", "cv"] as const

export const SiteNav = (props: SiteNavProps) => {
  const copy = createMemo(() => siteCopy[props.currentLocale])

  return (
    <nav
      aria-label={copy().navLabel}
      class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
    >
      <a
        href={localizedRoute(props.currentLocale, "home")}
        class="inline-flex min-h-11 shrink-0 items-center text-lg leading-snug font-bold tracking-tight text-link decoration-link-underline underline-offset-4 hover:underline"
      >
        {copy().siteTitle}
      </a>
      <div class="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:w-auto sm:justify-end">
        <ul class="-ml-2 flex list-none flex-wrap items-center gap-1 p-0 sm:ml-0">
          <For each={shellRouteNames}>
            {path => (
              <li class="m-0 p-0">
                <NavigationLink
                  href={localizedRoute(props.currentLocale, path)}
                  aria-current={path === props.currentPath ? "page" : undefined}
                >
                  {copy()[path]}
                </NavigationLink>
              </li>
            )}
          </For>
        </ul>
        <Show when={props.currentPath}>
          {currentPath => (
            <LocaleSwitcher
              currentLocale={props.currentLocale}
              currentPath={currentPath()}
            />
          )}
        </Show>
      </div>
    </nav>
  )
}
