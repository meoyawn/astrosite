import type { Root as MdastRoot } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import rehypeExternalLinks from "rehype-external-links"
import rehypeStringify from "rehype-stringify"
import type { Options as RemarkParseOptions } from "remark-parse"
import remarkRehype from "remark-rehype"
import { type Plugin, unified } from "unified"
import { externalLinkOptions } from "./markdown-options.ts"

/** `remark-parse` currently trips local typechecking, so we declare an equivalent plugin here. */
const remarkParsePlugin: Plugin<
  [(Readonly<RemarkParseOptions> | null | undefined)?],
  string,
  MdastRoot
> = function (options) {
  this.parser = document => fromMarkdown(document, options)
}

const processor = unified()
  .use(remarkParsePlugin)
  .use(remarkRehype)
  .use(rehypeExternalLinks, externalLinkOptions)
  .use(rehypeStringify)

export const md2html = (md: string): string =>
  processor.processSync(md).toString()
