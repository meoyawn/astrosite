import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import sharp from "sharp"
import { describe, expect, test } from "vitest"

import { DEFAULT_WIDTH } from "./screenshot"
import fixtureHtml from "./test.html" with { type: "text" }

const getAvailablePort = () =>
  Math.floor(Math.random() * (65_000 - 10_000 + 1)) + 10_000

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

const withFixtureServer = async (
  fixture: string,
  func: (url: URL) => Promise<void>,
) => {
  const port = getAvailablePort()
  if (port < 10_000) {
    throw new Error("port is too low")
  }
  const server = Bun.serve({
    fetch(request) {
      return new URL(request.url).pathname === "/test.html"
        ? new Response(fixture, {
            headers: { "content-type": "text/html; charset=utf-8" },
          })
        : new Response("Not found", { status: 404 })
    },
    hostname: "::1",
    port,
  })

  try {
    await func(new URL(`http://[::1]:${port}/test.html`))
  } finally {
    await server.stop(true)
  }
}

describe("screenshot script", () => {
  test("writes an image using the default output width", async () => {
    await withTempDir(async tempDir => {
      await withFixtureServer(fixtureHtml.index, async url => {
        const outputPath = join(tempDir, "fixture.png")

        const process = Bun.spawn(
          ["bun", "scripts/screenshot.ts", url.href, outputPath],
          { stderr: "pipe", stdout: "pipe" },
        )
        const [exitCode, stderr] = await Promise.all([
          process.exited,
          new Response(process.stderr).text(),
        ])

        if (exitCode !== 0) {
          throw new Error(
            stderr || `screenshot.ts exited with code ${exitCode}`,
          )
        }

        const metadata = await sharp(outputPath).metadata()

        expect(metadata.width).toEqual(DEFAULT_WIDTH)
      })
    })
  })

  test(
    "writes an image for adelnz.com/cv using the default output width",
    { timeout: 30_000 },
    async () => {
      await withTempDir(async tempDir => {
        const outputPath = join(tempDir, "cv.png")

        const process = Bun.spawn(
          [
            "bun",
            "scripts/screenshot.ts",
            "https://adelnz.com/cv/",
            outputPath,
          ],
          { stderr: "pipe", stdout: "pipe" },
        )
        const [exitCode, stderr] = await Promise.all([
          process.exited,
          new Response(process.stderr).text(),
        ])

        if (exitCode !== 0) {
          throw new Error(
            stderr || `screenshot.ts exited with code ${exitCode}`,
          )
        }

        const metadata = await sharp(outputPath).metadata()

        expect(metadata.width).toEqual(DEFAULT_WIDTH)
      })
    },
  )

  test("exits with an error when the URL is invalid", async () => {
    await withTempDir(async tempDir => {
      const outputPath = join(tempDir, "fixture.png")

      const process = Bun.spawn(
        ["bun", "scripts/screenshot.ts", "not-a-url", outputPath],
        { stderr: "pipe", stdout: "pipe" },
      )
      const [exitCode, stderr] = await Promise.all([
        process.exited,
        new Response(process.stderr).text(),
      ])

      expect(exitCode).toEqual(1)
      expect(stderr.trim()).toEqual("not-a-url is not a valid URL")
    })
  })
})
