import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { expect, type Page, test } from "@playwright/test"
import { load } from "js-yaml"
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
    const main = page.getByRole("main")

    await expect(
      main.getByRole("heading", { name: /consulting/i }),
    ).toBeVisible()
    await expect(
      main.getByRole("link", { name: "mail@adelnz.com" }),
    ).toHaveAttribute("href", "mailto:mail@adelnz.com")
    await expect(main.getByRole("link", { name: "Listenbox" })).toHaveAttribute(
      "href",
      "https://listenbox.app",
    )
    await expect(main.getByRole("link", { name: "Arrowbox" })).toHaveAttribute(
      "href",
      "https://arrowbox.co",
    )
    await expect(
      main.getByRole("link", { name: "ResponsibleAPI" }),
    ).toHaveAttribute("href", "https://responsibleapi.com")
    const selectedWorkLinks = [
      "Listenbox",
      "Arrowbox",
      "ResponsibleAPI",
      "GitHub",
      "CV",
    ]
    const selectedWorkLinkBoxes = await Promise.all(
      selectedWorkLinks.map(async linkName => {
        const box = await main.getByRole("link", { name: linkName }).boundingBox()

        if (box === null) {
          throw new Error(`Expected selected work link to be visible: ${linkName}.`)
        }

        return box
      }),
    )
    const selectedWorkLineTop = Math.round(selectedWorkLinkBoxes[0]?.y ?? 0)

    expect(
      selectedWorkLinkBoxes.map(box => Math.round(box.y)),
      "Expected selected work links to render on one line.",
    ).toEqual(selectedWorkLinks.map(() => selectedWorkLineTop))
    await expect(main.getByRole("link", { name: "CV" })).toHaveAttribute(
      "href",
      "/cv",
    )
    await expect(main.getByText(/Pneuma LLC/)).toBeVisible()
  })

  test("npm install article frontmatter matches article metadata and open graph tags", async ({
    page,
  }) => {
    function readArticleFrontmatter(markdownPath: string): {
      description: string
      publishedAtDateTime: string
      publishedAtText: string
      title: string
    } {
      const frontmatterMatch = readFileSync(markdownPath, "utf8").match(
        /^---\n(?<frontmatter>[\s\S]*?)\n---/,
      )

      if (frontmatterMatch?.groups?.frontmatter === undefined) {
        throw new Error(`Expected article frontmatter in ${markdownPath}.`)
      }

      const frontmatter = load(frontmatterMatch.groups.frontmatter)

      if (
        typeof frontmatter !== "object" ||
        frontmatter === null ||
        !("description" in frontmatter) ||
        !("published_at" in frontmatter) ||
        !("title" in frontmatter) ||
        typeof frontmatter.description !== "string" ||
        typeof frontmatter.title !== "string"
      ) {
        throw new Error(
          `Expected article title and description frontmatter in ${markdownPath}.`,
        )
      }

      const publishedAtValue = frontmatter.published_at

      if (
        !(publishedAtValue instanceof Date) &&
        typeof publishedAtValue !== "string"
      ) {
        throw new Error(
          `Expected article published_at frontmatter in ${markdownPath}.`,
        )
      }

      const publishedAtDate =
        publishedAtValue instanceof Date
          ? publishedAtValue
          : new Date(publishedAtValue)

      if (Number.isNaN(publishedAtDate.getTime())) {
        throw new Error(
          `Expected valid article published_at frontmatter in ${markdownPath}.`,
        )
      }

      const dateFormatter = new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
        year: "numeric",
      })

      return {
        description: frontmatter.description,
        publishedAtDateTime: publishedAtDate.toISOString().slice(0, 10),
        publishedAtText: dateFormatter.format(publishedAtDate),
        title: frontmatter.title,
      }
    }

    await routeBuiltFiles(page)

    const articlePath = join(
      "src",
      "content",
      "writing",
      "npm-install-is-dangerous.md",
    )
    const frontmatter = readArticleFrontmatter(articlePath)

    expect(
      existsSync(
        join(distDir, "writing", "npm-install-is-dangerous", "index.html"),
      ),
      "Expected /writing/npm-install-is-dangerous/ to be emitted as static HTML.",
    ).toEqual(true)

    const response = await page.goto(
      `${builtOrigin}/writing/npm-install-is-dangerous/`,
    )

    expect(response?.ok() ?? false).toEqual(true)
    await expect(
      page.getByRole("navigation", { name: "Site navigation" }),
    ).toBeVisible()
    await expect(
      page.getByRole("navigation", { name: "Switch language" }),
    ).toBeHidden()
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "adelnz.com",
    )
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      frontmatter.title,
    )
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute("content", frontmatter.description)

    const metadataTimes = page.getByRole("main").locator("time")

    await expect(metadataTimes.first()).toHaveAttribute(
      "datetime",
      frontmatter.publishedAtDateTime,
    )
    await expect(metadataTimes.first()).toHaveText(frontmatter.publishedAtText)
  })

  test("npm install article headings link to fragments and scroll there", async ({
    page,
  }) => {
    await routeBuiltFiles(page)
    await page.setViewportSize({ height: 900, width: 1280 })

    const articleUrl = `${builtOrigin}/writing/npm-install-is-dangerous/`
    const response = await page.goto(articleUrl)

    expect(response?.ok() ?? false).toEqual(true)

    const main = page.getByRole("main")
    const heading = main.getByRole("heading", {
      level: 2,
      name: "Attack vector",
    })

    await expect(heading).toHaveAttribute("id", "attack-vector")
    await expect(
      heading.getByRole("link", { name: "Attack vector" }),
    ).toHaveAttribute("href", "#attack-vector")

    const beforeScrollY = await page.evaluate(() => window.scrollY)
    const beforeHeadingTop = await heading.evaluate(
      element => element.getBoundingClientRect().top,
    )

    expect(beforeScrollY).toEqual(0)
    expect(beforeHeadingTop).toBeGreaterThan(0)

    await heading.click()

    await expect(page).toHaveURL(`${articleUrl}#attack-vector`)
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(beforeScrollY)
    await expect
      .poll(() =>
        heading.evaluate(element =>
          Math.abs(Math.round(element.getBoundingClientRect().top)),
        ),
      )
      .toBe(0)
  })

  test("tatar consulting page sets html language", async ({ page }) => {
    await routeBuiltFiles(page)

    expect(
      existsSync(join(distDir, "tt", "consulting", "index.html")),
      "Expected /tt/consulting/ to be emitted as static HTML.",
    ).toEqual(true)

    const response = await page.goto(`${builtOrigin}/tt/consulting/`)

    expect(response?.ok() ?? false).toEqual(true)
    await expect(page.locator("html")).toHaveAttribute("lang", "tt")
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

  test("cv exposes valid links", async ({ page }) => {
    function isInvalidHref(href: string): boolean {
      if (href.startsWith("/") || href.startsWith("#")) {
        return false
      }

      try {
        const url = new URL(href)

        return url.protocol !== "https:" && url.protocol !== "mailto:"
      } catch {
        return true
      }
    }

    await routeBuiltFiles(page)

    const response = await page.goto(`${builtOrigin}/cv/`)

    expect(response?.ok() ?? false).toEqual(true)

    const hrefs = await page.locator("main a").evaluateAll(links =>
      links.flatMap(link => {
        const href = link.getAttribute("href")

        return href === null ? [] : [href]
      }),
    )

    expect(hrefs).toEqual(
      expect.arrayContaining([
        "mailto:mail@adelnz.com",
        "https://www.linkedin.com/in/adelnizamuddin",
        "https://adelnz.com",
        "https://github.com/meoyawn",
      ]),
    )
    expect(hrefs.filter(isInvalidHref)).toEqual([])
  })

  test("cv shows ongoing Listenbox founder role", async ({ page }) => {
    await routeBuiltFiles(page)

    const response = await page.goto(`${builtOrigin}/cv/`)

    expect(response?.ok() ?? false).toEqual(true)

    const main = page.getByRole("main")
    const listenboxRole = main.locator(".break-inside-avoid-page", {
      has: page.getByRole("link", { name: "Listenbox", exact: true }),
    }).first()

    await expect(listenboxRole.getByRole("heading", { name: "Founder" })).toBeVisible()
    await expect(listenboxRole.getByText(/October 2019 - Present/)).toBeVisible()
  })

  test("cv uses full mobile width while default pages use wider mdx spacing", async ({
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

    expect(desktopConsultingMetrics).toEqual(desktopHomeMetrics)
    expect(desktopHomeMetrics.width).toBeGreaterThan(desktopCvMetrics.width)
    expect(desktopHomeMetrics.x).toBeLessThan(desktopCvMetrics.x)

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
