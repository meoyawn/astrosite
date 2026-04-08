import rehypeExternalLinks from "rehype-external-links"
import rehypeStringify from "rehype-stringify"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeExternalLinks, { target: "_blank", rel: "noreferrer" })
  .use(rehypeStringify)

export const md2html = (md: string): string =>
  processor.processSync(md).toString()
