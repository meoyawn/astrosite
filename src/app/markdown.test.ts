import { describe, expect, test } from "vitest"

import { md2html } from "./markdown"

describe("md2html", () => {
  test("converts markdown into html", () => {
    expect(md2html("## Hello\n\nParagraph with **bold** text.")).toEqual(
      "<h2>Hello</h2>\n<p>Paragraph with <strong>bold</strong> text.</p>",
    )
  })

  test("adds external link attributes without touching relative links", () => {
    expect(
      md2html("[external](https://example.com) and [internal](/about)"),
    ).toEqual(
      '<p><a href="https://example.com" rel="noreferrer" target="_blank">external</a> and <a href="/about">internal</a></p>',
    )
  })
})
