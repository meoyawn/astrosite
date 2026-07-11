import { For, Show } from "solid-js"
import type { Locale } from "./i18n.ts"
import { LocaleSwitcher, localeHrefFor } from "./locale-switcher.tsx"
import { siteCopy } from "./site-copy.ts"

export interface SiteNavProps {
  currentLocale: Locale
  currentPath: "consulting" | "cv" | "home" | undefined
}

export const SiteNav = (props: SiteNavProps) => {
  const copy = siteCopy[props.currentLocale]

  return (
    <nav
      aria-label={copy.navLabel}
      class="mb-6 flex flex-row flex-wrap items-center justify-between gap-3"
    >
      <ul class="m-0 flex list-none flex-row flex-wrap gap-x-4 gap-y-2 p-0">
        <For each={["home", "consulting", "cv"] as const}>
          {path => {
            const isCurrent = path === props.currentPath

            return (
              <li class="m-0 p-0">
                <a
                  href={localeHrefFor(props.currentLocale, path)}
                  aria-current={isCurrent ? "page" : undefined}
                  class={`text-base font-medium text-zinc-950 ${
                    isCurrent
                      ? "font-semibold underline decoration-zinc-950 decoration-2 underline-offset-[3px]"
                      : "hover-underline"
                  }`}
                >
                  {copy[path]}
                </a>
              </li>
            )
          }}
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
    </nav>
  )
}
