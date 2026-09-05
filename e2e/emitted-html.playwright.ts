import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { expect, test } from "@playwright/test"
import postcss from "postcss"
import { routes } from "../src/routes.ts"
import {
  builtOrigin,
  collectHtmlTargets,
  distDir,
  markdown404SourceFor,
  routeBuiltFiles,
  siteUrl,
  socialImagePattern,
} from "./site.ts"

const htmlTargets = (await collectHtmlTargets()).toSorted((left, right) =>
  left.fileName.localeCompare(right.fileName),
)

if (htmlTargets.length === 0) {
  throw new Error(`Expected at least one HTML route from ${siteUrl ?? distDir}.`)
}

test.describe("emitted HTML", () => {
  for (const target of htmlTargets) {
    test.describe(target.fileName, () => {
      test("has matching HTML and social metadata", async ({ page }) => {
        const markdown404 = await markdown404SourceFor(target)

        if (markdown404 !== undefined) {
          expect(markdown404).toMatch(/^\s*# Page not found/m)
          expect(markdown404).toContain("[sitemap](/sitemap.xml)")
          expect(markdown404).toContain("[agent index](/llms.txt)")
          return
        }

        await routeBuiltFiles(page)

        const response = await page.goto(`${builtOrigin}${target.pagePath}`)

        expect(
          response?.ok() ?? false,
          `Expected Playwright to load HTML route: ${target.pagePath}.`,
        ).toEqual(true)

        const title = page.locator("head > title")
        const description = page.locator('meta[name="description"]')
        const openGraphTitle = page.locator('meta[property="og:title"]')
        const openGraphDescription = page.locator(
          'meta[property="og:description"]',
        )
        const openGraphType = page.locator('meta[property="og:type"]')
        const openGraphUrl = page.locator('meta[property="og:url"]')
        const openGraphImage = page.locator('meta[property="og:image"]')
        const openGraphImageType = page.locator(
          'meta[property="og:image:type"]',
        )
        const openGraphImageWidth = page.locator(
          'meta[property="og:image:width"]',
        )
        const openGraphImageHeight = page.locator(
          'meta[property="og:image:height"]',
        )
        const openGraphImageAlt = page.locator(
          'meta[property="og:image:alt"]',
        )
        const twitterCard = page.locator('meta[name="twitter:card"]')
        const twitterSite = page.locator('meta[name="twitter:site"]')
        const twitterCreator = page.locator('meta[name="twitter:creator"]')
        const twitterTitle = page.locator('meta[name="twitter:title"]')
        const twitterDescription = page.locator(
          'meta[name="twitter:description"]',
        )
        const twitterImage = page.locator('meta[name="twitter:image"]')
        const twitterImageAlt = page.locator(
          'meta[name="twitter:image:alt"]',
        )

        await expect(title).toHaveCount(1)
        await expect(description).toHaveCount(1)
        await expect(openGraphTitle).toHaveCount(1)
        await expect(openGraphDescription).toHaveCount(1)
        await expect(openGraphType).toHaveCount(1)
        await expect(openGraphUrl).toHaveCount(0)
        await expect(openGraphImage).toHaveCount(1)
        await expect(openGraphImageType).toHaveCount(1)
        await expect(openGraphImageWidth).toHaveCount(1)
        await expect(openGraphImageHeight).toHaveCount(1)
        await expect(openGraphImageAlt).toHaveCount(1)
        await expect(twitterCard).toHaveCount(1)
        await expect(twitterSite).toHaveCount(1)
        await expect(twitterCreator).toHaveCount(1)
        await expect(twitterTitle).toHaveCount(1)
        await expect(twitterDescription).toHaveCount(1)
        await expect(twitterImage).toHaveCount(1)
        await expect(twitterImageAlt).toHaveCount(1)
        await expect(description).toHaveAttribute("content", /\S/)

        const titleText = await page.title()
        const descriptionContent = await description.getAttribute("content")

        expect(titleText).toMatch(/\S/)

        if (descriptionContent === null) {
          throw new Error(
            `Expected ${target.pagePath} to have title and description metadata.`,
          )
        }

        await expect(openGraphTitle).toHaveAttribute("content", titleText)
        await expect(openGraphDescription).toHaveAttribute(
          "content",
          descriptionContent,
        )
        await expect(openGraphType).toHaveAttribute(
          "content",
          target.pagePath.startsWith(routes.writing) ? "article" : "website",
        )
        await expect(openGraphImage).toHaveAttribute(
          "content",
          socialImagePattern,
        )
        await expect(openGraphImageType).toHaveAttribute(
          "content",
          "image/png",
        )
        await expect(openGraphImageWidth).toHaveAttribute("content", "1200")
        await expect(openGraphImageHeight).toHaveAttribute("content", "630")
        await expect(openGraphImageAlt).toHaveAttribute("content", /\S/)
        await expect(twitterCard).toHaveAttribute("content", "summary")
        await expect(twitterSite).toHaveAttribute("content", "@meoyawn")
        await expect(twitterCreator).toHaveAttribute("content", "@meoyawn")
        await expect(twitterTitle).toHaveAttribute("content", titleText)
        await expect(twitterDescription).toHaveAttribute(
          "content",
          descriptionContent,
        )
        await expect(twitterImage).toHaveAttribute(
          "content",
          socialImagePattern,
        )

        const openGraphImageContent = await openGraphImage.getAttribute(
          "content",
        )
        const openGraphImageAltContent = await openGraphImageAlt.getAttribute(
          "content",
        )

        if (
          openGraphImageContent === null ||
          openGraphImageAltContent === null
        ) {
          throw new Error(
            `Expected ${target.pagePath} to have Open Graph image metadata.`,
          )
        }

        await expect(twitterImage).toHaveAttribute(
          "content",
          openGraphImageContent,
        )
        await expect(twitterImageAlt).toHaveAttribute(
          "content",
          openGraphImageAltContent,
        )
      })

      test("references parseable CSS assets", async ({ page }) => {
        function collectStylesheetHrefs(html: string): string[] {
          return [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].flatMap(
            match => (match[1] === undefined ? [] : [match[1]]),
          )
        }

        const markdown404 = await markdown404SourceFor(target)

        if (markdown404 !== undefined) {
          expect(markdown404).toMatch(/^\s*# Page not found/m)
          expect(markdown404).toContain("[sitemap](/sitemap.xml)")
          return
        }

        await routeBuiltFiles(page)

        const response = await page.goto(`${builtOrigin}${target.pagePath}`)

        expect(
          response?.ok() ?? false,
          `Expected Playwright to load HTML route: ${target.pagePath}.`,
        ).toEqual(true)

        const loadedStylesheetHrefs = await page
          .locator('link[rel="stylesheet"]')
          .evaluateAll(links =>
            links.flatMap(link => {
              const href = link.getAttribute("href")

              return href === null ? [] : [href]
            }),
          )

        expect(
          loadedStylesheetHrefs.length,
          `Expected ${target.pagePath} to reference at least one stylesheet.`,
        ).toBeGreaterThan(0)

        if (target.diskPath !== undefined) {
          expect(loadedStylesheetHrefs).toEqual(
            collectStylesheetHrefs(readFileSync(target.diskPath, "utf8")),
          )
        }

        for (const href of loadedStylesheetHrefs) {
          if (target.diskPath !== undefined) {
            const stylesheetPath = join(distDir, href.replace(/^\//, ""))

            expect(
              existsSync(stylesheetPath),
              `Expected ${target.fileName} to reference an existing stylesheet: ${href}.`,
            ).toEqual(true)

            expect(() =>
              postcss.parse(readFileSync(stylesheetPath, "utf8")),
            ).not.toThrow()
          } else {
            const stylesheetUrl = new URL(href, builtOrigin)

            stylesheetUrl.searchParams.set("direct", "")
            const stylesheetResponse = await page.request.get(
              stylesheetUrl.toString(),
            )

            expect(stylesheetResponse.ok()).toEqual(true)
            expect(stylesheetResponse.headers()["content-type"]).toContain(
              "text/css",
            )
            const stylesheet = await stylesheetResponse.text()

            expect(() => postcss.parse(stylesheet)).not.toThrow()
          }
        }
      })

      test("references a processed SVG favicon", async ({ page }) => {
        const markdown404 = await markdown404SourceFor(target)

        if (markdown404 !== undefined) {
          expect(markdown404).toMatch(/^\s*# Page not found/m)
          expect(markdown404).toContain("[home page](/")
          return
        }

        await routeBuiltFiles(page)

        const response = await page.goto(`${builtOrigin}${target.pagePath}`)

        expect(response?.ok() ?? false).toEqual(true)

        const favicon = page.locator('link[rel="icon"][type="image/svg+xml"]')

        await expect(favicon).toHaveCount(1)

        const href = await favicon.getAttribute("href")

        if (href === null) {
          throw new Error(
            `Expected ${target.pagePath} to reference an SVG favicon.`,
          )
        }

        expect(href).toMatch(/^\/[^?]+\.svg$/)
        expect(href).not.toContain("/src/")

        if (target.diskPath !== undefined) {
          const faviconPath = join(distDir, href.replace(/^\//, ""))

          expect(
            existsSync(faviconPath),
            `Expected ${target.fileName} to reference an existing favicon: ${href}.`,
          ).toEqual(true)
        }

        const faviconResponse = await page.goto(`${builtOrigin}${href}`)

        expect(faviconResponse?.ok() ?? false).toEqual(true)
        expect(faviconResponse?.headers()["content-type"]).toContain(
          "image/svg+xml",
        )
        await expect(page.locator("svg")).toHaveCount(1)
      })
    })
  }
})
