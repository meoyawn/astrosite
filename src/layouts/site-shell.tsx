import { createMemo } from "solid-js"
import type { JSX } from "solid-js"
import { ssr } from "solid-js/web"
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

const isSolidSsrNode = (value: unknown): value is JSX.Element =>
  typeof value === "object" &&
  value !== null &&
  "t" in value &&
  typeof value.t === "string"

export const SiteDesignContract = (): JSX.Element => {
  const contract = ssr(`<!--
THESIS: One personal index makes current software and recent thinking legible without portfolio ceremony.
OWN-WORLD: White field, near-black ink, system-serif display, system-sans utility text, gray dates, underlined text links, no cards or shadows; Tailwind utilities own component styling.
STORY: Recognize Producing software, inspect three active projects, choose a direct profile link, then enter recent writing.
FIRST VIEWPORT: Oversized centered title above one project sentence and a quiet link row; recent posts begin below in a 680px left-aligned column.
FORM: User-pinned sparse author index, direction seed 3e47b0f3; the Mo.io reference outranks assigned candidate 4.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`)

  if (!isSolidSsrNode(contract)) {
    throw new TypeError("Site design contract could not be serialized")
  }

  return contract
}

export const SiteShell = (props: SiteShellProps) => {
  const defaultContentClass =
    "mx-auto max-w-3xl px-5 pt-[clamp(4.5rem,9vw,7rem)] pb-12 text-[1.0625rem] leading-7 text-zinc-900 prose prose-zinc sm:px-8 sm:pb-16 max-sm:pt-15 prose-h1:mt-0 prose-h1:mb-5 prose-h1:text-balance prose-h1:font-serif prose-h1:text-[clamp(3.25rem,8vw,4.75rem)] prose-h1:leading-[0.98] prose-h1:font-normal prose-h1:tracking-[-0.03em] prose-h2:text-balance prose-h2:tracking-[-0.02em] prose-h3:text-balance prose-h3:tracking-[-0.02em]"
  const headerWidth = createMemo(() =>
    props.currentPath === "cv" ? "max-w-prose" : "max-w-3xl",
  )

  return (
    <HtmlRoot
      bodyStart={props.bodyStart ?? <SiteDesignContract />}
      description={props.description}
      canonicalPath={props.canonicalPath}
      lang={props.lang}
      openGraphType={props.openGraphType}
      title={props.title}
    >
      <header
        class={`mx-auto bg-transparent px-5 pt-[clamp(2rem,7vw,5rem)] sm:px-8 ${headerWidth()} ${props.navClass ?? ""}`}
      >
        <SiteNav
          currentLocale={props.lang}
          currentPath={props.currentPath}
        />
      </header>
      <main class={props.contentClass ?? defaultContentClass}>{props.children}</main>
      <footer class="mx-auto mt-16 max-w-3xl border-t border-zinc-200 px-5 py-8 text-[0.8125rem] text-zinc-600 sm:px-8 print:hidden">
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
