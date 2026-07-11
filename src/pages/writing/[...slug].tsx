import { Show } from "solid-js"
import GithubSlugger from "github-slugger"
import {
  parseWritingEntry,
  type WritingEntry,
} from "../../app/static-site-types.ts"
import { SiteShell } from "../../layouts/site-shell.tsx"
import { getCollection } from "vite-static-site/runtime"

export interface ArticlePageProps {
  entry: WritingEntry
}

export const getStaticPaths = () =>
  getCollection("writing").map(parseWritingEntry).map(entry => ({
    params: { slug: entry.id },
    props: { entry },
  }))

const dateTime = (date: Date): string => date.toISOString().slice(0, 10)

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date)

const ArticlePage = (props: ArticlePageProps) => {
  const titleId = new GithubSlugger().slug(props.entry.data.title)
  const shouldShowUpdatedAt =
    props.entry.data.published_at !== undefined &&
    props.entry.data.updated_at !== undefined &&
    dateTime(props.entry.data.updated_at) !==
      dateTime(props.entry.data.published_at)

  return (
    <SiteShell
      contentClass={undefined}
      currentPath={undefined}
      description={props.entry.data.description}
      lang="en"
      navClass={undefined}
      title={props.entry.data.title}
    >
      <h1 id={titleId} class="mb-0">
        {props.entry.data.title}
      </h1>
      <p class="not-prose mt-2 mb-8 text-sm leading-6 font-medium text-zinc-500">
        <Show when={props.entry.data.published_at} fallback="Draft">
          {publishedAt => (
            <>
              Published{" "}
              <time datetime={dateTime(publishedAt())}>
                {formatDate(publishedAt())}
              </time>
              <Show when={shouldShowUpdatedAt && props.entry.data.updated_at}>
                {updatedAt => (
                  <>
                    {". "}Updated{" "}
                    <time datetime={dateTime(updatedAt())}>
                      {formatDate(updatedAt())}
                    </time>
                  </>
                )}
              </Show>
            </>
          )}
        </Show>
      </p>
      <article innerHTML={props.entry.rendered.html} />
    </SiteShell>
  )
}

export default ArticlePage
