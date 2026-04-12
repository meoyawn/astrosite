#!/usr/bin/env bun
import { dirname, extname, resolve } from "node:path"
import { parseArgs } from "node:util"
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

  return exitWithError(
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

const getViewportWidth = (width: number) =>
  SCREENSHOT_BACKEND === "webkit"
    ? Math.ceil(width / WEBKIT_VIEWPORT_WIDTH_SCALE)
    : width

type ScreenshotResult = {
  outputPath: string
  title: string
  url: string
}

const exitWithError = (message: string): never => {
  console.error(message)
  process.exit(1)
}

const exitWithUnknownError = (error: unknown): never =>
  exitWithError(error instanceof Error ? error.message : String(error))

const parseWidth = (widthArg: string | undefined) => {
  if (widthArg === undefined) {
    return DEFAULT_WIDTH
  }

  const width = Number(widthArg)

  if (!Number.isInteger(width) || width <= 0) {
    exitWithError(
      `Invalid width "${widthArg}". Width must be a positive integer.`,
    )
  }

  return width
}

type CliArgs = {
  outputArg: string
  url: URL
  width: number
}

const parseCliArgs = (argv: readonly string[]): CliArgs => {
  try {
    const { positionals, values } = parseArgs({
      allowPositionals: true,
      args: argv,
      options: {
        width: {
          short: "w",
          type: "string",
        },
      },
      strict: true,
    })
    const [urlArg, outputArg] = positionals

    if (!urlArg || !outputArg || positionals.length > 2) {
      return exitWithError(
        "Usage: bun scripts/screenshot.ts [-w <width>] <url> <output-path>",
      )
    }

    if (!URL.canParse(urlArg)) {
      return exitWithError(`${urlArg} is not a valid URL`)
    }

    return {
      outputArg,
      url: new URL(urlArg),
      width: parseWidth(values.width),
    }
  } catch (error) {
    return exitWithUnknownError(error)
  }
}

const takeScreenshot = async (
  url: URL,
  outputArg: string,
  width: number,
): Promise<ScreenshotResult> => {
  const outputPath = resolve(outputArg)
  const format = getFormat(outputPath)
  const viewportWidth = getViewportWidth(width)

  await $`mkdir -p ${dirname(outputPath)}`

  await using view = new Bun.WebView({
    backend: SCREENSHOT_BACKEND,
    height: DEFAULT_HEIGHT,
    width: viewportWidth,
  })

  await view.navigate(url.href)
  await view.resize(
    viewportWidth,
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
  try {
    const { outputArg, url, width } = parseCliArgs(argv)

    console.log(JSON.stringify(await takeScreenshot(url, outputArg, width)))
  } catch (error) {
    exitWithUnknownError(error)
  }
}

if (import.meta.main) {
  await main(Bun.argv.slice(2))
}
