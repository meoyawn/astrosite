import { Show } from "solid-js"
import GithubSlugger from "github-slugger"
import {
  parseWritingEntry,
  type WritingEntry,
} from "../../app/static-site-types.ts"
import { SiteShell } from "../../layouts/site-shell.tsx"
import { writingRoute } from "../../routes.ts"
import { getCollection } from "solid-static/runtime"

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

const alignFragmentTargetScript = String.raw`
{
  const initialFragment = location.hash
  let targetId = initialFragment.slice(1)

  try {
    targetId = decodeURIComponent(targetId)
  } catch {
    targetId = initialFragment.slice(1)
  }

  const target = document.getElementById(targetId)

  if (target !== null) {
    const interruptionEvents = ["keydown", "pointerdown", "touchstart", "wheel"]
    const root = document.documentElement
    const observer = new ResizeObserver(alignTarget)

    function stopTracking() {
      observer.disconnect()
      removeEventListener("hashchange", stopTracking)
      removeEventListener("pagehide", stopTracking)
      for (const eventName of interruptionEvents) {
        removeEventListener(eventName, stopTracking)
      }
    }

    function alignTarget() {
      if (location.hash !== initialFragment) {
        stopTracking()
        return
      }

      const scrollBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = "auto"
      target.scrollIntoView({ block: "start", inline: "nearest" })
      root.style.scrollBehavior = scrollBehavior
    }

    addEventListener("hashchange", stopTracking, { once: true })
    addEventListener("pagehide", stopTracking, { once: true })
    for (const eventName of interruptionEvents) {
      addEventListener(eventName, stopTracking, { once: true, passive: true })
    }
    observer.observe(document.body)
  }
}
`

const ArticlePage = (props: ArticlePageProps) => {
  const titleId = new GithubSlugger().slug(props.entry.data.title)
  const shouldShowUpdatedAt =
    props.entry.data.published_at !== undefined &&
    props.entry.data.updated_at !== undefined &&
    dateTime(props.entry.data.updated_at) !==
      dateTime(props.entry.data.published_at)

  return (
    <SiteShell
      canonicalPath={writingRoute(props.entry.id)}
      contentClass={undefined}
      currentPath={undefined}
      description={props.entry.data.description}
      lang="en"
      navClass={undefined}
      openGraphType="article"
      title={props.entry.data.title}
    >
      <h1 id={titleId} class="-mt-6! mb-0 text-5xl! sm:-mt-10!">
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
      <script>{alignFragmentTargetScript}</script>
    </SiteShell>
  )
}

export default ArticlePage
