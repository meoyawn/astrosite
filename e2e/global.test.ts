import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import postcss from "postcss"
import { describe, expect, test } from "vitest"

const distDir = "dist"

const collectHtmlFiles = (dirPath: string): string[] =>
  readdirSync(dirPath).flatMap(entry => {
    const entryPath = join(dirPath, entry)
    const entryStat = statSync(entryPath)

    if (entryStat.isDirectory()) {
      return collectHtmlFiles(entryPath)
    }

    return entryPath.endsWith(".html") ? [entryPath] : []
  })

const collectStylesheetHrefs = (html: string): string[] =>
  [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].flatMap(
    match => (match[1] === undefined ? [] : [match[1]]),
  )

describe("built global css", () => {
  test("every emitted html file references parseable css assets", () => {
    expect(
      existsSync(distDir),
      "Expected dist/ to exist before running this test.",
    ).toEqual(true)

    const htmlFiles = collectHtmlFiles(distDir)

    expect(
      htmlFiles.length,
      "Expected at least one built HTML file in dist/.",
    ).toBeGreaterThan(0)

    for (const htmlFile of htmlFiles) {
      const html = readFileSync(htmlFile, "utf8")
      const stylesheetHrefs = collectStylesheetHrefs(html)

      expect(
        stylesheetHrefs.length,
        `Expected ${htmlFile} to reference at least one stylesheet.`,
      ).toBeGreaterThan(0)

      for (const href of stylesheetHrefs) {
        const stylesheetPath = join(distDir, href.replace(/^\//, ""))

        expect(
          existsSync(stylesheetPath),
          `Expected ${htmlFile} to reference an existing stylesheet: ${href}.`,
        ).toEqual(true)

        expect(() =>
          postcss.parse(readFileSync(stylesheetPath, "utf8")),
        ).not.toThrow()
      }
    }
  })
})
