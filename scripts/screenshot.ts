#!/usr/bin/env bun
import { dirname, extname, resolve } from "node:path"
import Bun, { $ } from "bun"

export const DEFAULT_WIDTH = 1280
const DEFAULT_HEIGHT = 900

const SCREENSHOT_BACKEND = "webkit"
const WEBKIT_VIEWPORT_WIDTH_SCALE = 2

const screenshotFormats = {
  ".jpeg": "jpeg",
  ".jpg": "jpeg",
  ".png": "png",
  ".webp": "webp",
} as const

const isScreenshotExtension = (
  s: string,
): s is keyof typeof screenshotFormats => s in screenshotFormats

const getFormat = (outputPath: string) => {
  const extension = extname(outputPath).toLowerCase()

  if (isScreenshotExtension(extension)) {
    return screenshotFormats[extension]
  }

  throw new Error(
    `Unsupported screenshot format for "${outputPath}". Use .png, .jpg, .jpeg, or .webp.`,
  )
}

const getPageHeight = async (view: Bun.WebView) => {
  try {
    const height = Number(
      await view.evaluate(`
        Math.max(
          document.documentElement.scrollHeight,
          document.body?.scrollHeight ?? 0,
          window.innerHeight,
        )
      `),
    )

    return Number.isFinite(height) ? Math.ceil(height) + 40 : DEFAULT_HEIGHT
  } catch {
    return DEFAULT_HEIGHT
  }
}

const VIEWPORT_WIDTH =
  SCREENSHOT_BACKEND === "webkit"
    ? Math.ceil(DEFAULT_WIDTH / WEBKIT_VIEWPORT_WIDTH_SCALE)
    : DEFAULT_WIDTH

type ScreenshotResult = {
  outputPath: string
  title: string
  url: string
}

const takeScreenshot = async (
  url: URL,
  outputArg: string,
): Promise<ScreenshotResult> => {
  const outputPath = resolve(outputArg)
  const format = getFormat(outputPath)

  await $`mkdir -p ${dirname(outputPath)}`

  await using view = new Bun.WebView({
    backend: SCREENSHOT_BACKEND,
    height: DEFAULT_HEIGHT,
    width: VIEWPORT_WIDTH,
  })

  await view.navigate(url.href)
  await view.resize(
    VIEWPORT_WIDTH,
    Math.max(DEFAULT_HEIGHT, await getPageHeight(view)),
  )

  const screenshot = await view.screenshot({ format })
  await Bun.write(outputPath, screenshot)

  return {
    outputPath,
    title: view.title,
    url: view.url,
  }
}

const main = async (argv: readonly string[]) => {
  const [urlArg, outputArg] = argv

  if (!urlArg || !outputArg) {
    console.error("Usage: bun scripts/screenshot.ts <url> <output-path>")
    process.exitCode = 1
    return
  }

  if (!URL.canParse(urlArg)) {
    console.error(`${urlArg} is not a valid URL`)
    process.exitCode = 1
    return
  }

  const url = new URL(urlArg)

  console.log(JSON.stringify(await takeScreenshot(url, outputArg)))
}

if (import.meta.main) {
  await main(Bun.argv.slice(2))
}
