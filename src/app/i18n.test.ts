import { describe, expect, test } from "vitest"

import { normalizeLocaleHref } from "./i18n"

describe("normalizeLocaleHref", () => {
  test("preserves the root path", () => {
    expect(normalizeLocaleHref("/")).toEqual("/")
  })

  test("removes trailing slashes from non-root locale paths", () => {
    expect(normalizeLocaleHref("/ru/")).toEqual("/ru")
    expect(normalizeLocaleHref("/ru/about/")).toEqual("/ru/about")
    expect(normalizeLocaleHref("/tt/")).toEqual("/tt")
    expect(normalizeLocaleHref("/tt/cv/")).toEqual("/tt/cv")
  })

  test("leaves non-root paths without trailing slashes unchanged", () => {
    expect(normalizeLocaleHref("/en")).toEqual("/en")
    expect(normalizeLocaleHref("/en/about")).toEqual("/en/about")
    expect(normalizeLocaleHref("/tt")).toEqual("/tt")
  })
})
