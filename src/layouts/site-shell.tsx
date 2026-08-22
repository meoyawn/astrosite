import type { JSX } from "solid-js"
import type { Locale } from "../app/i18n.ts"
import { trustRoutes } from "../routes.ts"
import type { NavRouteName } from "../routes.ts"
import { SiteNav } from "../app/site-nav.tsx"
import { siteCopy } from "../app/site-copy.ts"
import { HtmlRoot } from "./html-root.tsx"

export interface SiteShellProps {
  bodyStart?: JSX.Element
  canonicalPath: string
  children: JSX.Element
  contentClass: string | undefined
  currentPath: NavRouteName | undefined
  description: string
  lang: Locale
  navClass: string | undefined
  openGraphType: "article" | "website"
  title: string
}

export const SiteShell = (props: SiteShellProps) => {
  const defaultContentClass =
    "mx-auto prose px-6 pb-6 sm:px-8 sm:pb-12 md:pb-16 max-w-3xl"
  const headerWidth = props.currentPath === "cv" ? "max-w-prose" : "max-w-3xl"

  return (
    <HtmlRoot
      description={props.description}
      canonicalPath={props.canonicalPath}
      lang={props.lang}
      openGraphType={props.openGraphType}
      title={props.title}
    >
      {props.bodyStart}
      <header
        class={`mx-auto mt-6 bg-transparent px-6 sm:mt-12 sm:px-8 md:mt-16 ${headerWidth} ${props.navClass ?? ""}`}
      >
        <SiteNav
          currentLocale={props.lang}
          currentPath={props.currentPath}
        />
      </header>
      <main class={props.contentClass ?? defaultContentClass}>{props.children}</main>
      <footer class="mx-auto mt-12 max-w-3xl border-t border-zinc-200 px-6 py-6 text-sm text-zinc-600 sm:px-8 print:hidden">
        <nav aria-label={siteCopy[props.lang].footerLabel}>
          <ul class="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
            <li class="m-0 p-0">
              <a
                class="hover-underline"
                href={trustRoutes.about}
              >
                {siteCopy[props.lang].about}
              </a>
            </li>
            <li class="m-0 p-0">
              <a
                class="hover-underline"
                href={trustRoutes.contact}
              >
                {siteCopy[props.lang].contact}
              </a>
            </li>
            <li class="m-0 p-0">
              <a
                class="hover-underline"
                href={trustRoutes.privacy}
              >
                {siteCopy[props.lang].privacy}
              </a>
            </li>
          </ul>
        </nav>
      </footer>
    </HtmlRoot>
  )
}
