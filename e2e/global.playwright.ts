import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { expect, test } from "@playwright/test"
import postcss from "postcss"

const builtOrigin = "http://built.local"
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

const contentTypeFor = (filePath: string): string => {
  if (filePath.endsWith(".css")) {
    return "text/css"
  }

  if (filePath.endsWith(".html")) {
    return "text/html"
  }

  if (filePath.endsWith(".svg")) {
    return "image/svg+xml"
  }

  return "application/octet-stream"
}

const filePathFor = (pathname: string): string => {
  const requestedPath = decodeURIComponent(pathname).replace(/^\//, "")

  return join(distDir, requestedPath === "" ? "index.html" : requestedPath)
}

const pagePathFor = (htmlFile: string): string =>
  `/${relative(distDir, htmlFile)}`

test.describe("e2e tests", () => {
  test("every emitted html file references parseable css assets", async ({
    page,
  }) => {
    await page.route("**/*", async route => {
      const requestUrl = new URL(route.request().url())

      if (requestUrl.origin !== builtOrigin) {
        await route.abort()
        return
      }

      const filePath = filePathFor(requestUrl.pathname)

      if (!existsSync(filePath)) {
        await route.fulfill({
          status: 404,
          body: "Not found",
          contentType: "text/plain",
        })
        return
      }

      await route.fulfill({
        path: filePath,
        contentType: contentTypeFor(filePath),
      })
    })

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

      const response = await page.goto(`${builtOrigin}${pagePathFor(htmlFile)}`)

      expect(
        response?.ok() ?? false,
        `Expected Playwright to load built HTML file: ${htmlFile}.`,
      ).toEqual(true)

      const loadedStylesheetHrefs = await page
        .locator('link[rel="stylesheet"]')
        .evaluateAll(links =>
          links.flatMap(link => {
            const href = link.getAttribute("href")

            return href === null ? [] : [href]
          }),
        )

      expect(loadedStylesheetHrefs).toEqual(stylesheetHrefs)

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
