import type { JSX } from "solid-js"
import { localizedRoute } from "../routes.ts"
import { HtmlRoot } from "../layouts/html-root.tsx"
import { SiteDesignContract } from "../layouts/site-shell.tsx"
import { HomeIntro } from "./home-intro.tsx"
import type { Locale } from "./i18n.ts"
import { WritingList } from "./writing-list.tsx"

export interface HomePageProps {
  description: string
  locale: Locale
  title: string
}

export const HomePage = (props: HomePageProps): JSX.Element => (
  <HtmlRoot
    bodyStart={<SiteDesignContract />}
    canonicalPath={localizedRoute(props.locale, "home")}
    description={props.description}
    lang={props.locale}
    openGraphType="website"
    title={props.title}
  >
    <main class="mx-auto max-w-5xl px-5 pt-[clamp(5rem,12vw,9rem)] pb-24 max-sm:pt-18">
      <HomeIntro locale={props.locale} />
      <WritingList locale={props.locale} />
    </main>
  </HtmlRoot>
)
