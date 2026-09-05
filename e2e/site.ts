import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import type { Page } from "@playwright/test"

export const siteUrl = process.env.SITE_URL?.replace(/\/$/, "")
export const builtOrigin = siteUrl ?? "http://built.local"
export const socialImagePattern =
  /^https?:\/\/[^/]+\/assets\/og-[\w-]+\.png$/
export const distDir = resolve("dist")
const devRoutesPath = "/@solid-static/routes.json"

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

function contentTypeFor(filePath: string): string {
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

function filePathFor(pathname: string): string {
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

function pagePathForFileName(fileName: string): string {
  if (fileName === "index.html") {
    return "/"
  }

  if (fileName.endsWith("/index.html")) {
    return `/${fileName.slice(0, -"index.html".length)}`
  }

  return `/${fileName}`
}

let liveRouteFileNamesPromise: Promise<string[]> | undefined

async function liveRouteFileNames(): Promise<string[]> {
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

export async function collectHtmlTargets(): Promise<HtmlTarget[]> {
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

export async function markdown404SourceFor(
  target: HtmlTarget,
): Promise<string | undefined> {
  if (target.fileName !== "404.html") {
    return undefined
  }

  const source =
    target.diskPath === undefined
      ? await fetch(`${builtOrigin}${target.pagePath}`).then(response =>
          response.text(),
        )
      : readFileSync(target.diskPath, "utf8")

  return source.trimStart().startsWith("# Page not found") ? source : undefined
}

export const routeExists = async (fileName: string): Promise<boolean> =>
  siteUrl === undefined
    ? existsSync(join(distDir, fileName))
    : (await liveRouteFileNames()).includes(fileName)

export async function routeBuiltFiles(page: Page): Promise<void> {
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
