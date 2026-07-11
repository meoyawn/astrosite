import type { Root as MdastRoot } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import type { Options as RemarkParseOptions } from "remark-parse"
import remarkRehype from "remark-rehype"
import { type Plugin, unified } from "unified"

const remarkParsePlugin: Plugin<
  [(Readonly<RemarkParseOptions> | null | undefined)?],
  string,
  MdastRoot
> = function (options) {
  this.parser = document => fromMarkdown(document, options)
}

export const createMarkdownProcessor = () =>
  unified().use(remarkParsePlugin).use(remarkRehype)
