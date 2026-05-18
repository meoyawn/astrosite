import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { expect, type Page, test } from "@playwright/test"
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

  if (requestedPath === "" || requestedPath.endsWith("/")) {
    return join(distDir, `${requestedPath}index.html`)
  }

  const directPath = join(distDir, requestedPath)

  if (existsSync(directPath) && statSync(directPath).isDirectory()) {
    return join(directPath, "index.html")
  }

  return directPath
}

const pagePathFor = (htmlFile: string): string =>
  `/${relative(distDir, htmlFile)}`

const routeBuiltFiles = async (page: Page): Promise<void> => {
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
}

test.describe("e2e tests", () => {
  test("every emitted html file references parseable css assets", async ({
    browser,
  }) => {
    expect(
      existsSync(distDir),
      "Expected dist/ to exist before running this test.",
    ).toEqual(true)

    const htmlFiles = collectHtmlFiles(distDir)

    expect(
      htmlFiles.length,
      "Expected at least one built HTML file in dist/.",
    ).toBeGreaterThan(0)

    await Promise.all(
      htmlFiles.map(async htmlFile => {
        const page = await browser.newPage()

        try {
          await routeBuiltFiles(page)

          const html = readFileSync(htmlFile, "utf8")
          const stylesheetHrefs = collectStylesheetHrefs(html)

          expect(
            stylesheetHrefs.length,
            `Expected ${htmlFile} to reference at least one stylesheet.`,
          ).toBeGreaterThan(0)

          const response = await page.goto(
            `${builtOrigin}${pagePathFor(htmlFile)}`,
          )

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
        } finally {
          await page.close()
        }
      }),
    )
  })

  test("consulting page presents business consulting details", async ({
    page,
  }) => {
    await routeBuiltFiles(page)

    expect(
      existsSync(join(distDir, "consulting", "index.html")),
      "Expected /consulting/ to be emitted as static HTML.",
    ).toEqual(true)

    const response = await page.goto(`${builtOrigin}/consulting/`)

    expect(response?.ok() ?? false).toEqual(true)
    await expect(
      page.getByRole("heading", { level: 1, name: "Adel Nizamutdinov" }),
    ).toBeVisible()
    await expect(
      page.getByText(
        "Senior software engineering consulting through Pneuma LLC.",
      ),
    ).toBeVisible()
    await expect(
      page.getByText(
        "I help business clients build, repair, and review production software",
      ),
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "mail@adelnz.com" }),
    ).toHaveAttribute("href", "mailto:mail@adelnz.com")
    await expect(
      page.getByText("New Mexico limited liability company"),
    ).toBeVisible()
  })

  test("shared localized nav links home, consulting, and cv pages", async ({
    browser,
  }) => {
    const navCases = [
      {
        pages: ["/", "/consulting/", "/cv/"],
        navLabel: "Site navigation",
        links: {
          home: { name: "Home", href: "/" },
          consulting: { name: "Consulting", href: "/consulting" },
          cv: { name: "CV", href: "/cv" },
        },
      },
      {
        pages: ["/ru/", "/ru/consulting/", "/ru/cv/"],
        navLabel: "Навигация по сайту",
        links: {
          home: { name: "Главная", href: "/ru" },
          consulting: { name: "Консалтинг", href: "/ru/consulting" },
          cv: { name: "Резюме", href: "/ru/cv" },
        },
      },
      {
        pages: ["/tt/", "/tt/consulting/", "/tt/cv/"],
        navLabel: "Сайт навигациясе",
        links: {
          home: { name: "Баш бит", href: "/tt" },
          consulting: { name: "Консалтинг", href: "/tt/consulting" },
          cv: { name: "Резюме", href: "/tt/cv" },
        },
      },
    ]

    await Promise.all(
      navCases.flatMap(navCase =>
        navCase.pages.map(async pagePath => {
          const page = await browser.newPage()

          try {
            await routeBuiltFiles(page)

            const response = await page.goto(`${builtOrigin}${pagePath}`)

            expect(response?.ok() ?? false).toEqual(true)

            const nav = page.getByRole("navigation", {
              name: navCase.navLabel,
            })

            await expect(nav).toBeVisible()
            await expect(
              nav.getByRole("link", { name: navCase.links.home.name }),
            ).toHaveAttribute("href", navCase.links.home.href)
            await expect(
              nav.getByRole("link", { name: navCase.links.consulting.name }),
            ).toHaveAttribute("href", navCase.links.consulting.href)
            await expect(
              nav.getByRole("link", { name: navCase.links.cv.name }),
            ).toHaveAttribute("href", navCase.links.cv.href)

            const activeLinkKey = pagePath.endsWith("/consulting/")
              ? "consulting"
              : pagePath.endsWith("/cv/")
                ? "cv"
                : "home"
            const activeLinkName = navCase.links[activeLinkKey].name
            const inactiveLinkNames = [
              navCase.links.home.name,
              navCase.links.consulting.name,
              navCase.links.cv.name,
            ].filter(linkName => linkName !== activeLinkName)

            await expect(
              nav.getByRole("link", { name: activeLinkName }),
            ).toHaveAttribute("aria-current", "page")
            await Promise.all(
              inactiveLinkNames.map(async linkName => {
                await expect(
                  nav.getByRole("link", { name: linkName }),
                ).not.toHaveAttribute("aria-current", "page")
              }),
            )
          } finally {
            await page.close()
          }
        }),
      ),
    )
  })

  test("cv print media hides shared nav", async ({ page }) => {
    await routeBuiltFiles(page)

    const response = await page.goto(`${builtOrigin}/cv/`)

    expect(response?.ok() ?? false).toEqual(true)

    const nav = page.getByRole("navigation", { name: "Site navigation" })

    await expect(nav).toBeVisible()
    await page.emulateMedia({ media: "print" })
    await expect(nav).toBeHidden()
  })

  test("cv uses full mobile width while nav keeps mdx spacing", async ({
    browser,
  }) => {
    async function navMetricsFor(
      pathname: string,
      viewport: { height: number; width: number },
    ): Promise<{
      width: number
      x: number
    }> {
      const page = await browser.newPage({ viewport })

      try {
        await routeBuiltFiles(page)

        const response = await page.goto(`${builtOrigin}${pathname}`)

        expect(response?.ok() ?? false).toEqual(true)

        const navBox = await page
          .getByRole("navigation", { name: "Site navigation" })
          .boundingBox()

        if (navBox === null) {
          throw new Error(`Expected nav to have a bounding box on ${pathname}.`)
        }

        return {
          width: Math.round(navBox.width),
          x: Math.round(navBox.x),
        }
      } finally {
        await page.close()
      }
    }

    const desktopViewport = { width: 1280, height: 720 }
    const mobileViewport = { width: 390, height: 844 }

    const [desktopHomeMetrics, desktopCvMetrics, desktopConsultingMetrics] =
      await Promise.all([
        navMetricsFor("/", desktopViewport),
        navMetricsFor("/cv/", desktopViewport),
        navMetricsFor("/consulting/", desktopViewport),
      ])

    expect(desktopCvMetrics).toEqual(desktopHomeMetrics)
    expect(desktopConsultingMetrics).toEqual(desktopHomeMetrics)

    const [mobileHomeMetrics, mobileCvMetrics, mobileConsultingMetrics] =
      await Promise.all([
        navMetricsFor("/", mobileViewport),
        navMetricsFor("/cv/", mobileViewport),
        navMetricsFor("/consulting/", mobileViewport),
      ])

    expect(mobileCvMetrics).toEqual(mobileHomeMetrics)
    expect(mobileConsultingMetrics).toEqual(mobileHomeMetrics)

    const page = await browser.newPage({ viewport: mobileViewport })

    try {
      await routeBuiltFiles(page)

      const response = await page.goto(`${builtOrigin}/cv/`)

      expect(response?.ok() ?? false).toEqual(true)

      const mainBox = await page.locator("main").boundingBox()

      if (mainBox === null) {
        throw new Error("Expected cv content to have a bounding box.")
      }

      expect(Math.round(mainBox.x)).toEqual(0)
      expect(Math.round(mainBox.width)).toEqual(390)
    } finally {
      await page.close()
    }
  })
})
