import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { expect, type Page, test } from "@playwright/test"
import { load } from "js-yaml"
import postcss from "postcss"
import {
  localizedRoute,
  routes,
  travelRoute,
  writingRoute,
} from "../src/routes.ts"

const siteUrl = process.env.SITE_URL?.replace(/\/$/, "")
const builtOrigin = siteUrl ?? "http://built.local"
const distDir = resolve("dist")
const devRoutesPath = "/@solid-static/routes.json"

const routeFileName = (route: string): string =>
  route === routes.home ? "index.html" : `${route.slice(1)}index.html`

interface HtmlTarget {
  diskPath: string | undefined
  fileName: string
  pagePath: string
}

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

  if (filePath.endsWith(".js")) {
    return "text/javascript"
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

const pagePathForFileName = (fileName: string): string => {
  if (fileName === "index.html") {
    return "/"
  }

  if (fileName.endsWith("/index.html")) {
    return `/${fileName.slice(0, -"index.html".length)}`
  }

  return `/${fileName}`
}

let liveRouteFileNamesPromise: Promise<string[]> | undefined

const liveRouteFileNames = async (): Promise<string[]> => {
  liveRouteFileNamesPromise ??= fetch(`${builtOrigin}${devRoutesPath}`).then(
    async response => {
      if (!response.ok) {
        throw new Error(
          `Expected ${builtOrigin}${devRoutesPath} to return the live route manifest.`,
        )
      }

      const value: unknown = await response.json()

      if (
        !Array.isArray(value) ||
        !value.every(item => typeof item === "string")
      ) {
        throw new TypeError(
          "Expected the live route manifest to contain file names.",
        )
      }

      return value
    },
  )

  return liveRouteFileNamesPromise
}

const collectHtmlTargets = async (): Promise<HtmlTarget[]> => {
  if (siteUrl !== undefined) {
    return (await liveRouteFileNames()).map(fileName => ({
      diskPath: undefined,
      fileName,
      pagePath: pagePathForFileName(fileName),
    }))
  }

  return collectHtmlFiles(distDir).map(diskPath => {
    const fileName = relative(distDir, diskPath)

    return {
      diskPath,
      fileName,
      pagePath: pagePathFor(diskPath),
    }
  })
}

const routeExists = async (fileName: string): Promise<boolean> =>
  siteUrl === undefined
    ? existsSync(join(distDir, fileName))
    : (await liveRouteFileNames()).includes(fileName)

const pdfPageCount = (pdf: Buffer): number =>
  pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length ?? 0

const routeBuiltFiles = async (page: Page): Promise<void> => {
  if (siteUrl !== undefined) {
    return
  }

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
    if (siteUrl === undefined) {
      expect(
        existsSync(distDir),
        `Expected ${distDir} to exist before running this test.`,
      ).toEqual(true)
    }

    const htmlTargets = await collectHtmlTargets()

    expect(
      htmlTargets.length,
      `Expected at least one HTML route from ${siteUrl ?? distDir}.`,
    ).toBeGreaterThan(0)

    await Promise.all(
      htmlTargets.map(async target => {
        await using page = await browser.newPage()

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
      }),
    )
  })

  test("every emitted html file references a processed SVG favicon", async ({
    browser,
  }) => {
    const htmlTargets = await collectHtmlTargets()

    await Promise.all(
      htmlTargets.map(async target => {
        await using page = await browser.newPage()

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
      }),
    )
  })

  test("consulting page presents business consulting details", async ({
    page,
  }) => {
    await routeBuiltFiles(page)

    expect(
      await routeExists(routeFileName(routes.consulting)),
      `Expected ${routes.consulting} to be emitted as static HTML.`,
    ).toEqual(true)

    const response = await page.goto(`${builtOrigin}${routes.consulting}`)

    expect(response?.ok() ?? false).toEqual(true)
    const main = page.getByRole("main")

    const consultingHeading = main.getByRole("heading", {
      name: /consulting/i,
    })
    await expect(consultingHeading).toBeVisible()
    await expect(main.locator("h2 a, h3 a, h4 a, h5 a, h6 a")).toHaveCount(0)
    await expect(
      main.getByRole("link", { name: "mail@adelnz.com" }),
    ).toHaveAttribute("href", "mailto:mail@adelnz.com")
    await expect(main.getByRole("link", { name: "Listenbox" })).toHaveAttribute(
      "href",
      "https://listenbox.app",
    )
    await expect(
      main.getByRole("link", { name: "ResponsibleAPI" }),
    ).toHaveAttribute("href", "https://responsibleapi.com")
    await expect(main.getByRole("link", { name: "CV" })).toHaveAttribute(
      "href",
      routes.cv,
    )
    await expect(main.getByText(/Pneuma LLC/)).toBeVisible()
  })

  test("travel globe shares depth with journey arcs and selects dated stays", async ({
    page,
  }) => {
    const pageErrors: string[] = []
    page.on("pageerror", error => pageErrors.push(error.message))

    await routeBuiltFiles(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ height: 800, width: 1200 })

    expect(
      await routeExists(routeFileName(routes.travel)),
      `Expected ${routes.travel} to be emitted as static HTML.`,
    ).toEqual(true)

    const response = await page.goto(`${builtOrigin}${routes.travel}`)

    expect(response?.ok() ?? false).toEqual(true)
    await expect(page.getByRole("main")).toHaveCount(1)
    await expect(
      page.getByRole("navigation", { name: "Site navigation" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible()
    await expect(page.getByRole("button", { name: "All journeys" })).toHaveCount(0)
    await expect(
      page.getByRole("heading", { level: 2, name: "All journeys" }),
    ).toBeVisible()
    await expect(page.locator("[data-travel-globe-status]")).toBeHidden()

    const canvas = page.getByRole("img", {
      name: "Interactive map of every travel destination",
    })
    const slider = page.getByRole("slider", { name: "Travel timeline" })
    const sliderInput = page.locator("[data-travel-thumb] input")

    await expect(canvas).toBeVisible()
    await expect(
      page.locator("[data-travel-map] canvas"),
      "Deck and MapLibre must share one WebGL canvas so the globe occludes back-side arcs.",
    ).toHaveCount(1)
    await expect(slider).toBeVisible()

    const june2023Day = Math.floor(
      Date.parse("2023-06-01T00:00:00Z") / 86_400_000,
    )

    await sliderInput.evaluate((element, value) => {
      if (!(element instanceof HTMLInputElement)) {
        throw new TypeError("Expected the Kobalte slider input.")
      }

      element.value = value
      element.dispatchEvent(new Event("change", { bubbles: true }))
    }, String(june2023Day))
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Kuala Lumpur, Malaysia",
      }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "2 May — 14 Jun 2023" }),
    ).toHaveAttribute("aria-pressed", "true")

    async function selectNoTripDate(noTripDate: string): Promise<void> {
      const noTripDay = Math.floor(
        Date.parse(`${noTripDate}T00:00:00Z`) / 86_400_000,
      )

      await sliderInput.evaluate((element, value) => {
        if (!(element instanceof HTMLInputElement)) {
          throw new TypeError("Expected the Kobalte slider input.")
        }

        element.value = value
        element.dispatchEvent(new Event("change", { bubbles: true }))
      }, String(noTripDay))
      await expect(
        page.getByRole("heading", { level: 2, name: "Kazan, Russia" }),
      ).toBeVisible()
      await expect(page.locator("[data-travel-visit]")).toHaveCount(0)
      await expect(page.locator("[data-travel-globe]")).not.toHaveAttribute(
        "data-active-event",
        /.+/,
      )
    }

    await selectNoTripDate("2014-09-17")
    await selectNoTripDate("2025-08-11")
    expect(pageErrors).toEqual([])
  })

  test("travel stay clicks update the timeline fragment", async ({ page }) => {
    await routeBuiltFiles(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ height: 800, width: 1200 })
    await page.goto(
      `${builtOrigin}${travelRoute("2023-05-02-kuala-lumpur")}`,
    )

    const august2022 = page.getByRole("button", {
      name: "5 Aug — 24 Aug 2022",
    })
    const sliderInput = page.locator("[data-travel-thumb] input")

    await august2022.click()
    await expect(august2022).toHaveAttribute("aria-pressed", "true")
    await expect(page).toHaveURL(
      `${builtOrigin}${travelRoute("2022-08-05-kuala-lumpur")}`,
    )
    await expect(sliderInput).toHaveValue(
      String(Math.floor(Date.parse("2022-08-05T00:00:00Z") / 86_400_000)),
    )
  })

  test("travel globe drag updates rotation state", async ({ page }) => {
    await routeBuiltFiles(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ height: 800, width: 1200 })
    await page.goto(`${builtOrigin}${routes.travel}`)

    const canvas = page.getByRole("img", {
      name: "Interactive map of every travel destination",
    })
    const globe = page.locator("[data-travel-globe]")

    const longitudeBeforeDrag = await globe.getAttribute("data-view-longitude")
    const canvasBox = await canvas.boundingBox()

    if (longitudeBeforeDrag === null) {
      throw new Error("Expected the globe to expose its longitude state.")
    }

    if (canvasBox === null) {
      throw new Error("Expected the travel globe canvas to have a bounding box.")
    }

    await page.mouse.move(
      canvasBox.x + canvasBox.width * 0.72,
      canvasBox.y + canvasBox.height * 0.52,
    )
    await page.mouse.down()
    await page.mouse.move(
      canvasBox.x + canvasBox.width * 0.48,
      canvasBox.y + canvasBox.height * 0.52,
      { steps: 2 },
    )
    await page.mouse.up()
    await expect(globe).not.toHaveAttribute(
      "data-view-longitude",
      longitudeBeforeDrag,
    )
  })

  test("travel globe zoom follows the mouse position", async ({ page }) => {
    await routeBuiltFiles(page)
    await page.setViewportSize({ height: 800, width: 1200 })
    await page.goto(`${builtOrigin}${routes.travel}`)

    const canvas = page.getByRole("img", {
      name: "Interactive map of every travel destination",
    })
    const globe = page.locator("[data-travel-globe]")
    const longitudeBeforeZoom = await globe.getAttribute("data-view-longitude")
    const canvasBox = await canvas.boundingBox()

    if (longitudeBeforeZoom === null) {
      throw new Error("Expected the globe to expose its longitude state.")
    }

    if (canvasBox === null) {
      throw new Error("Expected the travel globe canvas to have a bounding box.")
    }

    await page.mouse.move(
      canvasBox.x + canvasBox.width * 0.72,
      canvasBox.y + canvasBox.height * 0.52,
    )
    await page.mouse.wheel(0, -353)
    await expect(globe).not.toHaveAttribute(
      "data-view-longitude",
      longitudeBeforeZoom,
    )
  })

  test("travel controls remain available on mobile", async ({ page }) => {
    await routeBuiltFiles(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ height: 844, width: 390 })
    await page.goto(`${builtOrigin}${routes.travel}`)

    await expect(page.locator("[data-travel-globe-status]")).toBeHidden()
    await expect(
      page.getByRole("slider", { name: "Travel timeline" }),
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { level: 2, name: "All journeys" }),
    ).toBeVisible()
  })

  test("travel fragments restore the timeline and globe", async ({ page }) => {
    await routeBuiltFiles(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ height: 1000, width: 1600 })
    await page.goto(
      `${builtOrigin}${travelRoute("2014-08-31-new-york-city")}`,
    )
    expect(
      await page.locator("[data-travel-globe]").getAttribute(
        "data-view-longitude",
      ),
    ).toBe("-74.0060152")
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "New York City, United States",
      }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "31 Aug — 16 Sept 2014" }),
    ).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("[data-travel-thumb] input")).toHaveValue(
      String(Math.floor(Date.parse("2014-08-31T00:00:00Z") / 86_400_000)),
    )
    await expect(page.locator("[data-travel-globe]")).toHaveAttribute(
      "data-active-event",
      "2014-08-31-new-york-city",
    )
  })

  test("wide travel timeline can be scrubbed beside the site navigation", async ({
    page,
  }) => {
    await routeBuiltFiles(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ height: 1000, width: 1600 })
    await page.goto(`${builtOrigin}${routes.travel}`)

    const slider = page.getByRole("slider", { name: "Travel timeline" })
    const sliderInput = page.locator("[data-travel-thumb] input")
    const sliderTrack = page.locator("[data-travel-track]")
    const datePreview = page.locator("[data-travel-date-preview]")

    const initialValue = await sliderInput.inputValue()
    const sliderBox = await sliderTrack.boundingBox()

    if (sliderBox === null) {
      throw new Error("Expected the travel timeline to have a bounding box.")
    }

    await page.mouse.move(
      sliderBox.x + sliderBox.width * 0.2,
      sliderBox.y + sliderBox.height / 2,
    )
    await page.mouse.down()
    await expect(datePreview).toHaveAttribute("data-visible", "true")
    await page.mouse.move(
      sliderBox.x + sliderBox.width * 0.7,
      sliderBox.y + sliderBox.height / 2,
      { steps: 1 },
    )
    await expect(datePreview).toHaveText(/\d{1,2} [A-Z][a-z]{2,3} \d{4}/)
    await page.mouse.up()

    await expect(sliderInput).not.toHaveValue(initialValue)
    await expect(datePreview).toHaveAttribute("data-visible", "false")

    await slider.focus()
    await slider.press("Home")
    await expect(sliderInput).toHaveValue(initialValue)
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
      await routeExists(
        routeFileName(writingRoute("npm-install-is-dangerous")),
      ),
      `Expected ${writingRoute("npm-install-is-dangerous")} to be emitted as static HTML.`,
    ).toEqual(true)

    const response = await page.goto(
      `${builtOrigin}${writingRoute("npm-install-is-dangerous")}`,
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

    expect(
      readFileSync(
        join("src", "content", "writing", "npm-install-is-dangerous.md"),
        "utf8",
      ),
    ).toContain("## Attack vector")

    const articleUrl = `${builtOrigin}${writingRoute("npm-install-is-dangerous")}`
    const response = await page.goto(articleUrl)

    expect(response?.ok() ?? false).toEqual(true)

    const main = page.getByRole("main")
    const heading = main.getByRole("heading", {
      level: 2,
      name: "Attack vector",
    })

    await expect(heading).toHaveAttribute("id", "attack-vector")
    const headingLink = heading.getByRole("link", { name: "Attack vector" })

    await expect(headingLink).toHaveAttribute("href", "#attack-vector")
    const beforeScrollY = await page.evaluate(() => window.scrollY)

    expect(beforeScrollY).toEqual(0)

    await heading.click()

    await expect(page).toHaveURL(`${articleUrl}#attack-vector`)
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(beforeScrollY)
  })

  test("code highlighting preserves article source", async ({ page }) => {
    await routeBuiltFiles(page)

    const response = await page.goto(
      `${builtOrigin}${writingRoute("another-static-site-generator")}`,
    )

    expect(response?.ok() ?? false).toEqual(true)

    const codeBlock = page.getByRole("main").locator("pre.shiki code")

    await expect(codeBlock).toHaveCount(1)
    expect(await codeBlock.textContent()).toEqual(
      [
        'import counterIsland from "../app/counter-island.tsx?island"',
        "",
        '<script type="module" src={counterIsland} />',
      ].join("\n"),
    )
  })

  test("tatar consulting page sets html language", async ({ page }) => {
    await routeBuiltFiles(page)

    expect(
      await routeExists(routeFileName(localizedRoute("tt", "consulting"))),
      `Expected ${localizedRoute("tt", "consulting")} to be emitted as static HTML.`,
    ).toEqual(true)

    const response = await page.goto(
      `${builtOrigin}${localizedRoute("tt", "consulting")}`,
    )

    expect(response?.ok() ?? false).toEqual(true)
    await expect(page.locator("html")).toHaveAttribute("lang", "tt")
  })

  test("shared localized nav links home, consulting, and cv pages", async ({
    browser,
  }) => {
    const navCases = [
      {
        pages: [routes.home, routes.consulting, routes.cv],
        navLabel: "Site navigation",
        links: {
          home: { name: "Home", href: routes.home },
          consulting: { name: "Consulting", href: routes.consulting },
          cv: { name: "CV", href: routes.cv },
        },
      },
      {
        pages: [
          localizedRoute("ru", "home"),
          localizedRoute("ru", "consulting"),
          localizedRoute("ru", "cv"),
        ],
        navLabel: "Навигация по сайту",
        links: {
          home: { name: "Главная", href: localizedRoute("ru", "home") },
          consulting: {
            name: "Консалтинг",
            href: localizedRoute("ru", "consulting"),
          },
          cv: { name: "Резюме", href: localizedRoute("ru", "cv") },
        },
      },
      {
        pages: [
          localizedRoute("tt", "home"),
          localizedRoute("tt", "consulting"),
          localizedRoute("tt", "cv"),
        ],
        navLabel: "Сайт навигациясе",
        links: {
          home: { name: "Баш бит", href: localizedRoute("tt", "home") },
          consulting: {
            name: "Консалтинг",
            href: localizedRoute("tt", "consulting"),
          },
          cv: { name: "Резюме", href: localizedRoute("tt", "cv") },
        },
      },
    ]

    await Promise.all(
      navCases.flatMap(navCase =>
        navCase.pages.map(async pagePath => {
          await using page = await browser.newPage()

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

          const activeLinkKey = pagePath.endsWith(routes.consulting)
            ? "consulting"
            : pagePath.endsWith(routes.cv)
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
        }),
      ),
    )
  })

  test("locale switcher links use trailing-slash consulting routes", async ({
    browser,
  }) => {
    const localeSwitcherCases = [
      {
        pagePath: routes.consulting,
        navLabel: "Switch language",
        links: {
          en: { name: "EN", href: localizedRoute("en", "consulting") },
          ru: { name: "RU", href: localizedRoute("ru", "consulting") },
          tt: { name: "TT", href: localizedRoute("tt", "consulting") },
        },
      },
      {
        pagePath: localizedRoute("ru", "consulting"),
        navLabel: "Сменить язык",
        links: {
          en: { name: "EN", href: localizedRoute("en", "consulting") },
          ru: { name: "RU", href: localizedRoute("ru", "consulting") },
          tt: { name: "TT", href: localizedRoute("tt", "consulting") },
        },
      },
      {
        pagePath: localizedRoute("tt", "consulting"),
        navLabel: "Башка телләр",
        links: {
          en: { name: "EN", href: localizedRoute("en", "consulting") },
          ru: { name: "RU", href: localizedRoute("ru", "consulting") },
          tt: { name: "TT", href: localizedRoute("tt", "consulting") },
        },
      },
    ]

    await Promise.all(
      localeSwitcherCases.map(async switcherCase => {
        await using page = await browser.newPage()

        await routeBuiltFiles(page)

        const response = await page.goto(
          `${builtOrigin}${switcherCase.pagePath}`,
        )

        expect(response?.ok() ?? false).toEqual(true)

        const nav = page.getByRole("navigation", {
          name: switcherCase.navLabel,
        })

        await expect(nav).toBeVisible()
        await Promise.all(
          Object.values(switcherCase.links).map(async link => {
            await expect(
              nav.getByRole("link", { name: link.name }),
            ).toHaveAttribute("href", link.href)
          }),
        )
      }),
    )
  })

  test("cv print media hides shared nav", async ({ page }) => {
    await routeBuiltFiles(page)

    const response = await page.goto(`${builtOrigin}${routes.cv}`)

    expect(response?.ok() ?? false).toEqual(true)

    const nav = page.getByRole("navigation", { name: "Site navigation" })

    await expect(nav).toBeVisible()
    await page.emulateMedia({ media: "print" })
    await expect(nav).toBeHidden()
  })

  test("cv print PDF is exactly two pages in A4 and US Letter", async ({
    page,
  }) => {
    await routeBuiltFiles(page)

    const response = await page.goto(`${builtOrigin}${routes.cv}`)

    expect(response?.ok() ?? false).toEqual(true)
    await page.emulateMedia({ media: "print" })

    for (const format of ["A4", "Letter"]) {
      expect(
        pdfPageCount(
          await page.pdf({
            format,
            printBackground: true,
          }),
        ),
        `Expected /cv/ printed as ${format} to be exactly two pages.`,
      ).toEqual(2)
    }
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

    const response = await page.goto(`${builtOrigin}${routes.cv}`)

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

    const response = await page.goto(`${builtOrigin}${routes.cv}`)

    expect(response?.ok() ?? false).toEqual(true)

    const main = page.getByRole("main")
    const listenboxRole = main
      .locator(".break-inside-avoid-page", {
        has: page.getByRole("link", { name: "Listenbox", exact: true }),
      })
      .first()

    await expect(
      listenboxRole.getByRole("heading", { name: "Founder" }),
    ).toBeVisible()
    await expect(
      listenboxRole.getByText(/October 2019 - Present/),
    ).toBeVisible()
  })

})
