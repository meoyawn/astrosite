import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import sharp from "sharp"
import { describe, expect, test } from "vitest"

import { DEFAULT_WIDTH } from "./screenshot"

const fixtureUrl = new URL("./test.html", import.meta.url)

const withTempDir = async <Result>(
  func: (tempDir: string) => Promise<Result>,
): Promise<Result> => {
  const tempDir = await mkdtemp(join(tmpdir(), "screenshot-test-"))

  try {
    return await func(tempDir)
  } finally {
    await rm(tempDir, { force: true, recursive: true })
  }
}

const runScreenshot = async (args: string[]) => {
  const process = Bun.spawn(["scripts/screenshot.ts", ...args], {
    stderr: "pipe",
    stdout: "pipe",
  })
  const [exitCode, stderr] = await Promise.all([
    process.exited,
    new Response(process.stderr).text(),
  ])

  return {
    exitCode,
    stderr: stderr.trim(),
  }
}

const expectScreenshotToSucceed = async (args: string[]) => {
  const { exitCode, stderr } = await runScreenshot(args)

  if (exitCode !== 0) {
    throw new Error(stderr || `screenshot.ts exited with code ${exitCode}`)
  }
}

describe("screenshot script", () => {
  test(
    "writes an image using the default output width",
    { timeout: 45_000 },
    async () => {
      await withTempDir(async tempDir => {
        const outputPath = join(tempDir, "fixture.png")

        await expectScreenshotToSucceed([fixtureUrl.href, outputPath])

        const metadata = await sharp(outputPath).metadata()

        expect(metadata.width).toEqual(DEFAULT_WIDTH)
      })
    },
  )

  test.skip(
    "writes an image for adelnz.com/cv using the default output width because the network path is flaky in this environment",
    { timeout: 30_000 },
    async () => {
      await withTempDir(async tempDir => {
        const outputPath = join(tempDir, "cv.png")

        await expectScreenshotToSucceed(["https://adelnz.com/cv/", outputPath])

        const metadata = await sharp(outputPath).metadata()

        expect(metadata.width).toEqual(DEFAULT_WIDTH)
      })
    },
  )

  test(
    "writes an image using the provided output width",
    { timeout: 45_000 },
    async () => {
      await withTempDir(async tempDir => {
        const outputPath = join(tempDir, "fixture-100.png")

        await expectScreenshotToSucceed([
          "-w",
          "100",
          fixtureUrl.href,
          outputPath,
        ])

        const metadata = await sharp(outputPath).metadata()

        expect(metadata.width).toEqual(100)
      })
    },
  )

  test("exits with an error when the URL is invalid", async () => {
    await withTempDir(async tempDir => {
      const outputPath = join(tempDir, "fixture.png")

      const { exitCode, stderr } = await runScreenshot([
        "not-a-url",
        outputPath,
      ])

      expect(exitCode).toEqual(1)
      expect(stderr).toEqual("not-a-url is not a valid URL")
    })
  })

  test("exits with an error when the width is invalid", async () => {
    await withTempDir(async tempDir => {
      const outputPath = join(tempDir, "fixture.png")

      const { exitCode, stderr } = await runScreenshot([
        "-w",
        "0",
        "https://example.com",
        outputPath,
      ])

      expect(exitCode).toEqual(1)
      expect(stderr).toEqual(
        'Invalid width "0". Width must be a positive integer.',
      )
    })
  })
})
