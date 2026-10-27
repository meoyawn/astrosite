import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { expect, test } from "@playwright/test"
import { load } from "js-yaml"
import sharp from "sharp"
import {
  localizedRoute,
  routes,
  writingRoute,
} from "../src/routes.ts"

import {
  builtOrigin,
  distDir,
  routeBuiltFiles,
  routeExists,
  siteUrl,
  socialImagePattern,
} from "./site.ts"

const routeFileName = (route: string): string =>
  route === routes.home ? "index.html" : `${route.slice(1)}index.html`

const pdfPageCount = (pdf: Buffer): number =>
  pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length ?? 0

test.describe("e2e tests", () => {
  test("Open Graph image is a 1200 by 630 PNG smaller than the prior JPEG", async ({
    page,
  }) => {
    let imageUrl: string
    let image: Buffer

    if (siteUrl === undefined) {
      const html = readFileSync(join(distDir, "index.html"), "utf8")
      const match = html.match(
        /<meta property="og:image" content="(?<url>[^"]+)"/,
      )

      if (match?.groups?.url === undefined) {
        throw new Error("Expected built home page Open Graph image metadata.")
      }

      imageUrl = match.groups.url
      const imagePath = join(
        distDir,
        new URL(imageUrl, builtOrigin).pathname.replace(/^\//, ""),
      )

      expect(existsSync(imagePath)).toEqual(true)
      image = readFileSync(imagePath)
    } else {
      await page.goto(builtOrigin)
      const content = await page
        .locator('meta[property="og:image"]')
        .getAttribute("content")

      if (content === null) {
        throw new Error("Expected home page Open Graph image metadata.")
      }

      imageUrl = content
      const response = await page.request.get(
        new URL(imageUrl, builtOrigin).href,
      )

      expect(response.ok()).toEqual(true)
      expect(response.headers()["content-type"]).toContain("image/png")
      image = await response.body()
    }

    expect(imageUrl).toMatch(socialImagePattern)
    expect(image.subarray(0, 8).toString("hex")).toEqual("89504e470d0a1a0a")
    expect(image.byteLength).toBeLessThan(28_509)
    const metadata = await sharp(image).metadata()

    expect({
      height: metadata.height,
      width: metadata.width,
    }).toEqual({
      height: 630,
      width: 1200,
    })
  })

  test("work together page invites contact and presents real work", async ({
    page,
  }) => {
    await routeBuiltFiles(page)

    expect(
      await routeExists(routeFileName(routes.workTogether)),
      `Expected ${routes.workTogether} to be emitted as static HTML.`,
    ).toEqual(true)

    const response = await page.goto(`${builtOrigin}${routes.workTogether}`)

    expect(response?.ok() ?? false).toEqual(true)
    const main = page.getByRole("main")

    await expect(main.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(main.locator("h2 a, h3 a, h4 a, h5 a, h6 a")).toHaveCount(0)
    await expect(
      main.getByRole("link", { name: "mail@adelnz.com" }),
    ).toHaveAttribute("href", "mailto:mail@adelnz.com")
    await expect(main.getByRole("link", { name: "CV" })).toHaveAttribute(
      "href",
      routes.cv,
    )
    await expect(main.getByText(/Pneuma LLC/)).toBeVisible()
  })

  test("npm install article frontmatter matches HTML and Open Graph metadata", async ({
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
      "Adel Nizamutdinov",
    )
    await expect(page).toHaveTitle(frontmatter.title)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      frontmatter.description,
    )
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      frontmatter.title,
    )
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute("content", frontmatter.description)
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "article",
    )

    const metadataTimes = page.getByRole("main").locator("time")

    await expect(metadataTimes.first()).toHaveAttribute(
      "datetime",
      frontmatter.publishedAtDateTime,
    )
    await expect(metadataTimes.first()).toHaveText(frontmatter.publishedAtText)
  })

  test("article screenshots load as responsive assets", async ({
    page,
  }) => {
    await routeBuiltFiles(page)
    await page.setViewportSize({ height: 844, width: 390 })

    const response = await page.goto(
      `${builtOrigin}${writingRoute("a-self-modifying-ai-agent-part-one-choosing-a-language")}`,
    )

    expect(response?.ok() ?? false).toEqual(true)
    const screenshot = page.getByRole("img", { name: /ChatGPT process group/ })

    await screenshot.scrollIntoViewIfNeeded()
    await expect(screenshot).toHaveAttribute("src", /\/(assets|@solid-static\/images)\/[^/]+\.webp$/)
    await expect(screenshot).toHaveAttribute("srcset", /\S+ \d+w, \S+ \d+w/)
    await expect.poll(() => screenshot.evaluate(image =>
      image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
    )).toEqual(true)

    const bounds = await screenshot.boundingBox()
    expect(bounds).not.toEqual(null)
    if (bounds === null) {
      throw new Error("Expected the article screenshot to have visible dimensions.")
    }

    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390)
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

  test("article fragments stay aligned when an embed above expands", async ({
    page,
  }) => {
    await routeBuiltFiles(page)
    await page.setViewportSize({ height: 900, width: 1280 })
    await page.addInitScript(() => {
      addEventListener(
        "DOMContentLoaded",
        () => {
          document.documentElement.style.overflowAnchor = "none"
        },
        { once: true },
      )
    })
    await page.route("https://platform.x.com/widgets.js", async route => {
      await new Promise(finishDelay => setTimeout(finishDelay, 500))
      await route.fulfill({
        body: String.raw`document.querySelector(".twitter-tweet").style.height = "1288px"`,
        contentType: "text/javascript",
      })
    })

    const response = await page.goto(
      `${builtOrigin}${writingRoute("javascript-binaries")}#results`,
    )

    expect(response?.ok() ?? false).toEqual(true)

    const heading = page.getByRole("heading", { level: 2, name: "Results" })

    await expect(page.locator(".twitter-tweet")).toHaveCSS("height", "1288px")
    await expect
      .poll(async () =>
        Math.abs(
          await heading.evaluate(element => element.getBoundingClientRect().top),
        ),
      )
      .toBeLessThan(1)
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

  test("code highlighting colors equivalent object keys consistently", async ({
    page,
  }) => {
    await routeBuiltFiles(page)

    const response = await page.goto(
      `${builtOrigin}${writingRoute("how-to-http-json")}`,
    )

    expect(response?.ok() ?? false).toEqual(true)

    const codeBlock = page.getByRole("main").locator("pre.shiki code").first()
    const requestKey = codeBlock.locator("span").filter({ hasText: /^req$/ })
    const responseKey = codeBlock.locator("span").filter({ hasText: /^res$/ })

    await expect(requestKey).toHaveCount(1)
    await expect(responseKey).toHaveCount(1)
    expect(await requestKey.evaluate((element) => element.style.color)).toEqual(
      await responseKey.evaluate((element) => element.style.color),
    )
  })

  test("tatar work together page sets html language", async ({ page }) => {
    await routeBuiltFiles(page)

    expect(
      await routeExists(routeFileName(localizedRoute("tt", "workTogether"))),
      `Expected ${localizedRoute("tt", "workTogether")} to be emitted as static HTML.`,
    ).toEqual(true)

    const response = await page.goto(
      `${builtOrigin}${localizedRoute("tt", "workTogether")}`,
    )

    expect(response?.ok() ?? false).toEqual(true)
    await expect(page.locator("html")).toHaveAttribute("lang", "tt")
  })

  test("home timepiece island loads and animates", async ({ page }) => {
    const pageErrors: string[] = []
    page.on("pageerror", error => pageErrors.push(error.message))

    await routeBuiltFiles(page)
    await page.emulateMedia({ reducedMotion: "no-preference" })
    const response = await page.goto(`${builtOrigin}${routes.home}`)

    expect(response?.ok() ?? false).toEqual(true)
    const timepiece = page.locator("#home-timepiece")
    const islandScript = timepiece.locator('script[type="module"]')
    await expect(islandScript).toHaveAttribute("src", /\S+/)
    await expect(timepiece).toHaveAttribute("data-running", "true")
    await expect.poll(() => timepiece.evaluate(element =>
      element.getAnimations({ subtree: true }).filter(animation =>
        animation.playState === "running",
      ).length,
    )).toEqual(2)

    await page.emulateMedia({ reducedMotion: "reduce" })
    await expect(timepiece).toHaveAttribute("data-running", "false")
    expect(pageErrors).toEqual([])
  })

  test("localized home pages use the shell-free author index", async ({
    browser,
  }) => {
    const homeCases = [
      {
        pagePath: routes.home,
        navLabel: "Site navigation",
        switcherLabel: "Switch language",
        title: "Producing software",
        recent: "Recent",
      },
      {
        pagePath: localizedRoute("ru", "home"),
        navLabel: "Навигация по сайту",
        switcherLabel: "Сменить язык",
        title: "Выпускаю софт",
        recent: "Недавнее",
      },
      {
        pagePath: localizedRoute("tt", "home"),
        navLabel: "Сайт навигациясе",
        switcherLabel: "Башка телләр",
        title: "Программалар чыгарам",
        recent: "Соңгы язмалар",
      },
    ]

    await Promise.all(
      homeCases.map(async homeCase => {
        await using page = await browser.newPage()

        await routeBuiltFiles(page)

        const response = await page.goto(`${builtOrigin}${homeCase.pagePath}`)

        expect(response?.ok() ?? false).toEqual(true)
        await expect(
          page.getByRole("navigation", { name: homeCase.navLabel }),
        ).toHaveCount(0)
        await expect(
          page.getByRole("navigation", { name: homeCase.switcherLabel }),
        ).toBeVisible()
        await expect(
          page.getByRole("heading", { level: 1, name: homeCase.title }),
        ).toBeVisible()
        await expect(
          page.getByRole("heading", { level: 2, name: homeCase.recent }),
        ).toBeVisible()
        const externalLinks = page.locator('main a[href^="http"]')
        await Promise.all(
          (await externalLinks.all()).map(async link => {
            await expect(link).toHaveAttribute("rel", "noreferrer")
            await expect(link).toHaveAttribute("target", "_blank")
          }),
        )
        await expect(
          page.locator("#writing-heading + ol article p"),
        ).toHaveCount(0)
      }),
    )
  })

  test("shared localized shell links home, work together, and cv", async ({
    browser,
  }) => {
    const navCases = [
      {
        pages: [routes.workTogether, routes.cv],
        navLabel: "Site navigation",
        links: {
          home: { name: "Producing software", href: routes.home },
          workTogether: { name: "Work together", href: routes.workTogether },
          cv: { name: "CV", href: routes.cv },
        },
      },
      {
        pages: [
          localizedRoute("ru", "workTogether"),
          localizedRoute("ru", "cv"),
        ],
        navLabel: "Навигация по сайту",
        links: {
          home: {
            name: "Выпускаю софт",
            href: localizedRoute("ru", "home"),
          },
          workTogether: {
            name: "Поработаем вместе",
            href: localizedRoute("ru", "workTogether"),
          },
          cv: { name: "Резюме", href: localizedRoute("ru", "cv") },
        },
      },
      {
        pages: [
          localizedRoute("tt", "workTogether"),
          localizedRoute("tt", "cv"),
        ],
        navLabel: "Сайт навигациясе",
        links: {
          home: {
            name: "Программалар чыгарам",
            href: localizedRoute("tt", "home"),
          },
          workTogether: {
            name: "Бергә эшлик",
            href: localizedRoute("tt", "workTogether"),
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
            nav.getByRole("link", { name: navCase.links.workTogether.name }),
          ).toHaveAttribute("href", navCase.links.workTogether.href)
          await expect(
            nav.getByRole("link", { name: navCase.links.cv.name }),
          ).toHaveAttribute("href", navCase.links.cv.href)

          const activeLinkKey = pagePath.endsWith(routes.workTogether)
            ? "workTogether"
            : "cv"
          const activeLinkName = navCase.links[activeLinkKey].name
          const inactiveLinkNames = [
            navCase.links.home.name,
            navCase.links.workTogether.name,
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

  test("locale switcher links use trailing-slash work together routes", async ({
    browser,
  }) => {
    const localeSwitcherCases = [
      {
        pagePath: routes.workTogether,
        navLabel: "Switch language",
        links: {
          en: { name: "EN", href: localizedRoute("en", "workTogether") },
          ru: { name: "RU", href: localizedRoute("ru", "workTogether") },
          tt: { name: "TT", href: localizedRoute("tt", "workTogether") },
        },
      },
      {
        pagePath: localizedRoute("ru", "workTogether"),
        navLabel: "Сменить язык",
        links: {
          en: { name: "EN", href: localizedRoute("en", "workTogether") },
          ru: { name: "RU", href: localizedRoute("ru", "workTogether") },
          tt: { name: "TT", href: localizedRoute("tt", "workTogether") },
        },
      },
      {
        pagePath: localizedRoute("tt", "workTogether"),
        navLabel: "Башка телләр",
        links: {
          en: { name: "EN", href: localizedRoute("en", "workTogether") },
          ru: { name: "RU", href: localizedRoute("ru", "workTogether") },
          tt: { name: "TT", href: localizedRoute("tt", "workTogether") },
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

  test("cv print PDF is exactly two pages in A4 and US Letter with standard margins", async ({
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
            margin: {
              bottom: "10mm",
              left: "10mm",
              right: "10mm",
              top: "10mm",
            },
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

})
