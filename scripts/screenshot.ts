#!/usr/bin/env bun
import { dirname, extname, resolve } from "node:path"
import Bun, { $ } from "bun"

export const DEFAULT_WIDTH = 1280
const DEFAULT_HEIGHT = 900
const WEBVIEW_WIDTH_SCALE = 2

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
  const height = Number(
    await view.evaluate(`
    Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0,
      window.innerHeight
    )
  `),
  )

  return Number.isFinite(height) ? Math.ceil(height) : DEFAULT_HEIGHT
}

const waitForPage = async (view: Bun.WebView) => {
  await view.evaluate(
    "document.fonts ? document.fonts.ready.then(() => true) : true",
  )
  await view.evaluate(`
    Promise.all(
      [...document.images]
        .filter(image => !image.complete)
        .map(
          image =>
            new Promise(resolve => {
              image.addEventListener("load", resolve, { once: true })
              image.addEventListener("error", resolve, { once: true })
            }),
        ),
    ).then(() => true)
  `)
  await Bun.sleep(300)
}

const getViewportWidth = () => Math.ceil(DEFAULT_WIDTH / WEBVIEW_WIDTH_SCALE)

type ScreenshotResult = {
  outputPath: string
  title: string
  url: string
}

export const takeScreenshot = async (
  url: string,
  outputArg: string,
): Promise<ScreenshotResult> => {
  const outputPath = resolve(outputArg)
  const format = getFormat(outputPath)

  await $`mkdir -p ${dirname(outputPath)}`

  await using view = new Bun.WebView({
    height: DEFAULT_HEIGHT,
    width: getViewportWidth(),
  })

  await view.navigate(url)
  await waitForPage(view)
  await view.resize(
    getViewportWidth(),
    Math.max(DEFAULT_HEIGHT, (await getPageHeight(view)) + 40),
  )
  await Bun.sleep(200)

  const screenshot = await view.screenshot({ format })
  await Bun.write(outputPath, screenshot)

  return {
    outputPath,
    title: view.title,
    url: view.url,
  }
}

export const main = async (argv = Bun.argv.slice(2)) => {
  const [url, outputArg] = argv

  if (!url || !outputArg) {
    console.error("Usage: bun scripts/screenshot.ts <url> <output-path>")
    process.exitCode = 1
    return
  }

  console.log(JSON.stringify(await takeScreenshot(url, outputArg)))
}

if (import.meta.main) {
  await main()
}
