import type { JSX } from "solid-js"
import type { Locale } from "../app/i18n.ts"
import { SiteNav } from "../app/site-nav.tsx"
import { HtmlRoot } from "./html-root.tsx"

export interface SiteShellProps {
  children: JSX.Element
  contentClass: string | undefined
  currentPath: "consulting" | "cv" | "home" | undefined
  description: string
  lang: Locale
  navClass: string | undefined
  title: string
}

export const SiteShell = (props: SiteShellProps) => {
  const defaultContentClass =
    "mx-auto prose px-6 pb-6 sm:px-8 sm:pb-12 md:pb-16 max-w-3xl"
  const headerWidth = props.currentPath === "cv" ? "max-w-prose" : "max-w-3xl"

  return (
    <HtmlRoot
      description={props.description}
      lang={props.lang}
      title={props.title}
    >
      <header
        class={`mx-auto mt-6 px-6 sm:mt-12 sm:px-8 md:mt-16 ${headerWidth} ${props.navClass ?? ""}`}
      >
        <SiteNav
          currentLocale={props.lang}
          currentPath={props.currentPath}
        />
      </header>
      <main class={props.contentClass ?? defaultContentClass}>{props.children}</main>
    </HtmlRoot>
  )
}
