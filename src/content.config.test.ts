import { describe, expect, test } from "bun:test"
import { parseWritingData } from "./content.config.ts"

describe("writing collection schema", () => {
  test("accepts the complete writing frontmatter contract", () => {
    const publishedAt = new Date("2026-05-29")

    expect(
      parseWritingData(
        {
          description: "Description",
          published_at: publishedAt,
          teaser: "Teaser",
          title: "Title",
        },
        "valid.md",
      ),
    ).toEqual({
      description: "Description",
      published_at: publishedAt,
      teaser: "Teaser",
      title: "Title",
    })
  })

  test("rejects missing collection fields", () => {
    expect(() =>
      parseWritingData(
        {
          description: "Description",
          title: "Title",
        },
        "missing-teaser.md",
      ),
    ).toThrow("writing collection schema")
  })

  test("rejects non-date publication metadata", () => {
    expect(() =>
      parseWritingData(
        {
          description: "Description",
          published_at: "2026-05-29",
          teaser: "Teaser",
          title: "Title",
        },
        "invalid-date.md",
      ),
    ).toThrow("writing collection schema")
  })
})
