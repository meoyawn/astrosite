import type { JSX } from "solid-js"
import { ssr } from "solid-js/web"
import type { Locale } from "../app/i18n.ts"
import type { NavRouteName } from "../routes.ts"
import { SiteNav } from "../app/site-nav.tsx"
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
OWN-WORLD: White field, near-black ink, bold system-sans display and reading titles, gray dates, semibold content links with offset gray underlines and a blue CV accent, plain text navigation, pale text selection, relaxed reading rhythm, no cards or shadows; Tailwind utilities own component styling.
STORY: Recognize Producing software, inspect Listenbox and StrengthMCP, choose a direct profile link, then enter recent writing.
FIRST VIEWPORT: Oversized centered title above one project sentence and a quiet link row; recent posts begin below in a 680px left-aligned column.
FORM: User-pinned sparse author index, direction seed 3e47b0f3; the Mo.io reference outranks assigned candidate 4.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`)

  if (!isSolidSsrNode(contract)) {
    throw new TypeError("Site design contract could not be serialized")
  }

  return contract
}

const readingCodeClass =
  "prose-code:rounded prose-code:bg-code-inline-background prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:font-medium prose-code:tracking-normal prose-code:wrap-anywhere prose-code:text-code-inline-ink prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-lg prose-pre:bg-code-background prose-pre:p-5 prose-pre:font-mono prose-pre:text-code prose-pre:font-medium prose-pre:tracking-normal prose-pre:text-code-foreground prose-pre:[font-variant-ligatures:none] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-medium [&_pre_code]:wrap-normal [&_pre_code]:text-inherit"

export const readingContentClass =
  `mx-auto w-full max-w-3xl px-5 pt-[clamp(4.5rem,9vw,7rem)] pb-12 text-[1.0625rem] leading-reading tracking-normal text-zinc-900 prose prose-zinc sm:px-8 sm:pb-16 max-sm:pt-15 prose-h1:mt-0 prose-h1:mb-5 prose-h1:text-balance prose-h1:font-sans prose-h1:text-reading-title prose-h1:font-bold prose-h1:tracking-tight prose-h2:text-balance prose-h2:tracking-[-0.02em] prose-h3:text-balance prose-h3:tracking-[-0.02em] prose-table:block prose-table:max-w-full prose-table:overflow-x-auto ${readingCodeClass}`

export const SiteShell = (props: SiteShellProps) => {
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
        class={`mx-auto max-w-3xl bg-transparent px-5 pt-[clamp(2rem,7vw,5rem)] sm:px-8 ${props.navClass ?? ""}`}
      >
        <SiteNav
          currentLocale={props.lang}
          currentPath={props.currentPath}
        />
      </header>
      {/* A grid item keeps WebKit selection from filling paragraph gaps and page margins. */}
      <div class="grid grid-cols-1 print:block">
        <main class={props.contentClass ?? readingContentClass}>{props.children}</main>
      </div>
    </HtmlRoot>
  )
}
