import { createMemo } from "solid-js"
import type { Locale } from "./i18n.ts"
import { LocaleSwitcher } from "./locale-switcher.tsx"
import { siteCopy } from "./site-copy.ts"

export interface HomeIntroProps {
  locale: Locale
}

export const HomeIntro = (props: HomeIntroProps) => {
  const copy = createMemo(() => siteCopy[props.locale])

  return (
    <section class="text-center" aria-labelledby="home-title">
      <h1
        id="home-title"
        class="m-0 font-serif text-[clamp(2.3rem,9vw,6rem)] leading-[0.96] font-normal tracking-[-0.03em] text-balance text-zinc-900"
      >
        {copy().siteTitle}
      </h1>
      <p class="mx-auto mt-5 max-w-[58ch] text-[1.0625rem] leading-6 text-zinc-600 max-sm:max-w-[32ch] max-sm:text-base">
        {copy().workingOn}{" "}
        <a
          class="text-inherit hover-underline"
          href="https://listenbox.app"
          rel="noreferrer"
          target="_blank"
        >
          Listenbox
        </a>
        {", "}
        <a
          class="text-inherit hover-underline"
          href="https://arrowbox.co"
          rel="noreferrer"
          target="_blank"
        >
          Arrowbox
        </a>
        {` ${copy().and} `}
        <a
          class="text-inherit hover-underline"
          href="https://responsibleapi.com"
          rel="noreferrer"
          target="_blank"
        >
          ResponsibleAPI
        </a>
        {"."}
      </p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 max-sm:gap-x-4">
        <nav aria-label={copy().profileLinksLabel}>
          <ul class="m-0 flex list-none flex-wrap items-center gap-5 p-0 max-sm:gap-4">
            <li>
              <a
                class="text-sm text-zinc-500 no-underline transition-colors hover:text-zinc-900"
                href="https://github.com/meoyawn"
                rel="noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                class="text-sm text-zinc-500 no-underline transition-colors hover:text-zinc-900"
                href="https://www.linkedin.com/in/adelnizamuddin"
                rel="noreferrer"
                target="_blank"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                class="text-sm text-zinc-500 no-underline transition-colors hover:text-zinc-900"
                href="mailto:mail@adelnz.com"
              >
                {copy().email}
              </a>
            </li>
          </ul>
        </nav>
        <div class="border-l border-zinc-200 pl-5 max-sm:pl-4">
          <LocaleSwitcher currentLocale={props.locale} currentPath="home" />
        </div>
      </div>
    </section>
  )
}
