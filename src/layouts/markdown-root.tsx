import type { Locale } from "../app/i18n.ts"
import type { PageLayoutProps } from "../../tooling/vite-static-site/render.tsx"
import { SiteShell } from "./site-shell.tsx"

interface MarkdownFrontmatter extends Record<string, unknown> {
  description: string
  lang?: Locale | undefined
  layout: string
  title: string
}

const MarkdownRoot = (props: PageLayoutProps<MarkdownFrontmatter>) => {
  const segments = props.route.path.split("/").filter(Boolean)
  const currentPath =
    segments.length === 0 ||
    (segments.length === 1 && segments[0] === props.frontmatter.lang)
      ? "home"
      : segments.at(-1) === "consulting"
        ? "consulting"
        : undefined

  return (
    <SiteShell
      contentClass={undefined}
      currentPath={currentPath}
      description={props.frontmatter.description}
      lang={props.frontmatter.lang ?? "en"}
      navClass={undefined}
      title={props.frontmatter.title}
    >
      {props.children}
    </SiteShell>
  )
}

export default MarkdownRoot
