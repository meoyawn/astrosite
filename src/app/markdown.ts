import rehypeExternalLinks from "rehype-external-links"
import rehypeStringify from "rehype-stringify"
import type { Root } from "mdast"
import type { Options } from "remark-parse"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { type Plugin, unified } from "unified"

const remarkParseCompat: Plugin<
  [(Readonly<Options> | null | undefined)?],
  string,
  Root
> = function (...parameters) {
  // Bun resolved duplicate `unified` packages, so the plugin's `this` type is nominally off.
  // @ts-expect-error `remark-parse` remains runtime-compatible with the processor we pass here.
  return remarkParse.call(this, ...parameters)
}

const processor = unified()
  .use(remarkParseCompat)
  .use(remarkRehype)
  .use(rehypeExternalLinks, { target: "_blank", rel: "noreferrer" })
  .use(rehypeStringify)

export const md2html = (md: string): string =>
  processor.processSync(md).toString()
