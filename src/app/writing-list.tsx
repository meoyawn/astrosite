import { For, Show } from "solid-js"
import type { Locale } from "./i18n.ts"
import { siteCopy } from "./site-copy.ts"
import {
  parseWritingEntry,
  type WritingEntry,
} from "./static-site-types.ts"
import { getCollection } from "../../tooling/vite-static-site/runtime.ts"

export interface WritingListProps {
  title?: string | undefined
}

const localeForTitle = (title: string | undefined): Locale => {
  if (title === siteCopy.ru.writing) {
    return "ru"
  }

  if (title === siteCopy.tt.writing) {
    return "tt"
  }

  return "en"
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
  const locale = localeForTitle(props.title)
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
      <section aria-labelledby="writing-heading" class="not-prose mt-12">
        <h2
          id="writing-heading"
          class="mb-4 text-2xl leading-none font-bold text-slate-900"
        >
          {props.title ?? siteCopy.en.writing}
        </h2>
        <ol class="m-0 divide-y divide-zinc-200 border-y border-zinc-200 p-0">
          <For each={published}>
            {entry => (
              <li class="list-none py-4">
                <time
                  datetime={dateTime(entry.data.published_at)}
                  class="mb-1 block text-sm leading-6 font-medium text-zinc-500 tabular-nums"
                >
                  {formatDate(entry.data.published_at, locale)}
                </time>
                <article class="min-w-0">
                  <a
                    href={`/writing/${entry.id}/`}
                    class="text-lg leading-6 font-semibold text-slate-900 hover-underline"
                  >
                    {entry.data.title}
                  </a>
                  <p class="mt-1 max-w-[44ch] text-base leading-7 text-zinc-600">
                    {entry.data.teaser}
                  </p>
                </article>
              </li>
            )}
          </For>
        </ol>
      </section>
    </Show>
  )
}
