import { For, Show } from "solid-js"
import { getCollection } from "solid-static/runtime"
import { writingRoute } from "../routes.ts"
import type { Locale } from "./i18n.ts"
import { siteCopy } from "./site-copy.ts"
import {
  parseWritingEntry,
  type WritingEntry,
} from "./static-site-types.ts"

export interface WritingListProps {
  locale: Locale
}

const dateTime = (date: Date): string => date.toISOString().slice(0, 10)

const formatDate = (date: Date, locale: Locale): string =>
  new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date)

export const WritingList = (props: WritingListProps) => {
  const published = getCollection("writing")
    .map(parseWritingEntry)
    .filter(
      (entry): entry is WritingEntry & {
        data: WritingEntry["data"] & { published_at: Date }
      } => entry.data.published_at !== undefined,
    )
    .sort(
      (left, right) =>
        right.data.published_at.getTime() - left.data.published_at.getTime(),
    )

  return (
    <Show when={published.length > 0}>
      <section
        aria-labelledby="writing-heading"
        class="mx-auto w-full max-w-[42.5rem]"
      >
        <h2
          id="writing-heading"
          class="mb-3 text-[0.8125rem] leading-5 font-semibold tracking-[0.05em] text-zinc-600 uppercase"
        >
          {siteCopy[props.locale].recent}
        </h2>
        <ol class="m-0 list-none p-0">
          <For each={published}>
            {entry => (
              <li class="m-0 p-0">
                <article class="m-0 p-0">
                  <a
                    href={writingRoute(entry.id)}
                    class="group block py-1.5 text-zinc-900 no-underline"
                  >
                    <time
                      datetime={dateTime(entry.data.published_at)}
                      class="mb-0.5 block text-[0.8125rem] leading-5 text-zinc-500 tabular-nums"
                    >
                      {formatDate(entry.data.published_at, props.locale)}
                    </time>
                    <h3 class="m-0 inline text-lg leading-6 font-medium tracking-[-0.01em] underline decoration-transparent decoration-1 underline-offset-3 transition-colors group-hover:decoration-current">
                      {entry.data.title}
                    </h3>
                  </a>
                </article>
              </li>
            )}
          </For>
        </ol>
      </section>
    </Show>
  )
}
