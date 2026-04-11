#!/usr/bin/env bun
import { dirname, extname, resolve } from "node:path"
import Bun, { $ } from "bun"

export const DEFAULT_WIDTH = 1280
const DEFAULT_HEIGHT = 900
const PAGE_SETTLE_TIMEOUT_MS = 5_000
const PAGE_SETTLE_FRAMES = 3
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

/**
 * Detects Bun WebKit's intermittent evaluate callback failure so screenshot
 * capture can fall back to timed waits instead of exiting.
 */
const isRecoverableWebKitEvaluateError = (error: unknown) =>
  SCREENSHOT_BACKEND === "webkit" &&
  error instanceof Error &&
  error.message.includes(
    "Completion handler for function call is no longer reachable",
  )

/**
 * Runs the preferred WebKit flow and only falls back when Bun drops an evaluate
 * completion handler. All other errors are rethrown unchanged.
 */
const withWebKitFallback = async <T>(
  action: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> => {
  try {
    return await action()
  } catch (error) {
    if (!isRecoverableWebKitEvaluateError(error)) {
      throw error
    }

    return await fallback()
  }
}

const waitForAnimationFrames = async (view: Bun.WebView, frameCount = 2) => {
  await view.evaluate(`
    new Promise(resolve => {
      let remaining = ${frameCount}

      const tick = () => {
        remaining -= 1

        if (remaining <= 0) {
          resolve(true)
          return
        }

        requestAnimationFrame(tick)
      }

      requestAnimationFrame(tick)
    })
  `)
}

const waitForDocumentReady = async (view: Bun.WebView) => {
  await view.evaluate(`
    document.readyState === "complete"
      ? true
      : new Promise(resolve => {
          window.addEventListener("load", () => resolve(true), { once: true })
        })
  `)
}

const waitForPageAssets = async (view: Bun.WebView) => {
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
}

const waitForStablePage = async (view: Bun.WebView) => {
  await view.evaluate(`
    new Promise(resolve => {
      const startedAt = performance.now()
      const deadline = startedAt + ${PAGE_SETTLE_TIMEOUT_MS}
      let stableFrames = 0
      let lastSnapshot = ""

      const getSnapshot = () =>
        JSON.stringify({
          bodyChildCount: document.body?.childElementCount ?? 0,
          bodyHeight: Math.ceil(document.body?.getBoundingClientRect().height ?? 0),
          htmlHeight: Math.ceil(document.documentElement.getBoundingClientRect().height),
          imageStates: [...document.images].map(image => ({
            complete: image.complete,
            height: image.naturalHeight,
            width: image.naturalWidth,
          })),
          readyState: document.readyState,
          textLength: document.body?.innerText.trim().length ?? 0,
        })

      const tick = () => {
        const snapshot = getSnapshot()
        const bodyHeight = document.body?.getBoundingClientRect().height ?? 0
        const hasLayout = bodyHeight > 0 || document.documentElement.scrollHeight > window.innerHeight
        const isReady = document.readyState === "complete" && hasLayout

        stableFrames =
          isReady && snapshot === lastSnapshot ? stableFrames + 1 : 0
        lastSnapshot = snapshot

        if (stableFrames >= ${PAGE_SETTLE_FRAMES} || performance.now() >= deadline) {
          resolve(true)
          return
        }

        requestAnimationFrame(tick)
      }

      requestAnimationFrame(tick)
    })
  `)
}

const waitForPage = async (view: Bun.WebView) => {
  await waitForDocumentReady(view)
  await waitForPageAssets(view)
  await waitForStablePage(view)
  await waitForAnimationFrames(view)
}

const getViewportWidth = () =>
  SCREENSHOT_BACKEND === "webkit"
    ? Math.ceil(DEFAULT_WIDTH / WEBKIT_VIEWPORT_WIDTH_SCALE)
    : DEFAULT_WIDTH

type ScreenshotResult = {
  outputPath: string
  title: string
  url: string
}

export const takeScreenshot = async (
  url: URL,
  outputArg: string,
): Promise<ScreenshotResult> => {
  const outputPath = resolve(outputArg)
  const format = getFormat(outputPath)

  await $`mkdir -p ${dirname(outputPath)}`

  await using view = new Bun.WebView({
    backend: SCREENSHOT_BACKEND,
    height: DEFAULT_HEIGHT,
    width: getViewportWidth(),
  })

  await view.navigate(url.href)
  await withWebKitFallback(
    () => waitForPage(view),
    () => Bun.sleep(300),
  )
  await view.resize(
    getViewportWidth(),
    Math.max(
      DEFAULT_HEIGHT,
      (await withWebKitFallback(
        () => getPageHeight(view),
        async () => DEFAULT_HEIGHT,
      )) + 40,
    ),
  )
  await withWebKitFallback(
    async () => {
      await waitForStablePage(view)
      await waitForAnimationFrames(view)
    },
    () => Bun.sleep(200),
  )

  const screenshot = await view.screenshot({ format })
  await Bun.write(outputPath, screenshot)

  return {
    outputPath,
    title: view.title,
    url: view.url,
  }
}

export const main = async (argv = Bun.argv.slice(2)) => {
  const [urlArg, outputArg] = argv

  if (!urlArg || !outputArg) {
    console.error("Usage: bun scripts/screenshot.ts <url> <output-path>")
    process.exitCode = 1
    return
  }

  let url: URL

  try {
    url = new URL(urlArg)
  } catch {
    console.error(`${urlArg} is not a valid URL`)
    process.exitCode = 1
    return
  }

  console.log(JSON.stringify(await takeScreenshot(url, outputArg)))
}

if (import.meta.main) {
  await main()
}
