import { createMemo, For, Show } from "solid-js"
import { localizedRoute } from "../routes.ts"
import type { NavRouteName } from "../routes.ts"
import type { Locale } from "./i18n.ts"
import { LocaleSwitcher } from "./locale-switcher.tsx"
import { siteCopy } from "./site-copy.ts"

export interface SiteNavProps {
  currentLocale: Locale
  currentPath: NavRouteName | undefined
}

const shellRouteNames = ["consulting", "cv"] as const

export const SiteNav = (props: SiteNavProps) => {
  const copy = createMemo(() => siteCopy[props.currentLocale])

  return (
    <nav
      aria-label={copy().navLabel}
      class="flex items-start justify-between gap-6 max-sm:gap-4"
    >
      <a
        href={localizedRoute(props.currentLocale, "home")}
        class="text-[0.9375rem] text-zinc-900 underline decoration-zinc-200 decoration-1 underline-offset-3 transition-colors hover:decoration-current"
      >
        {copy().siteTitle}
      </a>
      <div class="flex flex-wrap items-center justify-end gap-x-6 gap-y-3 max-sm:gap-x-4 max-sm:gap-y-2.5">
        <ul class="m-0 flex list-none flex-wrap items-center gap-6 p-0 max-sm:gap-4">
          <For each={shellRouteNames}>
            {path => (
              <li class="m-0 p-0">
                <a
                  href={localizedRoute(props.currentLocale, path)}
                  aria-current={path === props.currentPath ? "page" : undefined}
                  class="text-[0.9375rem] text-zinc-900 underline decoration-zinc-200 decoration-1 underline-offset-3 transition-colors hover:decoration-current"
                  classList={{
                    "font-medium decoration-current":
                      path === props.currentPath,
                  }}
                >
                  {copy()[path]}
                </a>
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
